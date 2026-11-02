"use client";

import Link from "next/link";
import { useRedirectIfAuthed } from "@/lib/neon/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const status = useRedirectIfAuthed();

  if (status !== "anonymous") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" role="status" aria-label="Loading" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          All your training, in one logbook
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Build your programs, log every set, and get suggested weights for
          your next session. Free for any lifter.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/auth/sign-up">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/sign-in">Log in</Link>
        </Button>
      </div>
    </main>
  );
}
