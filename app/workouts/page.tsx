"use client";

import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { Loader2 } from "lucide-react";

export default function WorkoutsPage() {
  const status = useRequireAuth();

  if (status !== "authed") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" role="status" aria-label="Loading" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
      <p className="mt-2 text-muted-foreground">No workouts yet.</p>
    </main>
  );
}
