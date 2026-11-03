"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { ProgramProgress } from "@/components/program/program-progress";
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
  dayName,
  DAYS,
  DELOAD_WEEK,
  nextSession,
  PROGRAM_NAME,
  programSession,
  WEEKS,
  weekTarget,
} from "@/lib/programs";
import { cn, PAGE_CLASS } from "@/lib/utils";
import { formatDate, todayLocal } from "@/lib/workouts";

const weekNumbers = Array.from({ length: WEEKS }, (_, index) => index + 1);
const dayNumbers = Array.from({ length: DAYS }, (_, index) => index + 1);

export default function ProgramPage() {
  const status = useRequireAuth();
  // undefined while loading, null when the lifter isn't on a program.
  const [run, setRun] = useState<ProgramRun | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (status !== "authed") return;
    loadActiveRun()
      .then(setRun)
      .catch(() => setError("Couldn't load your program. Please try again."));
  }, [status]);

  async function handleStart() {
    setBusy(true);
    try {
      await startProgram(todayLocal());
      setRun(await loadActiveRun());
      toast.success("Program started.");
    } catch {
      toast.error("Couldn't start the program. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    if (!run) return;
    setBusy(true);
    try {
      await endProgram(run.id, todayLocal());
      setRun(null);
      setConfirming(false);
      toast.success("Program ended.");
    } catch {
      toast.error("Couldn't end the program. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <PageError message={error} />;
  if (status !== "authed" || run === undefined) return <PageLoading />;

  const next = run ? nextSession(run.program_sessions) : null;
  const logged = run?.program_sessions.length ?? 0;

  return (
    <main className={PAGE_CLASS}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-bold tracking-wide uppercase lg:text-6xl">{PROGRAM_NAME}</h1>
          <WorkoutNav current="/program" />
          {run ? (
            <>
              <p className="mt-2 text-muted-foreground">Started {formatDate(run.started_on)}.</p>
              <div className="max-w-xl">
                <ProgramProgress logged={logged} />
              </div>
            </>
          ) : (
            <p className="mt-2 max-w-prose text-muted-foreground">
              Four days a week for six weeks. Reps drop and effort climbs through week 5, then week 6
              is a lighter deload. Weights are suggested from what you&apos;ve logged, and you can
              change anything.
            </p>
          )}
        </div>
        {!run && (
          <Button size="lg" className="h-16 w-full px-8 font-heading text-2xl font-bold tracking-wide uppercase lg:w-auto" disabled={busy} onClick={handleStart}>
            {busy ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-5 fill-current" aria-hidden="true" />
            )}
            Start this program
          </Button>
        )}
        {run && next && (
          <Button asChild size="lg" className="h-16 w-full px-8 font-heading text-2xl font-bold tracking-wide uppercase lg:w-auto">
            <Link href={`/workouts/new?week=${next.week}&day=${next.day}`}>
              <Play className="size-5 fill-current" aria-hidden="true" />
              Week {next.week}, Day {next.day}: {next.name}
            </Link>
          </Button>
        )}
      </div>

      <section aria-labelledby="days-heading" className="mt-8">
        <h2 id="days-heading" className="text-2xl font-semibold tracking-wide uppercase">
          What&apos;s in each day
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dayNumbers.map((day) => {
            const session = programSession(1, day);
            return (
              <li key={day} className="rounded-lg border bg-card p-3 lg:p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">Day {day}</p>
                <h3 className="font-heading text-2xl leading-tight font-bold tracking-wide uppercase">
                  {session.name}
                </h3>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {session.exercises.map((exercise, index) => (
                    <li key={exercise.name} className={index === 0 ? "font-semibold" : undefined}>
                      {exercise.name}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <h2 className="mt-8 text-2xl font-semibold tracking-wide uppercase">The 6 weeks</h2>
      <ol className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {weekNumbers.map((week) => {
          const target = weekTarget(week);
          return (
            <li key={week} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 className="text-xl font-semibold tracking-wide uppercase">
                  Week {week}
                  {week === DELOAD_WEEK && " (deload)"}
                </h2>
                <p className="text-sm text-muted-foreground tabular-nums">
                  Main lifts: {target.sets} × {target.reps} @ RPE {target.rpe}
                </p>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {dayNumbers.map((day) => {
                  const session = programSession(week, day);
                  const done = run?.program_sessions.find(
                    (item) => item.week === week && item.day === day
                  );
                  const isNext = next?.week === week && next.day === day;
                  const content = (
                    <>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Day {day}
                        {done && <Check className="size-3.5 text-foreground" aria-hidden="true" />}
                        {done && <span className="sr-only">, done</span>}
                      </span>
                      <span className="font-medium">{dayName(day)}</span>
                    </>
                  );
                  const boxClass = cn(
                    "flex min-h-14 flex-col justify-center rounded-md border px-3 py-2 text-sm",
                    isNext && "border-primary",
                    done && "bg-muted"
                  );
                  return (
                    <li key={day}>
                      {!run ? (
                        <div className={boxClass}>{content}</div>
                      ) : (
                        <Link
                          href={
                            done
                              ? `/workouts/${done.workout_id}`
                              : `/workouts/new?week=${week}&day=${day}`
                          }
                          aria-label={
                            done ? `${session.title}, done. View workout.` : `Start ${session.title}`
                          }
                          className={cn(
                            boxClass,
                            "transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          )}
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      {run && (
        <Button variant="outline" className="mt-6" onClick={() => setConfirming(true)}>
          End program
        </Button>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this program?</DialogTitle>
            <DialogDescription>
              Your logged workouts stay in your log, but this program&apos;s progress won&apos;t show
              here anymore. Starting again begins at week 1.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep going
            </Button>
            <Button variant="destructive" disabled={busy} onClick={handleEnd}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              End program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
