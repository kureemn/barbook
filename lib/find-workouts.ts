import { exerciseInfo, MUSCLE_NAMES } from "@/lib/exercise-info";
import { workoutVolume } from "@/lib/volume";
import type { Workout } from "@/lib/workouts";

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "volume", label: "Highest volume" },
] as const;

export type Sort = (typeof SORTS)[number]["value"];

export type WorkoutFilters = {
  search: string;
  exerciseId: string;
  sort: Sort;
};

/** Reads filters from a link. Anything unrecognized falls back to the default. */
export function filtersFromParams(params: URLSearchParams): WorkoutFilters {
  const sort = SORTS.find((option) => option.value === params.get("sort"));
  return {
    search: params.get("q") ?? "",
    exerciseId: params.get("exercise") ?? "",
    sort: sort?.value ?? "newest",
  };
}

/** Writes filters for a link, leaving out defaults so a plain list keeps a plain URL. */
export function filtersToQuery({ search, exerciseId, sort }: WorkoutFilters) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (exerciseId) params.set("exercise", exerciseId);
  if (sort !== "newest") params.set("sort", sort);
  return params.toString();
}

/** Everything a lifter might search for: the title, its exercises, and their muscles. */
function searchText(workout: Workout) {
  const names = workout.workout_sets.flatMap((set) => set.exercises?.name ?? []);
  const muscles = names.flatMap((name) => {
    const info = exerciseInfo(name);
    return info ? [...info.main, ...info.also].map((muscle) => MUSCLE_NAMES[muscle]) : [];
  });
  return [workout.title, ...names, ...muscles].join(" ").toLowerCase();
}

/**
 * Applies the search, exercise filter, and sort. Expects workouts newest first,
 * as loadWorkouts returns them, and uses that order to settle ties.
 */
export function findWorkouts(workouts: Workout[], { search, exerciseId, sort }: WorkoutFilters) {
  const term = search.trim().toLowerCase();
  const matches = workouts.filter(
    (workout) =>
      searchText(workout).includes(term) &&
      (!exerciseId || workout.workout_sets.some((set) => set.exercise_id === exerciseId))
  );

  if (sort === "oldest") {
    return matches
      .reverse()
      .sort((a, b) => a.performed_on.localeCompare(b.performed_on));
  }
  if (sort === "volume") {
    return matches.sort((a, b) => workoutVolume(b.workout_sets) - workoutVolume(a.workout_sets));
  }
  return matches;
}
