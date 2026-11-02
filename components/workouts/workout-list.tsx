"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { StarButton } from "@/components/workouts/star-button";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import {
  filtersFromParams,
  filtersToQuery,
  findWorkouts,
  SORTS,
  type Sort,
  type WorkoutFilters,
} from "@/lib/find-workouts";
import { selectClass } from "@/lib/utils";
import { workoutVolume } from "@/lib/volume";
import { formatDate, loadExercises, loadWorkouts, type Exercise, type Workout } from "@/lib/workouts";

const VIEWS = [
  { href: "/workouts", label: "All" },
  { href: "/workouts/starred", label: "Starred" },
];

// Reading the link's filters needs a Suspense boundary for Next.js to build the page.
export function WorkoutList({ starredOnly = false }: { starredOnly?: boolean }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <WorkoutListContent starredOnly={starredOnly} />
    </Suspense>
  );
}

function WorkoutListContent({ starredOnly }: { starredOnly: boolean }) {
  const status = useRequireAuth();
  const searchParams = useSearchParams();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    Promise.all([loadWorkouts({ starredOnly }), loadExercises()])
      .then(([loadedWorkouts, loadedExercises]) => {
        setWorkouts(loadedWorkouts);
        setExercises(loadedExercises);
      })
      .catch(() => setError("Couldn't load your workouts. Please try again."));
  }, [status, starredOnly]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workouts) return <PageLoading />;

  // Keeping filters in the link means the back button returns to the same results.
  function updateFilters(next: WorkoutFilters) {
    setFilters(next);
    const query = filtersToQuery(next);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  // A link can name an exercise that's since been removed, or isn't this user's.
  const exerciseId = exercises.some((exercise) => exercise.id === filters.exerciseId)
    ? filters.exerciseId
    : "";
  const results = findWorkouts(workouts, { ...filters, exerciseId });
  const narrowed = filters.search.trim() !== "" || exerciseId !== "";

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
        <>
          <div role="search" aria-label="Find workouts" className="mt-6 grid grid-cols-2 gap-3">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="workout-search">Search by title</Label>
              <Input
                id="workout-search"
                type="search"
                enterKeyHint="search"
                value={filters.search}
                onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="workout-exercise">Exercise</Label>
              <select
                id="workout-exercise"
                className={selectClass}
                value={exerciseId}
                onChange={(e) => updateFilters({ ...filters, exerciseId: e.target.value })}
              >
                <option value="">All exercises</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="workout-sort">Sort by</Label>
              <select
                id="workout-sort"
                className={selectClass}
                value={filters.sort}
                onChange={(e) => updateFilters({ ...filters, sort: e.target.value as Sort })}
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex min-h-11 items-center justify-between gap-4">
            <p role="status" className="text-sm text-muted-foreground">
              {narrowed
                ? `${results.length} of ${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`
                : `${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`}
            </p>
            {narrowed && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateFilters({ ...filters, search: "", exerciseId: "" })}
              >
                Clear search
              </Button>
            )}
          </div>

          {results.length === 0 && (
            <p className="mt-2 text-muted-foreground">No workouts match. Try a different search or exercise.</p>
          )}

        <ul className="mt-2 flex flex-col gap-3">
          {results.map((workout) => {
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
                      // Keep the list current too: a search can hide this button
                      // and later bring it back, and it restarts from this value.
                      setWorkouts((current) =>
                        starredOnly && !starred
                          ? (current ?? []).filter((item) => item.id !== workout.id)
                          : (current ?? []).map((item) =>
                              item.id === workout.id
                                ? { ...item, stars: starred ? { workout_id: item.id } : null }
                                : item
                            )
                      );
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </main>
  );
}
