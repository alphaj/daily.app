import * as z from "zod";
import { SignJWT, jwtVerify } from "jose";

import { createTRPCRouter, publicProcedure } from "../create-context";

const users: Map<string, { id: string; email: string; passwordHash: string; createdAt: string }> = new Map();

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "daily-app-secret-key-change-in-production"
);
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

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

async function generateToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ userId, email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);
}

function generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const authRouter = createTRPCRouter({
    signup: publicProcedure
        .input(signupSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;

            const existingUser = Array.from(users.values()).find(u => u.email === email);
            if (existingUser) {
                throw new Error("Email already registered");
            }

            const passwordHash = await hashPassword(password);

            const id = generateId();
            const createdAt = new Date().toISOString();

            users.set(id, { id, email, passwordHash, createdAt });

            const token = await generateToken(id, email);

            return {
                user: { id, email, createdAt },
                token,
            };
        }),

    login: publicProcedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            const { email, password } = input;

            const user = Array.from(users.values()).find(u => u.email === email);
            if (!user) {
                throw new Error("Invalid email or password");
            }

            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                throw new Error("Invalid email or password");
            }

            const token = await generateToken(user.id, email);

            return {
                user: { id: user.id, email: user.email, createdAt: user.createdAt },
                token,
            };
        }),

    verifyToken: publicProcedure
        .input(verifyTokenSchema)
        .mutation(async ({ input }) => {
            try {
                const { payload } = await jwtVerify(input.token, JWT_SECRET);
                const userId = payload.userId as string;
                const user = users.get(userId);

                if (!user) {
                    return { valid: false };
                }

                return {
                    valid: true,
                    user: { id: user.id, email: user.email, createdAt: user.createdAt },
                };
            } catch {
                return { valid: false };
            }
        }),
});
