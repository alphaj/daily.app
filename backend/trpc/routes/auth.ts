import * as z from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { createTRPCRouter, publicProcedure } from "../create-context";

// In-memory user storage (replace with database in production)
const users: Map<string, { id: string; email: string; passwordHash: string; createdAt: string }> = new Map();

// JWT secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || "daily-app-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

const signupSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const verifyTokenSchema = z.object({
    token: z.string(),
});

function generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const authRouter = createTRPCRouter({
    signup: publicProcedure
        .input(signupSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;

            // Check if user already exists
            const existingUser = Array.from(users.values()).find(u => u.email === email);
            if (existingUser) {
                throw new Error("Email already registered");
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const id = generateId();
            const createdAt = new Date().toISOString();

            users.set(id, { id, email, passwordHash, createdAt });

            // Generate JWT token
            const token = generateToken(id, email);

            return {
                user: { id, email, createdAt },
                token,
            };
        }),

    login: publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;

            // Find user by email
            const user = Array.from(users.values()).find(u => u.email === email);
            if (!user) {
                throw new Error("Invalid email or password");
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                throw new Error("Invalid email or password");
            }

            // Generate JWT token
            const token = generateToken(user.id, email);

            return {
                user: { id: user.id, email: user.email, createdAt: user.createdAt },
                token,
            };
        }),

    verifyToken: publicProcedure
        .input(verifyTokenSchema)
        .mutation(({ input }) => {
            try {
                const decoded = jwt.verify(input.token, JWT_SECRET) as { userId: string; email: string };
                const user = users.get(decoded.userId);

                if (!user) {
                    return { valid: false };
                }

                return {
                    valid: true,
                    user: { id: user.id, email: user.email, createdAt: user.createdAt },
                };
            } catch (error) {
                return { valid: false };
            }
        }),
});
