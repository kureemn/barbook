/** Total weight moved in working sets. Warm-ups don't count. */
export function workoutVolume(sets: { weight: number; reps: number; is_warmup: boolean }[]) {
  return sets
    .filter((set) => !set.is_warmup)
    .reduce((total, set) => total + Number(set.weight) * set.reps, 0);
}
