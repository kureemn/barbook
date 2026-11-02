"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { errorProps, FieldError, focusFirstError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import {
  CATEGORIES,
  createExercise,
  createWorkout,
  loadExercises,
  todayLocal,
  updateWorkout,
  type Category,
  type Exercise,
  type Workout,
} from "@/lib/workouts";
import { validateExercise, validateWorkout } from "@/lib/validation";

const NEW_EXERCISE = "__new__";
const selectClass =
  "h-11 w-full rounded-md border border-input bg-input/30 px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/40";

type SetRow = {
  key: number;
  id?: string;
  exercise_id: string;
  weight: string;
  reps: string;
  rpe: string;
  is_warmup: boolean;
};

export function WorkoutForm({ workout }: { workout?: Workout }) {
  const router = useRouter();
  const nextKey = useRef(workout?.workout_sets.length ?? 0);
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState(workout?.title ?? "");
  const [performedOn, setPerformedOn] = useState(workout?.performed_on ?? todayLocal());
  const [bodyweight, setBodyweight] = useState(workout?.bodyweight?.toString() ?? "");
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [rows, setRows] = useState<SetRow[]>(() =>
    (workout?.workout_sets ?? []).map((set, index) => ({
      key: index,
      id: set.id,
      exercise_id: set.exercise_id,
      weight: String(set.weight),
      reps: String(set.reps),
      rpe: set.rpe === null ? "" : String(set.rpe),
      is_warmup: set.is_warmup,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Messages wait for the first save attempt, then update as fields change.
  const [attempted, setAttempted] = useState(false);
  const [newExerciseFor, setNewExerciseFor] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("accessory");
  const [newExerciseError, setNewExerciseError] = useState<string | null>(null);
  const [newExerciseAttempted, setNewExerciseAttempted] = useState(false);

  const validation = validateWorkout({
    title,
    performed_on: performedOn,
    bodyweight,
    notes,
    sets: rows.map(({ id, exercise_id, weight, reps, rpe, is_warmup }) => ({
      id,
      exercise_id,
      weight,
      reps,
      rpe,
      is_warmup,
    })),
  });
  const errors = attempted ? validation.errors : {};
  const hasErrors = Object.keys(errors).length > 0;
  const newExerciseNameError = newExerciseAttempted
    ? validateExercise({ name: newName }).errors.name
    : undefined;

  useEffect(() => {
    loadExercises()
      .then((loaded) => {
        setExercises(loaded);
        setRows((current) =>
          current.length > 0
            ? current
            : [
                {
                  key: nextKey.current++,
                  exercise_id: loaded[0]?.id ?? "",
                  weight: "",
                  reps: "",
                  rpe: "",
                  is_warmup: false,
                },
              ]
        );
      })
      .catch(() => setLoadError("Couldn't load your exercises. Please try again."));
  }, []);

  function changeRow(key: number, changes: Partial<SetRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  // A new set starts from the last one, since most sets repeat the same numbers.
  function addSet() {
    setRows((current) => {
      const last = current[current.length - 1];
      return [
        ...current,
        {
          key: nextKey.current++,
          exercise_id: last?.exercise_id ?? exercises?.[0]?.id ?? "",
          weight: last?.weight ?? "",
          reps: last?.reps ?? "",
          rpe: last?.rpe ?? "",
          is_warmup: last?.is_warmup ?? false,
        },
      ];
    });
  }

  async function handleAddExercise() {
    setNewExerciseError(null);
    setNewExerciseAttempted(true);
    const result = validateExercise({ name: newName });
    if (!result.success) {
      focusFirstError();
      return;
    }
    try {
      const created = await createExercise(result.data.name, newCategory);
      setExercises((current) => [...(current ?? []), created]);
      if (newExerciseFor !== null) changeRow(newExerciseFor, { exercise_id: created.id });
      setNewExerciseFor(null);
      setNewName("");
      setNewCategory("accessory");
      setNewExerciseAttempted(false);
    } catch {
      setNewExerciseError("Couldn't add that exercise. It may already be on your list.");
    }
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
    const { sets, ...details } = validation.data;
    try {
      if (workout) {
        await updateWorkout(workout.id, details, sets);
        router.replace(`/workouts/${workout.id}`);
      } else {
        const id = await createWorkout(details, sets);
        router.replace(`/workouts/${id}`);
      }
    } catch {
      setError("Couldn't save this workout. Check the details and try again.");
      setSaving(false);
    }
  }

  if (loadError) return <PageError message={loadError} />;
  if (!exercises) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {workout ? "Edit workout" : "Add workout"}
      </h1>

      <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {(error || hasErrors) && (
          <Alert variant="destructive">
            <AlertDescription>{error ?? "Fix the marked fields to save this workout."}</AlertDescription>
          </Alert>
        )}

        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              {...errorProps("title-error", errors.title)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FieldError id="title-error" message={errors.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="performed-on">Date</Label>
            <Input
              id="performed-on"
              type="date"
              required
              {...errorProps("performed-on-error", errors.performed_on)}
              value={performedOn}
              onChange={(e) => setPerformedOn(e.target.value)}
            />
            <FieldError id="performed-on-error" message={errors.performed_on} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bodyweight">Bodyweight (lb, optional)</Label>
            <Input
              id="bodyweight"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              {...errorProps("bodyweight-error", errors.bodyweight)}
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
            />
            <FieldError id="bodyweight-error" message={errors.bodyweight} />
          </div>
        </div>

        <section aria-labelledby="sets-heading" className="flex flex-col gap-3">
          <h2 id="sets-heading" className="text-lg font-semibold">
            Sets
          </h2>
          {rows.map((row, index) => (
            <fieldset key={row.key} className="rounded-lg border bg-card p-4">
              <legend className="px-1 text-sm font-medium">Set {index + 1}</legend>
              <div className="grid grid-cols-3 items-start gap-3">
                <div className="col-span-3 grid gap-2">
                  <Label htmlFor={`exercise-${row.key}`}>Exercise</Label>
                  <select
                    id={`exercise-${row.key}`}
                    className={selectClass}
                    required
                    {...errorProps(`exercise-error-${row.key}`, errors[`sets.${index}.exercise_id`])}
                    value={row.exercise_id}
                    onChange={(e) => {
                      if (e.target.value === NEW_EXERCISE) {
                        setNewExerciseError(null);
                        setNewExerciseAttempted(false);
                        setNewExerciseFor(row.key);
                      } else {
                        changeRow(row.key, { exercise_id: e.target.value });
                      }
                    }}
                  >
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                    <option value={NEW_EXERCISE}>+ Add new exercise</option>
                  </select>
                  <FieldError
                    id={`exercise-error-${row.key}`}
                    message={errors[`sets.${index}.exercise_id`]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`weight-${row.key}`}>Weight (lb)</Label>
                  <Input
                    id={`weight-${row.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    {...errorProps(`weight-error-${row.key}`, errors[`sets.${index}.weight`])}
                    value={row.weight}
                    onChange={(e) => changeRow(row.key, { weight: e.target.value })}
                  />
                  <FieldError id={`weight-error-${row.key}`} message={errors[`sets.${index}.weight`]} />
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
                    {...errorProps(`reps-error-${row.key}`, errors[`sets.${index}.reps`])}
                    value={row.reps}
                    onChange={(e) => changeRow(row.key, { reps: e.target.value })}
                  />
                  <FieldError id={`reps-error-${row.key}`} message={errors[`sets.${index}.reps`]} />
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
                    {...errorProps(`rpe-error-${row.key}`, errors[`sets.${index}.rpe`])}
                    value={row.rpe}
                    onChange={(e) => changeRow(row.key, { rpe: e.target.value })}
                  />
                  <FieldError id={`rpe-error-${row.key}`} message={errors[`sets.${index}.rpe`]} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={row.is_warmup}
                    onChange={(e) => changeRow(row.key, { is_warmup: e.target.checked })}
                  />
                  Warm-up
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((current) => current.filter((item) => item.key !== row.key))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove set {index + 1}
                </Button>
              </div>
            </fieldset>
          ))}
          <Button type="button" variant="outline" onClick={addSet}>
            <Plus className="size-4" aria-hidden="true" />
            Add set
          </Button>
        </section>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save workout
          </Button>
          <Button asChild variant="outline">
            <Link href={workout ? `/workouts/${workout.id}` : "/workouts"}>Cancel</Link>
          </Button>
        </div>
      </form>

      <Dialog
        open={newExerciseFor !== null}
        onOpenChange={(open) => {
          if (!open) setNewExerciseFor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
            <DialogDescription>It stays on your list for future workouts.</DialogDescription>
          </DialogHeader>
          {newExerciseError && (
            <Alert variant="destructive">
              <AlertDescription>{newExerciseError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="new-exercise-name">Name</Label>
            <Input
              id="new-exercise-name"
              required
              {...errorProps("new-exercise-name-error", newExerciseNameError)}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <FieldError id="new-exercise-name-error" message={newExerciseNameError} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-exercise-category">Category</Label>
            <select
              id="new-exercise-category"
              className={selectClass}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category[0].toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddExercise}>
              Add exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
