import { workoutVolume } from "@/lib/volume";

export const LIFTS = [
  { category: "squat", label: "Squat", color: "var(--series-squat)" },
  { category: "bench", label: "Bench", color: "var(--series-bench)" },
  { category: "deadlift", label: "Deadlift", color: "var(--series-deadlift)" },
] as const;

export type Lift = (typeof LIFTS)[number]["category"];

export type DashboardSet = {
  weight: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
  exercises: { category: string; name?: string } | null;
};

export type DashboardWorkout = {
  performed_on: string;
  bodyweight?: number | null;
  workout_sets: DashboardSet[];
};

export type E1rmPoint = { date: string } & Partial<Record<Lift, number>>;

// Kept beside the formula they describe.
export const RPE_MEANING =
  "RPE means rate of perceived exertion: how hard a set felt, from 6 to 10. 10 means no reps left, 8 means 2 left.";
export const RPE_IF_BLANK = "A blank RPE counts as 10 in your estimated max.";

/**
 * Reps to failure = reps + (10 - RPE), treating a missing RPE as 10.
 * Estimated 1-rep max = weight x (1 + reps to failure / 30), except that a true
 * single at RPE 10 is just its weight.
 */
export function estimatedOneRepMax(weight: number, reps: number, rpe: number | null) {
  const repsToFailure = reps + (10 - (rpe === null ? 10 : Number(rpe)));
  if (repsToFailure <= 1) return Number(weight);
  return Number(weight) * (1 + repsToFailure / 30);
}

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Workouts dated in the same calendar month as today, up to today. */
export function workoutsThisMonth(workouts: DashboardWorkout[], today: string) {
  const month = today.slice(0, 7);
  return workouts.filter(
    (workout) => workout.performed_on.startsWith(month) && workout.performed_on <= today
  ).length;
}

/** Working-set volume over 30 calendar days, counting today. */
export function volumeLast30Days(workouts: DashboardWorkout[], today: string) {
  const start = shiftDate(today, -29);
  return workouts
    .filter((workout) => workout.performed_on >= start && workout.performed_on <= today)
    .reduce((total, workout) => total + workoutVolume(workout.workout_sets), 0);
}

/** One point per date, oldest first, holding each lift's best working set that day. */
export function e1rmHistory(workouts: DashboardWorkout[]) {
  const points = new Map<string, E1rmPoint>();
  for (const workout of workouts) {
    for (const set of workout.workout_sets) {
      if (set.is_warmup) continue;
      const lift = LIFTS.find((item) => item.category === set.exercises?.category)?.category;
      if (!lift) continue;
      const point = points.get(workout.performed_on) ?? { date: workout.performed_on };
      point[lift] = Math.max(point[lift] ?? 0, estimatedOneRepMax(set.weight, set.reps, set.rpe));
      points.set(workout.performed_on, point);
    }
  }
  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** The best estimate ever for each lift, added up. Null until all three are logged. */
export function bestEstimatedTotal(history: E1rmPoint[]) {
  let total = 0;
  for (const { category } of LIFTS) {
    const best = Math.max(0, ...history.map((point) => point[category] ?? 0));
    if (best === 0) return null;
    total += best;
  }
  return total;
}
