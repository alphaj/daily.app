import * as z from "zod";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";

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

const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyResetCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

interface DbPasswordReset {
  id: string;
  email: string;
  code: string;
  expiresAt: string;
  used: boolean;
}

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

      try {
        const existingUsers = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE email = $email`,
          { email: normalizedEmail }
        );

        console.log("[auth] existing users check:", existingUsers.length);

        if (existingUsers.length > 0) {
          console.log("[auth] signup failed - email already registered");
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        const passwordHash = await hashPassword(password);
        const id = generateId();
        const createdAt = new Date().toISOString();

        await dbQuery(
          `CREATE users SET id = $id, email = $email, passwordHash = $passwordHash, createdAt = $createdAt`,
          { id, email: normalizedEmail, passwordHash, createdAt }
        );

        console.log("[auth] user created:", id);

        const token = await generateToken(id, normalizedEmail);

        return {
          user: { id, email: normalizedEmail, createdAt },
          token,
        };
      } catch (error) {
        console.error("[auth] signup error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;
      const normalizedEmail = email.toLowerCase().trim();

      console.log("[auth] login attempt for:", normalizedEmail);

      try {
        const users = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE email = $email`,
          { email: normalizedEmail }
        );

        console.log("[auth] found users:", users.length);

        if (users.length === 0) {
          console.log("[auth] login failed - user not found");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const user = users[0];
        const isValid = await verifyPassword(password, user.passwordHash);
        
        if (!isValid) {
          console.log("[auth] login failed - invalid password");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const token = await generateToken(user.id, normalizedEmail);

        console.log("[auth] login success:", user.id);

        return {
          user: { id: user.id, email: user.email, createdAt: user.createdAt },
          token,
        };
      } catch (error) {
        console.error("[auth] login error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed. Please try again.",
        });
      }
    }),

  verifyToken: publicProcedure
    .input(verifyTokenSchema)
    .mutation(async ({ input }) => {
      try {
        const { payload } = await jwtVerify(input.token, JWT_SECRET);
        const userId = payload.userId as string;

        console.log("[auth] verifying token for user:", userId);

        const users = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE id = $id`,
          { id: userId }
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

        await dbQuery(`DELETE FROM users WHERE id = $id`, { id: userId });

        return { success: true };
      } catch (error) {
        console.log("[auth] delete account failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete account",
        });
      }
    }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ input }) => {
      try {
        const normalizedEmail = input.email.toLowerCase().trim();
        console.log("[auth] password reset requested for:", normalizedEmail);

        const users = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE email = $email`,
          { email: normalizedEmail }
        );

        if (users.length === 0) {
          console.log("[auth] password reset - email not found, returning success anyway");
          return { success: true, message: "If an account exists, a reset code has been sent." };
        }

        try {
          await dbQuery(`DELETE FROM password_resets WHERE email = $email`, { email: normalizedEmail });
        } catch (deleteError) {
          console.log("[auth] delete old resets failed (may not exist):", deleteError);
        }

        const code = generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const resetId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await dbQuery(
          `CREATE password_resets SET id = $id, email = $email, code = $code, expiresAt = $expiresAt, used = false`,
          { id: resetId, email: normalizedEmail, code, expiresAt }
        );

        console.log("[auth] password reset code generated:", code);

        return { 
          success: true, 
          message: "If an account exists, a reset code has been sent.",
          code: code,
        };
      } catch (error) {
        console.error("[auth] requestPasswordReset error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process password reset request",
        });
      }
    }),

  verifyResetCode: publicProcedure
    .input(verifyResetCodeSchema)
    .mutation(async ({ input }) => {
      const normalizedEmail = input.email.toLowerCase().trim();
      console.log("[auth] verifying reset code for:", normalizedEmail);

      try {
        const resets = await dbQuery<DbPasswordReset>(
          `SELECT * FROM password_resets WHERE email = $email AND code = $code AND used = false`,
          { email: normalizedEmail, code: input.code }
        );

        if (resets.length === 0) {
          console.log("[auth] reset code not found or already used");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired code",
          });
        }

        const reset = resets[0];
        if (new Date(reset.expiresAt) < new Date()) {
          console.log("[auth] reset code expired");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Code has expired. Please request a new one.",
          });
        }

        console.log("[auth] reset code verified successfully");
        return { valid: true };
      } catch (error) {
        console.error("[auth] verifyResetCode error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify code",
        });
      }
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const normalizedEmail = input.email.toLowerCase().trim();
      console.log("[auth] resetting password for:", normalizedEmail);

      try {
        const resets = await dbQuery<DbPasswordReset>(
          `SELECT * FROM password_resets WHERE email = $email AND code = $code AND used = false`,
          { email: normalizedEmail, code: input.code }
        );

        if (resets.length === 0) {
          console.log("[auth] reset code not found or already used");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired code",
          });
        }

        const reset = resets[0];
        if (new Date(reset.expiresAt) < new Date()) {
          console.log("[auth] reset code expired");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Code has expired. Please request a new one.",
          });
        }

        const newPasswordHash = await hashPassword(input.newPassword);

        await dbQuery(
          `UPDATE users SET passwordHash = $passwordHash WHERE email = $email`,
          { passwordHash: newPasswordHash, email: normalizedEmail }
        );

        await dbQuery(
          `UPDATE password_resets SET used = true WHERE id = $id`,
          { id: reset.id }
        );

        console.log("[auth] password reset successful");

        const users = await dbQuery<DbUser>(
          `SELECT * FROM users WHERE email = $email`,
          { email: normalizedEmail }
        );

        if (users.length > 0) {
          const user = users[0];
          const token = await generateToken(user.id, normalizedEmail);
          return {
            success: true,
            user: { id: user.id, email: user.email, createdAt: user.createdAt },
            token,
          };
        }

        return { success: true };
      } catch (error) {
        console.error("[auth] resetPassword error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset password",
        });
      }
    }),
});
