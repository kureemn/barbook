"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { NextSessionCard } from "@/components/program/next-session-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { StarButton } from "@/components/workouts/star-button";
import { WorkoutNav } from "@/components/workouts/workout-nav";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import {
  filtersFromParams,
  filtersToQuery,
  findWorkouts,
  SORTS,
  type Sort,
  type WorkoutFilters,
} from "@/lib/find-workouts";
import { MUSCLE_NAMES, workoutMuscles } from "@/lib/exercise-info";
import { cn, selectClass } from "@/lib/utils";
import { workoutVolume } from "@/lib/volume";
import { dateParts, formatDate, loadExercises, loadWorkouts, type Exercise, type Workout } from "@/lib/workouts";

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
  // A link that arrives with filters set should show them.
  const [showFilters, setShowFilters] = useState(() => {
    const initial = filtersFromParams(searchParams);
    return initial.exerciseId !== "" || initial.sort !== "newest";
  });

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
  const activeFilters = (exerciseId !== "" ? 1 : 0) + (filters.sort !== "newest" ? 1 : 0);
  const thisYear = new Date().getFullYear();

  return (
    <main className={cn("mx-auto w-full flex-1 px-4 py-8", starredOnly ? "max-w-2xl" : "max-w-5xl")}>
      {/* The hero leads this page, so its title only needs to reach screen readers. */}
      <h1 className={starredOnly ? "text-4xl font-bold tracking-wide uppercase" : "sr-only"}>
        {starredOnly ? "Starred workouts" : "Workouts"}
      </h1>

      <WorkoutNav current={starredOnly ? "/workouts/starred" : "/workouts"} />

      <div
        className={cn(
          !starredOnly &&
            "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10"
        )}
      >
        {!starredOnly && (
          <div className="lg:sticky lg:top-6">
            <NextSessionCard />
          </div>
        )}

        <section aria-label={starredOnly ? "Starred workouts" : "Workout history"} className="mt-8 lg:mt-6">
          {workouts.length === 0 ? (
            <p className="text-muted-foreground">
              {starredOnly
                ? "No starred workouts yet. Tap the star on a workout to save it here."
                : "No workouts yet. Hit Start workout to log your first."}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-4">
                {!starredOnly && (
                  <h2 className="text-3xl font-bold tracking-wide uppercase">History</h2>
                )}
                <p role="status" className="text-sm text-muted-foreground tabular-nums">
                  {narrowed
                    ? `${results.length} of ${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`
                    : `${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`}
                </p>
              </div>

              <div role="search" aria-label="Find workouts" className="mt-3">
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Label htmlFor="workout-search" className="sr-only">
                      Search by title
                    </Label>
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="workout-search"
                      type="search"
                      enterKeyHint="search"
                      placeholder="Search by title"
                      className="border-border bg-transparent pl-9 dark:bg-transparent"
                      value={filters.search}
                      onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3"
                    aria-expanded={showFilters}
                    aria-controls="workout-filters"
                    onClick={() => setShowFilters((current) => !current)}
                  >
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                    Filters{activeFilters > 0 && ` (${activeFilters})`}
                  </Button>
                </div>
                <div
                  id="workout-filters"
                  hidden={!showFilters}
                  className="mt-3 grid grid-cols-2 gap-3 [&[hidden]]:hidden"
                >
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
              </div>

              {narrowed && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 px-3"
                  onClick={() => updateFilters({ ...filters, search: "", exerciseId: "" })}
                >
                  Clear search
                </Button>
              )}

              {results.length === 0 && (
                <p className="mt-4 text-muted-foreground">
                  No workouts match. Try a different search or exercise.
                </p>
              )}

              <ul className="mt-3 divide-y">
                {results.map((workout) => {
                  const workingSets = workout.workout_sets.filter((set) => !set.is_warmup).length;
                  const date = dateParts(workout.performed_on);
                  const muscles = workoutMuscles(workout.workout_sets.map((set) => set.exercises?.name));
                  return (
                    <li key={workout.id} className="relative">
                      <Link
                        href={`/workouts/${workout.id}`}
                        className="flex gap-4 rounded-md py-4 pr-12 transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span aria-hidden="true" className="flex w-11 shrink-0 flex-col items-center">
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {date.month}
                          </span>
                          <span className="font-heading text-4xl leading-none font-bold">{date.day}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block font-heading text-2xl leading-tight font-semibold tracking-wide uppercase">
                            {workout.title}
                          </span>
                          <span className="sr-only">{formatDate(workout.performed_on)}. </span>
                          <span className="mt-1 block text-sm text-muted-foreground tabular-nums">
                            <span aria-hidden="true">
                              {date.weekday}
                              {date.year !== thisYear && `, ${date.year}`} ·{" "}
                            </span>
                            {workingSets} working {workingSets === 1 ? "set" : "sets"} ·{" "}
                            {workoutVolume(workout.workout_sets).toLocaleString()} lb
                          </span>
                          {muscles.length > 0 && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {muscles.map((muscle) => MUSCLE_NAMES[muscle]).join(" · ")}
                            </span>
                          )}
                        </span>
                      </Link>
                      <div className="absolute top-3 right-0">
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
        </section>
      </div>
    </main>
  );
}
