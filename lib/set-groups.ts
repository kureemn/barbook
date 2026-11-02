/** Groups consecutive sets of the same exercise, keeping the order they were done. */
export function groupByExercise<Set extends { exercise_id: string }>(sets: Set[]) {
  const groups: { exercise_id: string; sets: Set[] }[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.exercise_id === set.exercise_id) last.sets.push(set);
    else groups.push({ exercise_id: set.exercise_id, sets: [set] });
  }
  return groups;
}

/** Back to one list of sets, each carrying its group's exercise. */
export function flattenGroups<Set>(groups: { exercise_id: string; sets: Set[] }[]) {
  return groups.flatMap((group) =>
    group.sets.map((set) => ({ ...set, exercise_id: group.exercise_id }))
  );
}

/** One group per template exercise, with its target sets ready to fill in. Weight stays blank. */
export function setsFromTemplate(
  exercises: {
    exercise_id: string;
    target_sets: number;
    target_reps: number;
    target_rpe: number | null;
  }[]
) {
  return exercises.map((exercise) => ({
    exercise_id: exercise.exercise_id,
    sets: Array.from({ length: exercise.target_sets }, () => ({
      weight: "",
      reps: String(exercise.target_reps),
      rpe: exercise.target_rpe === null ? "" : String(Number(exercise.target_rpe)),
      is_warmup: false,
    })),
  }));
}
