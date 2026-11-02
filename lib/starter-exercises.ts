import type { Category } from "@/lib/workouts";

// Only the competition lifts get a main-lift category, because the dashboard
// charts by category. A variation like incline bench would distort the bench line.
const accessories = [
  "Back Extension",
  "Barbell Row",
  "Bicep Curl",
  "Bulgarian Split Squat",
  "Cable Row",
  "Calf Raise",
  "Close-Grip Bench",
  "Deficit Deadlift",
  "Dip",
  "Dumbbell Bench",
  "Dumbbell Row",
  "Dumbbell Shoulder Press",
  "Face Pull",
  "Front Squat",
  "Good Morning",
  "Hanging Leg Raise",
  "Hip Thrust",
  "Incline Bench",
  "Lat Pulldown",
  "Lateral Raise",
  "Leg Curl",
  "Leg Extension",
  "Leg Press",
  "Lunge",
  "Military Press",
  "Pause Bench",
  "Pause Squat",
  "Pull-Up",
  "Romanian Deadlift",
  "Sumo Deadlift",
  "Tricep Pushdown",
];

export const STARTER_EXERCISES: { name: string; category: Category }[] = [
  { name: "Squat", category: "squat" },
  { name: "Bench", category: "bench" },
  { name: "Deadlift", category: "deadlift" },
  ...accessories.map((name) => ({ name, category: "accessory" as const })),
];

/** Starter exercises this user doesn't have yet, ignoring differences in case. */
export function missingStarters(existing: { name: string }[]) {
  const names = new Set(existing.map((exercise) => exercise.name.trim().toLowerCase()));
  return STARTER_EXERCISES.filter((starter) => !names.has(starter.name.toLowerCase()));
}
