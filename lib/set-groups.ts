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
