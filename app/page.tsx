"use client";

import Link from "next/link";
import { CalendarDays, Loader2, Play } from "lucide-react";
import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { BarbellArt } from "@/components/program/barbell-art";
import { Button } from "@/components/ui/button";
import { exerciseInfo } from "@/lib/exercise-info";
import { useRedirectIfAuthed } from "@/lib/neon/use-auth-guard";

const squat = exerciseInfo("Squat")!;
const LOADED_PLATES = 4;

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
    <main className="flex-1">
      <div className="overflow-hidden bg-tint-peach text-tint-peach-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-10 sm:py-14">
          <h1 className="text-5xl leading-none font-bold tracking-tight sm:text-6xl">
            Log every set. Follow the plan.
          </h1>
          <BarbellArt plates={LOADED_PLATES} className="my-2 lg:h-36" />
          <p className="max-w-md text-balance">
            A free training log for powerlifters, with a 6-week program, suggested weights, and a rest
            timer under every set.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">
                <Play className="size-4" aria-hidden="true" />
                Create an account
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-background hover:bg-background/80">
              <Link href="/auth/sign-in">Log in</Link>
            </Button>
          </div>
        </div>
      </div>

      <ul className="mx-auto grid w-full max-w-3xl gap-3 px-4 py-8 sm:grid-cols-3 sm:py-10">
        <li className="flex flex-col gap-3 rounded-2xl bg-tint-blue p-4 text-tint-blue-foreground">
          <CalendarDays className="size-10" aria-hidden="true" />
          <h2 className="text-xl font-bold tracking-tight">6-week program</h2>
          <p className="text-sm">
            Open the app, see today&apos;s session, and start it.
          </p>
        </li>
        <li className="flex flex-col gap-3 rounded-2xl bg-tint-green p-4 text-tint-green-foreground">
          <MuscleMap info={squat} />
          <h2 className="text-xl font-bold tracking-tight">Know what you train</h2>
          <p className="text-sm">
            See the muscles and equipment for each exercise.
          </p>
        </li>
        <li className="flex flex-col gap-3 rounded-2xl bg-tint-peach p-4 text-tint-peach-foreground">
          <EquipmentPicture equipment="barbell" className="h-10 w-14 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Know what to lift</h2>
          <p className="text-sm">
            Get a suggested weight from what you logged last time.
          </p>
        </li>
      </ul>
    </main>
  );
}
