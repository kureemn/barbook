"use client";

import { client } from "@/lib/neon/client";
import type { SetTarget } from "@/lib/programs";

export type TemplateExercise = {
  id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  target_reps: number;
  target_rpe: number | null;
  exercises: { name: string } | null;
  /** Only program sessions have these, for weights that change within a session. */
  set_targets?: SetTarget[];
  note?: string;
};

export type Template = {
  id: string;
  name: string;
  notes: string | null;
  template_exercises: TemplateExercise[];
};

export type TemplateInput = {
  name: string;
  notes: string | null;
};

export type TemplateExerciseInput = {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  target_rpe: number | null;
};

const TEMPLATE_COLUMNS =
  "id, name, notes, template_exercises(id, exercise_id, position, target_sets, target_reps, target_rpe, exercises(name))";

export async function loadTemplates(): Promise<Template[]> {
  const { data, error } = await client
    .from("templates")
    .select(TEMPLATE_COLUMNS)
    .order("name")
    .order("position", { referencedTable: "template_exercises" });
  if (error) throw error;
  return data as unknown as Template[];
}

/** Returns null when the template doesn't exist or belongs to someone else. */
export async function loadTemplate(id: string): Promise<Template | null> {
  const { data, error } = await client
    .from("templates")
    .select(TEMPLATE_COLUMNS)
    .eq("id", id)
    .order("position", { referencedTable: "template_exercises" })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Template | null;
}

function exerciseRows(templateId: string, exercises: TemplateExerciseInput[]) {
  return exercises.map((exercise, index) => ({
    ...exercise,
    template_id: templateId,
    position: index + 1,
  }));
}

export async function createTemplate(template: TemplateInput, exercises: TemplateExerciseInput[]) {
  const { data, error } = await client.from("templates").insert(template).select("id").single();
  if (error) throw error;
  const id = (data as { id: string }).id;

  const { error: exercisesError } = await client
    .from("template_exercises")
    .insert(exerciseRows(id, exercises));
  if (exercisesError) {
    // Don't leave a template behind with its exercises missing.
    await client.from("templates").delete().eq("id", id);
    throw exercisesError;
  }
  return id;
}

export async function updateTemplate(
  id: string,
  template: TemplateInput,
  exercises: TemplateExerciseInput[]
) {
  const { error } = await client.from("templates").update(template).eq("id", id);
  if (error) throw error;

  // Save the new list before removing the old one, so a failure can't lose it.
  const { data, error: insertError } = await client
    .from("template_exercises")
    .insert(exerciseRows(id, exercises))
    .select("id");
  if (insertError) throw insertError;

  const keptIds = (data as { id: string }[]).map((row) => row.id);
  const { error: deleteError } = await client
    .from("template_exercises")
    .delete()
    .eq("template_id", id)
    .not("id", "in", `(${keptIds.join(",")})`);
  if (deleteError) throw deleteError;
}

export async function deleteTemplate(id: string) {
  const { error } = await client.from("templates").delete().eq("id", id);
  if (error) throw error;
}
