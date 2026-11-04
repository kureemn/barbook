"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { errorProps, FieldError, focusFirstError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddExerciseDialog } from "@/components/workouts/add-exercise-dialog";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { RPE_MEANING } from "@/lib/dashboard";
import { createTemplate, updateTemplate, type Template } from "@/lib/templates";
import { selectClass } from "@/lib/utils";
import { validateTemplate } from "@/lib/validation";
import { loadExercises, type Exercise } from "@/lib/workouts";

const NEW_EXERCISE = "__new__";

type Row = {
  key: number;
  exercise_id: string;
  target_sets: string;
  target_reps: string;
  target_rpe: string;
};

function blankRow(key: number): Row {
  return { key, exercise_id: "", target_sets: "", target_reps: "", target_rpe: "" };
}

function startingRows(template?: Template): Row[] {
  if (!template) return [blankRow(0)];
  return template.template_exercises.map((exercise, index) => ({
    key: index,
    exercise_id: exercise.exercise_id,
    target_sets: String(exercise.target_sets),
    target_reps: String(exercise.target_reps),
    target_rpe: exercise.target_rpe === null ? "" : String(Number(exercise.target_rpe)),
  }));
}

export function TemplateForm({ template }: { template?: Template }) {
  const router = useRouter();
  const [rows, setRows] = useState(() => startingRows(template));
  const nextKey = useRef(rows.length);
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState(template?.name ?? "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [newExerciseFor, setNewExerciseFor] = useState<number | null>(null);

  const validation = validateTemplate({
    name,
    notes,
    exercises: rows.map(({ exercise_id, target_sets, target_reps, target_rpe }) => ({
      exercise_id,
      target_sets,
      target_reps,
      target_rpe,
    })),
  });
  const errors = attempted ? validation.errors : {};
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    loadExercises()
      .then(setExercises)
      .catch(() => setLoadError("Couldn't load your exercises. Please try again."));
  }, []);

  function changeRow(key: number, changes: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAttempted(true);
    if (!validation.success) {
      focusFirstError();
      return;
    }
    setSaving(true);
    const { exercises: targets, ...details } = validation.data;
    try {
      if (template) await updateTemplate(template.id, details, targets);
      else await createTemplate(details, targets);
      router.replace("/templates");
    } catch {
      setError("Couldn't save this template. Check the details and try again.");
      setSaving(false);
    }
  }

  if (loadError) return <PageError message={loadError} />;
  if (!exercises) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-4xl font-bold tracking-wide uppercase">
        {template ? "Edit template" : "New template"}
      </h1>

      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {(error || hasErrors) && (
          <Alert variant="destructive">
            <AlertDescription>{error ?? "Fix the marked fields to save this template."}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            {...errorProps("name-error", errors.name)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>

        <section aria-labelledby="exercises-heading" className="flex flex-col gap-3">
          <h2 id="exercises-heading" className="text-lg font-semibold">
            Exercises
          </h2>
          <p className="text-sm text-muted-foreground">{RPE_MEANING}</p>
          {rows.map((row, index) => {
            const path = `exercises.${index}`;
            return (
              <fieldset key={row.key} className="rounded-lg border bg-card p-4">
                <legend className="px-1 text-sm font-medium">Exercise {index + 1}</legend>
                <div className="grid gap-2">
                  <Label htmlFor={`exercise-${row.key}`}>Exercise</Label>
                  <select
                    id={`exercise-${row.key}`}
                    className={selectClass}
                    required
                    {...errorProps(`exercise-error-${row.key}`, errors[`${path}.exercise_id`])}
                    value={row.exercise_id}
                    onChange={(e) => {
                      if (e.target.value === NEW_EXERCISE) setNewExerciseFor(row.key);
                      else changeRow(row.key, { exercise_id: e.target.value });
                    }}
                  >
                    <option value="" disabled>
                      Choose an exercise
                    </option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                    <option value={NEW_EXERCISE}>+ Add new exercise</option>
                  </select>
                  <FieldError id={`exercise-error-${row.key}`} message={errors[`${path}.exercise_id`]} />
                </div>
                <div className="mt-3 grid grid-cols-3 items-start gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`sets-${row.key}`}>Sets</Label>
                    <Input
                      id={`sets-${row.key}`}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="20"
                      step="1"
                      required
                      {...errorProps(`sets-error-${row.key}`, errors[`${path}.target_sets`])}
                      value={row.target_sets}
                      onChange={(e) => changeRow(row.key, { target_sets: e.target.value })}
                    />
                    <FieldError id={`sets-error-${row.key}`} message={errors[`${path}.target_sets`]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`reps-${row.key}`}>Reps</Label>
                    <Input
                      id={`reps-${row.key}`}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      required
                      {...errorProps(`reps-error-${row.key}`, errors[`${path}.target_reps`])}
                      value={row.target_reps}
                      onChange={(e) => changeRow(row.key, { target_reps: e.target.value })}
                    />
                    <FieldError id={`reps-error-${row.key}`} message={errors[`${path}.target_reps`]} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`rpe-${row.key}`}>RPE</Label>
                    <Input
                      id={`rpe-${row.key}`}
                      type="number"
                      inputMode="decimal"
                      min="6"
                      max="10"
                      step="0.5"
                      {...errorProps(`rpe-error-${row.key}`, errors[`${path}.target_rpe`])}
                      value={row.target_rpe}
                      onChange={(e) => changeRow(row.key, { target_rpe: e.target.value })}
                    />
                    <FieldError id={`rpe-error-${row.key}`} message={errors[`${path}.target_rpe`]} />
                  </div>
                </div>
                {rows.length > 1 && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setRows((current) => current.filter((item) => item.key !== row.key))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove exercise {index + 1}
                    </Button>
                  </div>
                )}
              </fieldset>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((current) => [...current, blankRow(nextKey.current++)])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add exercise
          </Button>
        </section>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save template
          </Button>
          <Button asChild variant="outline">
            <Link href="/templates">Cancel</Link>
          </Button>
        </div>
      </form>

      <AddExerciseDialog
        open={newExerciseFor !== null}
        onClose={() => setNewExerciseFor(null)}
        onCreated={(created) => {
          setExercises((current) => [...(current ?? []), created]);
          if (newExerciseFor !== null) changeRow(newExerciseFor, { exercise_id: created.id });
        }}
      />
    </main>
  );
}
