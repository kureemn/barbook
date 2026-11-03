import { describe, expect, it } from "vitest";
import { filtersFromParams, filtersToQuery, findWorkouts, type WorkoutFilters } from "@/lib/find-workouts";
import type { Workout } from "@/lib/workouts";

function workout(id: string, title: string, performed_on: string, sets: [string, number, number, boolean?][]) {
  return {
    id,
    title,
    performed_on,
    workout_sets: sets.map(([exercise_id, weight, reps, is_warmup = false]) => ({
      exercise_id,
      weight,
      reps,
      is_warmup,
    })),
  } as unknown as Workout;
}

// Newest first, the order loadWorkouts returns.
const WORKOUTS = [
  workout("new", "Heavy Squat", "2026-10-30", [["squat", 300, 3]]),
  workout("mid", "Bench day", "2026-10-20", [["bench", 200, 5], ["squat", 135, 5, true]]),
  workout("old", "Heavy Pull", "2026-10-10", [["deadlift", 400, 5]]),
];

const DEFAULTS: WorkoutFilters = { search: "", exerciseId: "", sort: "newest" };

function ids(filters: Partial<WorkoutFilters>, workouts = WORKOUTS) {
  return findWorkouts(workouts, { ...DEFAULTS, ...filters }).map((item) => item.id);
}

describe("findWorkouts", () => {
  it("returns everything, newest first, with no filters", () => {
    expect(ids({})).toEqual(["new", "mid", "old"]);
  });

  it("finds workouts by exercise name or muscle, not just title", () => {
    const named = [
      {
        ...WORKOUTS[0],
        title: "Monday",
        workout_sets: [{ ...WORKOUTS[0].workout_sets[0], exercises: { name: "Romanian Deadlift" } }],
      },
      {
        ...WORKOUTS[1],
        title: "Tuesday",
        workout_sets: [{ ...WORKOUTS[1].workout_sets[0], exercises: { name: "Bench" } }],
      },
    ];
    expect(ids({ search: "romanian" }, named)).toEqual(["new"]);
    expect(ids({ search: "hamstrings" }, named)).toEqual(["new"]);
    expect(ids({ search: "triceps" }, named)).toEqual(["mid"]);
    expect(ids({ search: "tuesday" }, named)).toEqual(["mid"]);
  });

  it("searches titles regardless of case and surrounding spaces", () => {
    expect(ids({ search: "  heavy " })).toEqual(["new", "old"]);
  });

  it("filters to workouts that include the exercise, warm-ups included", () => {
    expect(ids({ exerciseId: "squat" })).toEqual(["new", "mid"]);
  });

  it("combines search and filter", () => {
    expect(ids({ search: "heavy", exerciseId: "squat" })).toEqual(["new"]);
  });

  it("returns nothing when no workout matches", () => {
    expect(ids({ search: "yoga" })).toEqual([]);
  });

  it("sorts oldest first", () => {
    expect(ids({ sort: "oldest" })).toEqual(["old", "mid", "new"]);
  });

  it("sorts by highest volume, leaving warm-ups out", () => {
    // 2000 for old, 1000 for mid (the 675 warm-up doesn't count), 900 for new.
    expect(ids({ sort: "volume" })).toEqual(["old", "mid", "new"]);
  });

  it("settles same-day ties by when the workout was logged", () => {
    const sameDay = [
      workout("second", "PM", "2026-10-30", [["squat", 100, 1]]),
      workout("first", "AM", "2026-10-30", [["squat", 100, 1]]),
    ];
    expect(ids({ sort: "newest" }, sameDay)).toEqual(["second", "first"]);
    expect(ids({ sort: "oldest" }, sameDay)).toEqual(["first", "second"]);
    expect(ids({ sort: "volume" }, sameDay)).toEqual(["second", "first"]);
  });

  it("doesn't reorder the list it was given", () => {
    const list = [...WORKOUTS];
    findWorkouts(list, { ...DEFAULTS, sort: "oldest" });
    expect(list.map((item) => item.id)).toEqual(["new", "mid", "old"]);
  });
});

describe("filter links", () => {
  it("round-trips filters through a link", () => {
    const filters: WorkoutFilters = { search: "heavy & pull", exerciseId: "abc", sort: "volume" };
    expect(filtersFromParams(new URLSearchParams(filtersToQuery(filters)))).toEqual(filters);
  });

  it("leaves defaults out of the link", () => {
    expect(filtersToQuery(DEFAULTS)).toBe("");
  });

  it("falls back to newest for an unknown sort", () => {
    expect(filtersFromParams(new URLSearchParams("sort=nonsense")).sort).toBe("newest");
  });
});
