import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const getBaseUrl = (): string => {
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

  console.log("[trpc] missing api base url", {
    EXPO_PUBLIC_RORK_API_BASE_URL: envUrl,
    hostUri,
  });
  throw new Error(
    "Missing API base URL (EXPO_PUBLIC_RORK_API_BASE_URL). Please restart the dev server.",
  );
};

const trpcUrl = `${getBaseUrl()}/api/trpc`;
console.log("[trpc] client url:", trpcUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
    }),
  ],
});
