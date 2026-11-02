"use client";

import type { DashboardWorkout } from "@/lib/dashboard";
import { client } from "@/lib/neon/client";

export const CATEGORIES = ["squat", "bench", "deadlift", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Exercise = {
  id: string;
  name: string;
  category: Category;
};

export type WorkoutSet = {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
  exercises?: { name: string };
};

export type Workout = {
  id: string;
  title: string;
  performed_on: string;
  bodyweight: number | null;
  notes: string | null;
  workout_sets: WorkoutSet[];
  // One object or null, not a list: the stars key (user_id, workout_id) matches
  // its link to workouts, so the Data API treats this as one-to-one.
  stars: { workout_id: string } | null;
};

export type WorkoutInput = {
  title: string;
  performed_on: string;
  bodyweight: number | null;
  notes: string | null;
};

export type SetInput = {
  id?: string;
  exercise_id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
};

const STARTER_EXERCISES: { name: string; category: Category }[] = [
  { name: "Squat", category: "squat" },
  { name: "Bench", category: "bench" },
  { name: "Deadlift", category: "deadlift" },
];

/** Today in the lifter's own timezone, as YYYY-MM-DD. */
export function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Formats a YYYY-MM-DD date without shifting it across timezones. */
export function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Competition order first: squat, bench, deadlift, then accessories by name. */
function sortExercises(exercises: Exercise[]) {
  return [...exercises].sort(
    (a, b) =>
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
      a.name.localeCompare(b.name)
  );
}

/** Gives a new account the three competition lifts, so logging works right away. */
export async function loadExercises(): Promise<Exercise[]> {
  const query = () =>
    client.from("exercises").select("id, name, category");

  const { data, error } = await query();
  if (error) throw error;
  if (data.length > 0) return sortExercises(data as Exercise[]);

  const { error: seedError } = await client
    .from("exercises")
    .upsert(STARTER_EXERCISES, { onConflict: "user_id,name", ignoreDuplicates: true });
  if (seedError) throw seedError;

  const { data: seeded, error: reloadError } = await query();
  if (reloadError) throw reloadError;
  return sortExercises(seeded as Exercise[]);
}

export async function createExercise(name: string, category: Category) {
  const { data, error } = await client
    .from("exercises")
    .insert({ name, category })
    .select("id, name, category")
    .single();
  if (error) throw error;
  return data as Exercise;
}

export async function loadWorkouts({ starredOnly = false } = {}): Promise<Workout[]> {
  // An inner join keeps only workouts with a star. Row Level Security means the
  // only stars visible here are the signed-in user's own.
  const stars = starredOnly ? "stars!inner(workout_id)" : "stars(workout_id)";
  const { data, error } = await client
    .from("workouts")
    .select(`id, title, performed_on, bodyweight, notes, workout_sets(id, exercise_id, weight, reps, is_warmup), ${stars}`)
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Workout[];
}

export async function loadDashboardWorkouts(): Promise<DashboardWorkout[]> {
  const { data, error } = await client
    .from("workouts")
    .select("performed_on, workout_sets(weight, reps, rpe, is_warmup, exercises(category))");
  if (error) throw error;
  return data as unknown as DashboardWorkout[];
}

/** Returns null when the workout doesn't exist or belongs to someone else. */
export async function loadWorkout(id: string): Promise<Workout | null> {
  const { data, error } = await client
    .from("workouts")
    .select(
      "id, title, performed_on, bodyweight, notes, workout_sets(id, exercise_id, set_number, weight, reps, rpe, is_warmup, exercises(name)), stars(workout_id)"
    )
    .eq("id", id)
    .order("set_number", { referencedTable: "workout_sets" })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Workout | null;
}

function setRows(workoutId: string, sets: SetInput[]) {
  return sets.map((set, index) => ({
    workout_id: workoutId,
    exercise_id: set.exercise_id,
    set_number: index + 1,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe,
    is_warmup: set.is_warmup,
  }));
}

export async function createWorkout(workout: WorkoutInput, sets: SetInput[]) {
  const { data, error } = await client.from("workouts").insert(workout).select("id").single();
  if (error) throw error;
  const id = (data as { id: string }).id;

  const { error: setsError } = await client.from("workout_sets").insert(setRows(id, sets));
  if (setsError) {
    // Don't leave a workout behind with its sets missing.
    await client.from("workouts").delete().eq("id", id);
    throw setsError;
  }
  return id;
}

export async function updateWorkout(id: string, workout: WorkoutInput, sets: SetInput[]) {
  const { error } = await client.from("workouts").update(workout).eq("id", id);
  if (error) throw error;

  const rows = setRows(id, sets);
  const keptIds: string[] = [];

  // Save the new values before removing anything, so a failure can't lose sets.
  for (const [index, set] of sets.entries()) {
    if (set.id) {
      keptIds.push(set.id);
      const { error: updateError } = await client
        .from("workout_sets")
        .update(rows[index])
        .eq("id", set.id);
      if (updateError) throw updateError;
    } else {
      const { data, error: insertError } = await client
        .from("workout_sets")
        .insert(rows[index])
        .select("id")
        .single();
      if (insertError) throw insertError;
      keptIds.push((data as { id: string }).id);
    }
  }

  const { error: deleteError } = await client
    .from("workout_sets")
    .delete()
    .eq("workout_id", id)
    .not("id", "in", `(${keptIds.join(",")})`);
  if (deleteError) throw deleteError;
}

export async function deleteWorkout(id: string) {
  const { error } = await client.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

export async function setStarred(workoutId: string, starred: boolean) {
  const { error } = starred
    ? await client.from("stars").insert({ workout_id: workoutId })
    : await client.from("stars").delete().eq("workout_id", workoutId);
  if (error) throw error;
}
