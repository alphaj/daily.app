import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

// Hardcoded fallback for production - ensures app never crashes on startup
const FALLBACK_API_URL = "https://api.rivet.dev";

const getBaseUrl = (): string => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (envUrl) {
      const normalized = normalizeBaseUrl(envUrl);
      console.log("[trpc] using EXPO_PUBLIC_RORK_API_BASE_URL:", normalized);
      return normalized;
    }

    const hostUri = (Constants.expoConfig?.hostUri ?? (Constants as any).hostUri) as
      | string
      | undefined;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      const inferred = `https://${host}`;
      const normalized = normalizeBaseUrl(inferred);
      console.log("[trpc] inferred base url from hostUri:", normalized, { hostUri });
      return normalized;
    }

    // Use fallback instead of throwing - prevents black screen crash
    console.log("[trpc] using fallback API URL:", FALLBACK_API_URL);
    return FALLBACK_API_URL;
  } catch (error) {
    console.error("[trpc] error getting base url, using fallback:", error);
    return FALLBACK_API_URL;
  }
};

// Lazy initialization to prevent crashes at module load time
let _trpcClient: ReturnType<typeof trpc.createClient> | null = null;

const getTrpcUrl = () => {
  const url = `${getBaseUrl()}/api/trpc`;
  console.log("[trpc] client url:", url);
  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getTrpcUrl(),
      transformer: superjson,
    }),
  ],
});
