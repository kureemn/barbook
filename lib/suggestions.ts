import { estimatedOneRepMax } from "@/lib/dashboard";

export type HistorySet = {
  exercise_id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  performed_on: string;
  created_at: string;
};

export type Suggestion = {
  weight: number;
  basedOn: HistorySet;
};

/**
 * The heaviest working set from the last workout with this exercise. Sets at the
 * same weight are settled by the lowest estimate, so a suggestion stays cautious.
 */
export function lastTopSet(sets: HistorySet[], exerciseId: string, today: string) {
  const history = sets.filter(
    (set) => set.exercise_id === exerciseId && set.performed_on <= today
  );
  const isLater = (a: HistorySet, b: HistorySet) =>
    a.performed_on > b.performed_on ||
    (a.performed_on === b.performed_on && a.created_at > b.created_at);
  const latest = history.reduce<HistorySet | null>(
    (current, set) => (!current || isLater(set, current) ? set : current),
    null
  );
  if (!latest) return null;

  return history
    .filter((set) => set.performed_on === latest.performed_on && set.created_at === latest.created_at)
    .reduce((top, set) => {
      const difference = Number(set.weight) - Number(top.weight);
      if (difference !== 0) return difference > 0 ? set : top;
      return estimatedOneRepMax(set.weight, set.reps, set.rpe) <
        estimatedOneRepMax(top.weight, top.reps, top.rpe)
        ? set
        : top;
    });
}

/**
 * Suggested weight = estimated 1-rep max / (1 + (target reps + 10 - target RPE) / 30),
 * rounded to the nearest 5 lb. If that isn't above the last weight and the last set
 * was at or below the target RPE, add 5 lb. With no target RPE, aim for the same
 * effort as last time, not an all-out set. A set with no weight has nothing to scale.
 */
export function suggestWeight(
  last: Pick<HistorySet, "weight" | "reps" | "rpe">,
  targetReps: number,
  targetRpe: number | null
) {
  const lastWeight = Number(last.weight);
  if (lastWeight <= 0) return null;

  const lastRpe = last.rpe === null ? 10 : Number(last.rpe);
  const target = targetRpe === null ? lastRpe : Number(targetRpe);
  const oneRepMax = estimatedOneRepMax(lastWeight, last.reps, last.rpe);
  const suggested = Math.round(oneRepMax / (1 + (targetReps + 10 - target) / 30) / 5) * 5;

  if (suggested <= lastWeight && lastRpe <= target) return lastWeight + 5;
  return suggested > 0 ? suggested : null;
}

/**
 * The working set with the highest estimated 1-rep max. A program's training max uses
 * this, so a routine heavy single logged without RPE can't shrink it.
 */
export function bestSet(sets: HistorySet[], exerciseId: string, today: string) {
  const estimate = (set: HistorySet) => estimatedOneRepMax(set.weight, set.reps, set.rpe);
  return sets
    .filter((set) => set.exercise_id === exerciseId && set.performed_on <= today)
    .reduce<HistorySet | null>(
      (best, set) => (!best || estimate(set) > estimate(best) ? set : best),
      null
    );
}

/** Suggestions for a template's exercises, keyed by template exercise id. */
export function suggestionsForTemplate(
  exercises: {
    id: string;
    exercise_id: string;
    target_reps: number;
    target_rpe: number | null;
    set_targets?: unknown[];
  }[],
  history: HistorySet[],
  today: string
) {
  const suggestions: Record<string, Suggestion> = {};
  for (const exercise of exercises) {
    const last = exercise.set_targets
      ? bestSet(history, exercise.exercise_id, today)
      : lastTopSet(history, exercise.exercise_id, today);
    if (!last) continue;
    const weight = suggestWeight(last, exercise.target_reps, exercise.target_rpe);
    if (weight !== null) suggestions[exercise.id] = { weight, basedOn: last };
  }
  return suggestions;
}
