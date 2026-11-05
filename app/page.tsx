"use client";

import Link from "next/link";
import { CalendarDays, Loader2, Play } from "lucide-react";
import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { Button } from "@/components/ui/button";
import { exerciseInfo } from "@/lib/exercise-info";
import { useRedirectIfAuthed } from "@/lib/neon/use-auth-guard";

const squat = exerciseInfo("Squat")!;

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:py-16">
      <div className="flex flex-col items-start gap-5">
        <h1 className="text-5xl leading-none font-bold tracking-tight sm:text-6xl">
          Log every set. Follow the plan.
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          A free training log for powerlifters, with a 6-week program, suggested weights, and a rest
          timer under every set.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">
              <Play className="size-4" aria-hidden="true" />
              Create an account
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/sign-in">Log in</Link>
          </Button>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        <li className="flex flex-col gap-3 rounded-2xl bg-card p-4">
          <CalendarDays className="size-10 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold tracking-tight">6-week program</h2>
          <p className="text-sm text-muted-foreground">
            Open the app, see today&apos;s session, and start it.
          </p>
        </li>
        <li className="flex flex-col gap-3 rounded-2xl bg-card p-4">
          <MuscleMap info={squat} />
          <h2 className="text-xl font-bold tracking-tight">Know what you train</h2>
          <p className="text-sm text-muted-foreground">
            See the muscles and equipment for each exercise.
          </p>
        </li>
        <li className="flex flex-col gap-3 rounded-2xl bg-card p-4">
          <EquipmentPicture equipment="barbell" className="h-10 w-14 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Know what to lift</h2>
          <p className="text-sm text-muted-foreground">
            Get a suggested weight from what you logged last time.
          </p>
        </li>
      </ul>
    </main>
  );
}
