import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { authRouter } from "./routes/auth";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
