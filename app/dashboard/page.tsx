"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { E1rmChart } from "@/components/dashboard/e1rm-chart";
import { TrainingStats } from "@/components/dashboard/training-stats";
import { Button } from "@/components/ui/button";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutNav } from "@/components/workouts/workout-nav";
import {
  e1rmHistory,
  LIFTS,
  type DashboardWorkout,
} from "@/lib/dashboard";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { formatDate, loadDashboardWorkouts } from "@/lib/workouts";

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

  const history = e1rmHistory(workouts);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-4xl font-bold tracking-wide uppercase">Dashboard</h1>
      <WorkoutNav current="/dashboard" />

      <div className="mt-6">
        <TrainingStats workouts={workouts} />
      </div>

      <section aria-labelledby="e1rm-heading" className="mt-8">
        <h2 id="e1rm-heading" className="text-2xl font-semibold tracking-wide uppercase">
          Estimated 1-rep max (lb)
        </h2>
        {history.length === 0 ? (
          <div className="mt-2">
            <p className="text-muted-foreground">
              Log a working set of squat, bench, or deadlift to start this chart.
            </p>
            <Button asChild className="mt-4">
              <Link href="/workouts/new">Start workout</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              The best working set of each lift per day, using weight, reps, and RPE. A set
              without RPE counts as RPE 10.
            </p>
            <div className="mt-4 rounded-lg border bg-card p-4">
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
    </main>
  );
}
