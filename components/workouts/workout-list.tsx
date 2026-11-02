"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { StarButton } from "@/components/workouts/star-button";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { formatDate, loadWorkouts, workoutVolume, type Workout } from "@/lib/workouts";

const VIEWS = [
  { href: "/workouts", label: "All" },
  { href: "/workouts/starred", label: "Starred" },
];

export function WorkoutList({ starredOnly = false }: { starredOnly?: boolean }) {
  const status = useRequireAuth();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadWorkouts({ starredOnly })
      .then(setWorkouts)
      .catch(() => setError("Couldn't load your workouts. Please try again."));
  }, [status, starredOnly]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workouts) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {starredOnly ? "Starred workouts" : "Workouts"}
        </h1>
        <Button asChild>
          <Link href="/workouts/new">
            <Plus className="size-4" aria-hidden="true" />
            Add workout
          </Link>
        </Button>
      </div>

      <nav aria-label="Workout views" className="mt-4 flex gap-2">
        {VIEWS.map((view) => {
          const current = (view.href === "/workouts/starred") === starredOnly;
          return (
            <Button key={view.href} asChild variant={current ? "secondary" : "ghost"}>
              <Link href={view.href} aria-current={current ? "page" : undefined}>
                {view.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      {workouts.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {starredOnly
            ? "No starred workouts yet. Tap the star on a workout to save it here."
            : "No workouts yet. Add your first session."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {workouts.map((workout) => {
            const workingSets = workout.workout_sets.filter((set) => !set.is_warmup).length;
            return (
              <li key={workout.id} className="relative">
                <Link
                  href={`/workouts/${workout.id}`}
                  className="block rounded-lg border bg-card p-4 pr-14 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                <div className="absolute top-2 right-2">
                  <StarButton
                    workoutId={workout.id}
                    title={workout.title}
                    initialStarred={workout.stars !== null}
                    onChange={(starred) => {
                      if (starredOnly && !starred) {
                        setWorkouts((current) =>
                          (current ?? []).filter((item) => item.id !== workout.id)
                        );
                      }
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
