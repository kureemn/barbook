"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartLine, Minus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { E1rmChart } from "@/components/dashboard/e1rm-chart";
import { BarTrend } from "@/components/dashboard/bar-trend";
import { MuscleBalance } from "@/components/dashboard/muscle-balance";
import { Stat, TrainingStats } from "@/components/dashboard/training-stats";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutNav } from "@/components/workouts/workout-nav";
import {
  e1rmHistory,
  LIFTS,
  type DashboardWorkout,
} from "@/lib/dashboard";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import {
  liftSummaries,
  recentRecords,
  setsByMuscle,
  strengthRatio,
  trainingWeeks,
  weekStreak,
} from "@/lib/progress";
import { PAGE_CLASS } from "@/lib/utils";
import { dateParts, formatDate, loadDashboardWorkouts, todayLocal } from "@/lib/workouts";

function shortDate(date: string) {
  const { month, day } = dateParts(date);
  return `${month} ${day}`;
}

function changeText(change: number | null, since: string) {
  if (change === null) return "One session so far";
  const amount = Math.abs(Math.round(change));
  if (amount === 0) return `No change since ${shortDate(since)}`;
  return `${change > 0 ? "Up" : "Down"} ${amount} lb since ${shortDate(since)}`;
}

function ChangeIcon({ change }: { change: number | null }) {
  if (change === null || Math.round(change) === 0) {
    return <Minus className="size-4" aria-hidden="true" />;
  }
  const Icon = change > 0 ? TrendingUp : TrendingDown;
  return <Icon className="size-4" aria-hidden="true" />;
}

export default function DashboardPage() {
  const status = useRequireAuth();
  const [workouts, setWorkouts] = useState<DashboardWorkout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadDashboardWorkouts()
      .then(setWorkouts)
      .catch(() => setError("Couldn't load your dashboard. Please try again."));
  }, [status]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workouts) return <PageLoading />;

  const today = todayLocal();
  const history = e1rmHistory(workouts);
  const summaries = liftSummaries(workouts, today);
  const records = recentRecords(workouts, today);
  const weeks = trainingWeeks(workouts, today).map((week) => ({
    ...week,
    label: shortDate(week.weekStart),
  }));
  const streak = weekStreak(workouts, today);
  const strength = strengthRatio(workouts, today);
  const { muscles, uncounted } = setsByMuscle(workouts, today);

  return (
    <main className={PAGE_CLASS}>
      <h1 className="text-4xl font-bold tracking-wide uppercase">Dashboard</h1>
      <WorkoutNav current="/dashboard" />

      <div className="mt-6">
        <TrainingStats
          workouts={workouts}
          extra={
            <>
              <Stat
                label="Weeks in a row"
                value={streak}
                note={streak === 0 ? "Log a workout to start" : "With at least one workout"}
              />
              <Stat
                label="Total vs. bodyweight"
                value={strength ? `${strength.ratio.toFixed(2)}×` : "Not yet"}
                note={
                  strength
                    ? `At ${strength.bodyweight} lb, logged ${shortDate(strength.date)}`
                    : "Log all 3 lifts and your bodyweight"
                }
              />
            </>
          }
        />
      </div>

      {workouts.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="Your progress starts here"
          action={
            <Button asChild>
              <Link href="/workouts/new">Start workout</Link>
            </Button>
          }
        >
          Log a workout to see your records, weekly volume, and which muscles you&apos;re training.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="lifts-heading" className="mt-8">
            <h2 id="lifts-heading" className="text-2xl font-semibold tracking-wide uppercase">
              Your lifts
            </h2>
            <ul className="mt-3 grid gap-3 lg:grid-cols-3">
              {LIFTS.map((lift) => {
                const summary = summaries.find((item) => item.category === lift.category);
                return (
                  <li key={lift.category} className="rounded-lg border bg-card p-4">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: lift.color }}
                      />
                      {lift.label}
                    </h3>
                    {summary ? (
                      <>
                        <p className="mt-1 font-heading text-5xl font-bold tabular-nums">
                          {Math.round(summary.best)} lb
                        </p>
                        <p className="text-sm text-muted-foreground">Best estimated 1-rep max</p>
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                          <ChangeIcon change={summary.change} />
                          {changeText(summary.change, summary.since)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                          Heaviest set: {summary.heaviest.weight} lb × {summary.heaviest.reps},{" "}
                          {shortDate(summary.heaviest.date)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Log a working set to see this.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-3">
            <section aria-labelledby="e1rm-heading" className="min-w-0 lg:col-span-2">
              <h2 id="e1rm-heading" className="text-2xl font-semibold tracking-wide uppercase">
                Estimated 1-rep max (lb)
              </h2>
              {history.length === 0 ? (
                <p className="mt-2 text-muted-foreground">
                  Log a working set of squat, bench, or deadlift to start this chart.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The best working set of each lift per day, using weight, reps, and RPE. A set
                    without RPE counts as RPE 10.
                  </p>
                  <div className="mt-3 rounded-lg border bg-card p-4">
                    <E1rmChart history={history} />
                  </div>
                    <details className="mt-3">
                      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
                        Show as a table
                      </summary>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm tabular-nums">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th scope="col" className="py-2 pr-4 font-medium">
                                Date
                              </th>
                              {LIFTS.map((lift) => (
                                <th key={lift.category} scope="col" className="py-2 pr-4 font-medium">
                                  {lift.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((point) => (
                              <tr key={point.date} className="border-t">
                                <th scope="row" className="py-2 pr-4 font-normal whitespace-nowrap">
                                  {formatDate(point.date)}
                                </th>
                                {LIFTS.map((lift) => {
                                  const value = point[lift.category];
                                  return (
                                    <td key={lift.category} className="py-2 pr-4">
                                      {value === undefined ? "None" : Math.round(value)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                </>
              )}
            </section>

            <section aria-labelledby="records-heading">
              <h2 id="records-heading" className="text-2xl font-semibold tracking-wide uppercase">
                Recent records
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Days you beat your best estimated 1-rep max for any exercise.
              </p>
              {records.length === 0 ? (
                <p className="mt-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                  No records yet. The first time you log an exercise sets your baseline, so beat it
                  next time.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {records.map((record) => (
                    <li
                      key={`${record.exercise}-${record.date}`}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <Trophy className="size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{record.exercise}</p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {record.weight} lb × {record.reps}, {shortDate(record.date)}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                        +{Math.round(record.gain)} lb
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
            <section aria-labelledby="volume-heading" className="min-w-0">
              <h2 id="volume-heading" className="text-2xl font-semibold tracking-wide uppercase">
                Weekly volume
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Weight × reps across working sets, last 8 weeks.
              </p>
              <div className="mt-3 rounded-lg border bg-card p-4">
                <BarTrend
                  data={weeks.map((week) => ({ label: week.label, value: week.volume }))}
                  valueName="Volume"
                  format={(value) => `${value.toLocaleString()} lb`}
                  description="Bar chart of weekly working volume in pounds over the last 8 weeks."
                />
              </div>
            </section>
            <section aria-labelledby="sessions-heading" className="min-w-0">
              <h2 id="sessions-heading" className="text-2xl font-semibold tracking-wide uppercase">
                Sessions per week
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How consistently you&apos;ve trained, last 8 weeks.
              </p>
              <div className="mt-3 rounded-lg border bg-card p-4">
                <BarTrend
                  data={weeks.map((week) => ({ label: week.label, value: week.sessions }))}
                  valueName="Sessions"
                  format={(value) => `${value} ${value === 1 ? "session" : "sessions"}`}
                  description="Bar chart of workouts per week over the last 8 weeks."
                />
              </div>
            </section>
          </div>

          <section aria-labelledby="muscles-heading" className="mt-8">
            <h2 id="muscles-heading" className="text-2xl font-semibold tracking-wide uppercase">
              Sets per muscle
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Working sets in the last 30 days, counting each exercise&apos;s main muscles. A 0 may
              be something you&apos;re neglecting.
            </p>
            <div className="mt-3 rounded-lg border bg-card p-4">
              <MuscleBalance muscles={muscles} uncounted={uncounted} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
