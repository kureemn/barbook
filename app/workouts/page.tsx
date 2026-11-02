"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { formatDate, loadWorkouts, workoutVolume, type Workout } from "@/lib/workouts";

export default function WorkoutsPage() {
  const status = useRequireAuth();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadWorkouts()
      .then(setWorkouts)
      .catch(() => setError("Couldn't load your workouts. Please try again."));
  }, [status]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workouts) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <Button asChild>
          <Link href="/workouts/new">
            <Plus className="size-4" aria-hidden="true" />
            Add workout
          </Link>
        </Button>
      </div>

      {workouts.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No workouts yet. Add your first session.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => {
            const workingSets = workout.workout_sets.filter((set) => !set.is_warmup).length;
            return (
              <li key={workout.id}>
                <Link
                  href={`/workouts/${workout.id}`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="block font-medium">{workout.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {formatDate(workout.performed_on)}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {workingSets} working {workingSets === 1 ? "set" : "sets"} ·{" "}
                    {workoutVolume(workout.workout_sets).toLocaleString()} lb
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
