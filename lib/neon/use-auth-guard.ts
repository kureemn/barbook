"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/neon/client";

type GuardStatus = "checking" | "authed" | "anonymous";

/**
 * Resolves auth state for route guards using the imperative `getSession()`
 * call rather than the reactive `useSession()` hook.
 *
 * Why: `useSession()` is fine for UI that stays mounted across navigations
 * (see components/site-header.tsx), but a page component that mounts fresh
 * on every navigation can render once with the hook's not-yet-synced
 * default state before its subscription catches up. Redirecting on that
 * first render bounces a genuinely signed-in user back to the sign-in page.
 * `getSession()` reads the SDK's already-warm session cache directly
 * (documented as "cached... returns instantly"), so it doesn't have that
 * mount-order race.
 */
function useAuthStatus(): GuardStatus {
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setStatus(data?.user ? "authed" : "anonymous");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

/** Redirects to `redirectTo` once we've confirmed there is no session. */
export function useRequireAuth(redirectTo = "/auth/sign-in") {
  const status = useAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace(redirectTo);
  }, [status, router, redirectTo]);

  return status;
}

/** Redirects to `redirectTo` once we've confirmed there IS a session. */
export function useRedirectIfAuthed(redirectTo = "/workouts") {
  const status = useAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace(redirectTo);
  }, [status, router, redirectTo]);

  return status;
}
