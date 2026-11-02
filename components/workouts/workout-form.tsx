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
import { flattenGroups, groupByExercise } from "@/lib/set-groups";
import { selectClass } from "@/lib/utils";
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

type SetRow = {
  key: number;
  id?: string;
  weight: string;
  reps: string;
  rpe: string;
  is_warmup: boolean;
};

type ExerciseGroup = {
  key: number;
  exercise_id: string;
  sets: SetRow[];
};

function blankSet(key: number): SetRow {
  return { key, weight: "", reps: "", rpe: "", is_warmup: false };
}

/** Starts from the saved sets, or one empty exercise for a new workout. */
function startingGroups(workout?: Workout): ExerciseGroup[] {
  if (!workout) return [{ key: 0, exercise_id: "", sets: [blankSet(0)] }];
  let setKey = 0;
  return groupByExercise(workout.workout_sets).map((group, index) => ({
    key: index,
    exercise_id: group.exercise_id,
    sets: group.sets.map((set) => ({
      key: setKey++,
      id: set.id,
      weight: String(set.weight),
      reps: String(set.reps),
      rpe: set.rpe === null ? "" : String(set.rpe),
      is_warmup: set.is_warmup,
    })),
  }));
}

export function WorkoutForm({ workout }: { workout?: Workout }) {
  const router = useRouter();
  // Past every starting key, since each group has at least one set.
  const nextKey = useRef(Math.max(workout?.workout_sets.length ?? 0, 1));
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState(workout?.title ?? "");
  const [performedOn, setPerformedOn] = useState(workout?.performed_on ?? todayLocal());
  const [bodyweight, setBodyweight] = useState(workout?.bodyweight?.toString() ?? "");
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [groups, setGroups] = useState(() => startingGroups(workout));
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
    sets: flattenGroups(groups).map(({ id, exercise_id, weight, reps, rpe, is_warmup }) => ({
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
      .then(setExercises)
      .catch(() => setLoadError("Couldn't load your exercises. Please try again."));
  }, []);

  function changeGroup(key: number, changes: Partial<ExerciseGroup>) {
    setGroups((current) =>
      current.map((group) => (group.key === key ? { ...group, ...changes } : group))
    );
  }

  function changeSet(groupKey: number, setKey: number, changes: Partial<SetRow>) {
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? {
              ...group,
              sets: group.sets.map((set) => (set.key === setKey ? { ...set, ...changes } : set)),
            }
          : group
      )
    );
  }

  // A new set starts from the last one, since most sets repeat the same numbers.
  function addSet(groupKey: number) {
    const key = nextKey.current++;
    setGroups((current) =>
      current.map((group) => {
        if (group.key !== groupKey) return group;
        const last = group.sets[group.sets.length - 1];
        return { ...group, sets: [...group.sets, { ...last, id: undefined, key }] };
      })
    );
  }

  function removeSet(groupKey: number, setKey: number) {
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? { ...group, sets: group.sets.filter((set) => set.key !== setKey) }
          : group
      )
    );
  }

  // The exercise starts empty, so a set can't get logged under a lift by accident.
  function addExercise() {
    const groupKey = nextKey.current++;
    const setKey = nextKey.current++;
    setGroups((current) => [
      ...current,
      { key: groupKey, exercise_id: "", sets: [blankSet(setKey)] },
    ]);
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
      if (newExerciseFor !== null) changeGroup(newExerciseFor, { exercise_id: created.id });
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

        <section aria-labelledby="exercises-heading" className="flex flex-col gap-3">
          <h2 id="exercises-heading" className="text-lg font-semibold">
            Exercises
          </h2>
          {groups.map((group, groupIndex) => {
            // Errors are keyed by a set's place in the whole workout.
            const firstSet = groups
              .slice(0, groupIndex)
              .reduce((total, earlier) => total + earlier.sets.length, 0);
            const exerciseError = errors[`sets.${firstSet}.exercise_id`];
            return (
              <fieldset key={group.key} className="rounded-lg border bg-card p-4">
                <legend className="px-1 text-sm font-medium">Exercise {groupIndex + 1}</legend>
                <div className="grid gap-2">
                  <Label htmlFor={`exercise-${group.key}`}>Exercise</Label>
                  <select
                    id={`exercise-${group.key}`}
                    className={selectClass}
                    required
                    {...errorProps(`exercise-error-${group.key}`, exerciseError)}
                    value={group.exercise_id}
                    onChange={(e) => {
                      if (e.target.value === NEW_EXERCISE) {
                        setNewExerciseError(null);
                        setNewExerciseAttempted(false);
                        setNewExerciseFor(group.key);
                      } else {
                        changeGroup(group.key, { exercise_id: e.target.value });
                      }
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
                  <FieldError id={`exercise-error-${group.key}`} message={exerciseError} />
                </div>

                <ol className="mt-4 flex flex-col gap-4">
                  {group.sets.map((set, setIndex) => {
                    const path = `sets.${firstSet + setIndex}`;
                    return (
                      <li key={set.key} className="border-t pt-3">
                        <div role="group" aria-label={`Set ${setIndex + 1}`}>
                          <p aria-hidden="true" className="text-sm font-medium">
                            Set {setIndex + 1}
                          </p>
                          <div className="mt-2 grid grid-cols-3 items-start gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor={`weight-${set.key}`}>Weight (lb)</Label>
                              <Input
                                id={`weight-${set.key}`}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="any"
                                required
                                {...errorProps(`weight-error-${set.key}`, errors[`${path}.weight`])}
                                value={set.weight}
                                onChange={(e) =>
                                  changeSet(group.key, set.key, { weight: e.target.value })
                                }
                              />
                              <FieldError
                                id={`weight-error-${set.key}`}
                                message={errors[`${path}.weight`]}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`reps-${set.key}`}>Reps</Label>
                              <Input
                                id={`reps-${set.key}`}
                                type="number"
                                inputMode="numeric"
                                min="1"
                                step="1"
                                required
                                {...errorProps(`reps-error-${set.key}`, errors[`${path}.reps`])}
                                value={set.reps}
                                onChange={(e) =>
                                  changeSet(group.key, set.key, { reps: e.target.value })
                                }
                              />
                              <FieldError
                                id={`reps-error-${set.key}`}
                                message={errors[`${path}.reps`]}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`rpe-${set.key}`}>RPE</Label>
                              <Input
                                id={`rpe-${set.key}`}
                                type="number"
                                inputMode="decimal"
                                min="6"
                                max="10"
                                step="0.5"
                                {...errorProps(`rpe-error-${set.key}`, errors[`${path}.rpe`])}
                                value={set.rpe}
                                onChange={(e) =>
                                  changeSet(group.key, set.key, { rpe: e.target.value })
                                }
                              />
                              <FieldError
                                id={`rpe-error-${set.key}`}
                                message={errors[`${path}.rpe`]}
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <label className="flex min-h-11 items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="size-5 accent-primary"
                                checked={set.is_warmup}
                                onChange={(e) =>
                                  changeSet(group.key, set.key, { is_warmup: e.target.checked })
                                }
                              />
                              Warm-up
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={group.sets.length === 1}
                              onClick={() => removeSet(group.key, set.key)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Remove set {setIndex + 1}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Add set to exercise ${groupIndex + 1}`}
                    onClick={() => addSet(group.key)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add set
                  </Button>
                  {groups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setGroups((current) => current.filter((item) => item.key !== group.key))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove exercise {groupIndex + 1}
                    </Button>
                  )}
                </div>
              </fieldset>
            );
          })}
          <Button type="button" variant="outline" onClick={addExercise}>
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
