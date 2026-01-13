import * as z from "zod";
import { SignJWT, jwtVerify } from "jose";

import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery } from "../../db";

interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "daily-app-secret-key-2026"
);
const JWT_EXPIRES_IN = "30d";

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
  const data = encoder.encode(password + "daily-app-salt-v2");
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
      const normalizedEmail = email.toLowerCase().trim();

      console.log("[auth] signup attempt for:", normalizedEmail);

      const existingUsers = await dbQuery<DbUser>(
        `SELECT * FROM users WHERE email = "${normalizedEmail}"`
      );

      if (existingUsers.length > 0) {
        console.log("[auth] signup failed - email already registered");
        throw new Error("Email already registered");
      }

      const passwordHash = await hashPassword(password);
      const id = generateId();
      const createdAt = new Date().toISOString();

      await dbQuery(
        `CREATE users SET id = "${id}", email = "${normalizedEmail}", passwordHash = "${passwordHash}", createdAt = "${createdAt}"`
      );

      console.log("[auth] user created:", id);

      const token = await generateToken(id, normalizedEmail);

      return {
        user: { id, email: normalizedEmail, createdAt },
        token,
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;
      const normalizedEmail = email.toLowerCase().trim();

      console.log("[auth] login attempt for:", normalizedEmail);

      const users = await dbQuery<DbUser>(
        `SELECT * FROM users WHERE email = "${normalizedEmail}"`
      );

      if (users.length === 0) {
        console.log("[auth] login failed - user not found");
        throw new Error("Invalid email or password");
      }

      const user = users[0];
      const isValid = await verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        console.log("[auth] login failed - invalid password");
        throw new Error("Invalid email or password");
      }

      const token = await generateToken(user.id, normalizedEmail);

      console.log("[auth] login success:", user.id);

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

        console.log("[auth] verifying token for user:", userId);

        const users = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE id = "${userId}"`
        );

        if (users.length === 0) {
          console.log("[auth] token verify failed - user not found");
          return { valid: false };
        }

        const user = users[0];
        return {
          valid: true,
          user: { id: user.id, email: user.email, createdAt: user.createdAt },
        };
      } catch (error) {
        console.log("[auth] token verify failed:", error);
        return { valid: false };
      }
    }),

  deleteAccount: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { payload } = await jwtVerify(input.token, JWT_SECRET);
        const userId = payload.userId as string;

        console.log("[auth] deleting account:", userId);

        await dbQuery(`DELETE FROM users WHERE id = "${userId}"`);

        return { success: true };
      } catch (error) {
        console.log("[auth] delete account failed:", error);
        throw new Error("Failed to delete account");
      }
    }),
});
