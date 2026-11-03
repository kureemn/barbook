"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { ProgramProgress } from "@/components/program/program-progress";
import { Button } from "@/components/ui/button";
import { loadActiveRun, type ProgramRun } from "@/lib/program-runs";
import { nextSession, PROGRAM_NAME } from "@/lib/programs";

export function NextSessionCard() {
  // undefined while loading, null when the lifter isn't on a program.
  const [run, setRun] = useState<ProgramRun | null | undefined>(undefined);

  useEffect(() => {
    // Program info is extra here, so a failure just falls back to an empty workout.
    loadActiveRun()
      .then(setRun)
      .catch(() => setRun(null));
  }, []);

  if (run === undefined) return <div className="mt-6 h-40 rounded-lg border bg-card" aria-hidden="true" />;

  const session = run ? nextSession(run.program_sessions) : null;

  if (session) {
    return (
      <section
        aria-label="Your next session"
        className="mt-6 rounded-lg border border-l-4 border-l-primary bg-card p-4"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Up next: Week {session.week}, Day {session.day}
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-wide uppercase">{session.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.exercises.map((exercise) => exercise.name).join(", ")}
        </p>
        <ProgramProgress logged={run?.program_sessions.length ?? 0} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="lg" className="flex-1 sm:flex-none">
            <Link href={`/workouts/new?week=${session.week}&day=${session.day}`}>
              <Play className="size-4" aria-hidden="true" />
              Start workout
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/program">See program</Link>
          </Button>
        </div>
        <p className="mt-3 text-sm">
          <Link href="/workouts/new" className="text-muted-foreground underline underline-offset-4">
            Log a different workout
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Start training" className="mt-6 rounded-lg border border-l-4 border-l-primary bg-card p-4">
      <h2 className="text-3xl font-bold tracking-wide uppercase">
        {run ? "Program finished" : "Ready to lift?"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {run
          ? `You've logged every session of the ${PROGRAM_NAME}. Nice work.`
          : `Start an empty workout, or follow the ${PROGRAM_NAME}.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="lg" className="flex-1 sm:flex-none">
          <Link href="/workouts/new">
            <Play className="size-4" aria-hidden="true" />
            Start workout
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/program">{run ? "See program" : "View program"}</Link>
        </Button>
      </div>
    </section>
  );
}
