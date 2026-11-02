"use client";

// The one Neon client for the whole app. Managed Better Auth handles accounts,
// and the Data API attaches the signed-in user's token to every database request.
import { createClient } from "@neondatabase/neon-js";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

if (!authUrl || !dataApiUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_NEON_AUTH_URL or NEXT_PUBLIC_NEON_DATA_API_URL. " +
      "Copy .env.example to .env.local and fill in the values from the Neon Console."
  );
}

export const client = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: authUrl,
  },
  dataApi: {
    url: dataApiUrl,
  },
});
