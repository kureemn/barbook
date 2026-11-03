"use client";

import { client } from "@/lib/neon/client";
import type { ProgramKey, ProgramSession, SessionKey } from "@/lib/programs";
import type { Template } from "@/lib/templates";
import type { Exercise } from "@/lib/workouts";

export type LoggedSession = SessionKey & { workout_id: string };

export type ProgramRun = {
  id: string;
  program_key: string;
  started_on: string;
  program_sessions: LoggedSession[];
};

/** The program this lifter is on now, or null. A partial unique index allows only one. */
export async function loadActiveRun(): Promise<ProgramRun | null> {
  const { data, error } = await client
    .from("program_runs")
    .select("id, program_key, started_on, program_sessions(week, day, workout_id)")
    .is("ended_on", null)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ProgramRun | null;
}

export async function startProgram(key: ProgramKey, today: string) {
  const { error } = await client
    .from("program_runs")
    .insert({ program_key: key, started_on: today });
  if (error) throw error;
}

/** Keeps the run and its workouts as history, and frees the lifter to start again. */
export async function endProgram(runId: string, today: string) {
  const { error } = await client.from("program_runs").update({ ended_on: today }).eq("id", runId);
  if (error) throw error;
}

export async function recordSession(runId: string, key: SessionKey, workoutId: string) {
  const { error } = await client
    .from("program_sessions")
    .insert({ run_id: runId, week: key.week, day: key.day, workout_id: workoutId });
  if (error) throw error;
}

/** Shapes a session like a template, so the workout form can start from either one. */
export function sessionAsTemplate(session: ProgramSession, exercises: Exercise[]): Template {
  return {
    id: `${session.week}-${session.day}`,
    name: session.title,
    notes: null,
    template_exercises: session.exercises.flatMap((target, index) => {
      const exercise = exercises.find(
        (item) => item.name.trim().toLowerCase() === target.name.toLowerCase()
      );
      if (!exercise) return [];
      return [
        {
          id: `${index}`,
          exercise_id: exercise.id,
          position: index + 1,
          target_sets: target.sets,
          target_reps: target.reps,
          target_rpe: target.rpe,
          set_targets: target.setTargets,
          note: target.note,
          exercises: { name: exercise.name },
        },
      ];
    }),
  };
}
