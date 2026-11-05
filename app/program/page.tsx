"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { PageBand } from "@/components/page-band";
import { ProgramProgress } from "@/components/program/program-progress";
import { ProgramSchedule } from "@/components/program/program-schedule";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutNav } from "@/components/workouts/workout-nav";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { endProgram, loadActiveRun, startProgram, type ProgramRun } from "@/lib/program-runs";
import {
  getProgram,
  nextSession,
  PROGRAMS,
  programSession,
  targetText,
  type Program,
  type ProgramKey,
} from "@/lib/programs";
import { PAGE_CLASS } from "@/lib/utils";
import { formatDate, todayLocal } from "@/lib/workouts";

const BIG_BUTTON = "h-14 w-full px-8 text-base font-semibold lg:w-auto";

/** Where a program came from, so nobody mistakes it for more than it is. */
function ProgramOrigin({ program }: { program: Program }) {
  return (
    <div className="text-sm text-muted-foreground">
      <p>{program.origin}</p>
      {program.sources.length > 0 && (
        <ul className="mt-2 flex flex-col">
          {program.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-medium text-foreground underline underline-offset-4"
              >
                {source.label}
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Each training day's exercises and first-week targets. */
function ProgramDays({ program }: { program: Program }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {program.days.map((plan, index) => (
        <li key={plan.name} className="rounded-2xl bg-background p-3 lg:p-4">
          <p className="text-xs font-medium text-muted-foreground">Day {index + 1}</p>
          <h3 className="text-lg leading-tight font-semibold tracking-tight">
            {plan.name}
          </h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {programSession(program, 1, index + 1).exercises.map((exercise, position) => (
              <li key={exercise.name} className="flex flex-wrap justify-between gap-x-3">
                <span className={position === 0 ? "font-semibold" : undefined}>{exercise.name}</span>
                <span className="text-muted-foreground tabular-nums">{targetText(exercise)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ChooseProgram({
  busy,
  onStart,
}: {
  busy: ProgramKey | null;
  onStart: (key: ProgramKey) => void;
}) {
  return (
    <>
      <PageBand>
        <h1 className="text-4xl font-bold tracking-tight">Choose a program</h1>
        <p className="mt-2 max-w-prose">
          All of them are 4 days a week and use barbells, dumbbells, a bench, a rack, and a pull-up
          bar. You can switch whenever you like, and your logged workouts stay in your history.
        </p>
      </PageBand>
      <WorkoutNav current="/program" />
      <ul className={`${PAGE_CLASS} flex flex-col gap-6`}>
        {PROGRAMS.map((program) => (
          <li key={program.key} className="rounded-2xl bg-card p-4 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {program.focus} · {program.weeks} weeks
                </p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">{program.name}</h2>
                <p className="mt-2 max-w-prose">{program.summary}</p>
              </div>
              <Button
                size="lg"
                className={BIG_BUTTON}
                disabled={busy !== null}
                aria-label={`Start ${program.name}`}
                onClick={() => onStart(program.key)}
              >
                {busy === program.key ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="size-5 fill-current" aria-hidden="true" />
                )}
                Start
              </Button>
            </div>
            <div className="mt-4">
              <ProgramDays program={program} />
            </div>
            <details className="mt-3">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
                Where this program comes from
              </summary>
              <div className="max-w-prose pb-1">
                <ProgramOrigin program={program} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function ProgramPage() {
  const status = useRequireAuth();
  // undefined while loading, null when the lifter isn't on a program.
  const [run, setRun] = useState<ProgramRun | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<ProgramKey | null>(null);
  const [ending, setEnding] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (status !== "authed") return;
    loadActiveRun()
      .then(setRun)
      .catch(() => setError("Couldn't load your program. Please try again."));
  }, [status]);

  async function handleStart(key: ProgramKey) {
    setStarting(key);
    try {
      await startProgram(key, todayLocal());
      setRun(await loadActiveRun());
      window.scrollTo(0, 0);
      toast.success("Program started.");
    } catch {
      toast.error("Couldn't start the program. Please try again.");
    } finally {
      setStarting(null);
    }
  }

  async function handleEnd() {
    if (!run) return;
    setEnding(true);
    try {
      await endProgram(run.id, todayLocal());
      setRun(null);
      setConfirming(false);
      window.scrollTo(0, 0);
    } catch {
      toast.error("Couldn't end the program. Please try again.");
    } finally {
      setEnding(false);
    }
  }

  if (error) return <PageError message={error} />;
  if (status !== "authed" || run === undefined) return <PageLoading />;

  if (!run) {
    return (
      <main className="flex-1">
        <ChooseProgram busy={starting} onStart={handleStart} />
      </main>
    );
  }

  const program = getProgram(run.program_key);
  const next = nextSession(program, run.program_sessions);
  const logged = run.program_sessions.length;

  return (
    <main className="flex-1">
      <PageBand>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-bold tracking-tight">{program.name}</h1>
            <p className="mt-2">
              {program.focus}. Started {formatDate(run.started_on)}.
            </p>
            <div className="max-w-xl">
              <ProgramProgress logged={logged} program={program} />
            </div>
          </div>
          {next ? (
            <Button asChild size="lg" className={BIG_BUTTON}>
              <Link href={`/workouts/new?week=${next.week}&day=${next.day}`}>
                <Play className="size-5 fill-current" aria-hidden="true" />
                Week {next.week}, Day {next.day}: {next.name}
              </Link>
            </Button>
          ) : (
            <Button size="lg" className={BIG_BUTTON} disabled={ending} onClick={handleEnd}>
              Choose your next program
            </Button>
          )}
        </div>
      </PageBand>
      <WorkoutNav current="/program" />

      <div className={PAGE_CLASS}>
      <section aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-xl font-bold tracking-tight">
          The {program.weeks} weeks
        </h2>
        <ProgramSchedule program={program} logged={run.program_sessions} />
      </section>

      <details className="mt-6 border-t pt-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          About this program
        </summary>
        <div className="max-w-prose pb-1">
          <ProgramOrigin program={program} />
        </div>
      </details>

      {next && (
        <Button variant="outline" className="mt-6" onClick={() => setConfirming(true)}>
          Switch programs
        </Button>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch programs?</DialogTitle>
            <DialogDescription>
              This ends {program.name}. Your logged workouts stay in your history, but its progress
              won&apos;t show here anymore, and starting it again begins at week 1.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep going
            </Button>
            <Button disabled={ending} onClick={handleEnd}>
              {ending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              End and choose another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </main>
  );
}
