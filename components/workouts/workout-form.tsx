"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ExerciseDetails } from "@/components/exercises/exercise-details";
import { errorProps, FieldError, focusFirstError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddExerciseDialog } from "@/components/workouts/add-exercise-dialog";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { RestAnnouncement, SetRest, useRestTimer } from "@/components/workouts/rest-timer";
import { recordSession } from "@/lib/program-runs";
import type { SessionKey } from "@/lib/programs";
import { flattenGroups, groupByExercise, setsFromTemplate } from "@/lib/set-groups";
import type { Suggestion } from "@/lib/suggestions";
import type { Template } from "@/lib/templates";
import { selectClass } from "@/lib/utils";
import {
  createWorkout,
  deleteWorkout,
  formatDate,
  loadExercises,
  todayLocal,
  updateWorkout,
  type Exercise,
  type Workout,
} from "@/lib/workouts";
import { validateWorkout } from "@/lib/validation";

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
  suggestion?: Suggestion;
  target?: { reps: number; rpe: number | null };
};

function blankSet(key: number): SetRow {
  return { key, weight: "", reps: "", rpe: "", is_warmup: false };
}

/** Starts from the saved sets, the template's targets, or one empty exercise. */
function startingGroups(
  workout?: Workout,
  template?: Template,
  suggestions: Record<string, Suggestion> = {}
): ExerciseGroup[] {
  let setKey = 0;
  if (template) {
    const targets = template.template_exercises;
    return setsFromTemplate(targets, (exercise) =>
      exercise.id ? suggestions[exercise.id]?.weight : undefined
    ).map((group, index) => ({
      key: index,
      exercise_id: group.exercise_id,
      sets: group.sets.map((set) => ({ ...set, key: setKey++ })),
      suggestion: suggestions[targets[index].id],
      target: { reps: targets[index].target_reps, rpe: targets[index].target_rpe },
    }));
  }
  if (!workout) return [{ key: 0, exercise_id: "", sets: [blankSet(0)] }];
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

export function WorkoutForm({
  workout,
  template,
  suggestions,
  program,
}: {
  workout?: Workout;
  template?: Template;
  suggestions?: Record<string, Suggestion>;
  program?: SessionKey & { runId: string };
}) {
  const router = useRouter();
  const timer = useRestTimer();
  const [groups, setGroups] = useState(() => startingGroups(workout, template, suggestions));
  // Past every starting key, since each group has at least one set.
  const nextKey = useRef(groups.reduce((total, group) => total + group.sets.length, 0));
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState(workout?.title ?? template?.name ?? "");
  const [performedOn, setPerformedOn] = useState(workout?.performed_on ?? todayLocal());
  const [bodyweight, setBodyweight] = useState(workout?.bodyweight?.toString() ?? "");
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Messages wait for the first save attempt, then update as fields change.
  const [attempted, setAttempted] = useState(false);
  const [newExerciseFor, setNewExerciseFor] = useState<number | null>(null);

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
    timer.releaseSet(setKey);
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
        // A program session is shaped like a template, but has no template row to link to.
        const templateId = program ? null : (template?.id ?? null);
        const id = await createWorkout({ ...details, template_id: templateId }, sets);
        if (program) {
          try {
            await recordSession(program.runId, program, id);
          } catch (recordError) {
            // Undo it, so saving again can't log the same session's workout twice.
            await deleteWorkout(id);
            throw recordError;
          }
        }
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
        {workout ? "Edit workout" : "Workout"}
      </h1>
      {template && (
        <p className="mt-2 text-sm text-muted-foreground">
          Started from {template.name}. Your targets and any suggested weights are filled in, so
          change anything that differed.
        </p>
      )}

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
                        setNewExerciseFor(group.key);
                      } else {
                        // A suggestion belongs to the exercise it was worked out for.
                        changeGroup(group.key, {
                          exercise_id: e.target.value,
                          suggestion: undefined,
                          target: undefined,
                        });
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
                <div className="mt-3 empty:hidden">
                  <ExerciseDetails
                    name={exercises.find((exercise) => exercise.id === group.exercise_id)?.name}
                  />
                </div>
                {group.suggestion && group.target && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Suggested {group.suggestion.weight} lb for {group.target.reps} reps
                    {group.target.rpe !== null && ` at RPE ${Number(group.target.rpe)}`}. Based on{" "}
                    {Number(group.suggestion.basedOn.weight)} lb × {group.suggestion.basedOn.reps}
                    {group.suggestion.basedOn.rpe !== null &&
                      ` at RPE ${Number(group.suggestion.basedOn.rpe)}`}{" "}
                    on {formatDate(group.suggestion.basedOn.performed_on)}.
                  </p>
                )}
                {!group.suggestion && group.target && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aim for {group.target.reps} reps
                    {group.target.rpe !== null && ` at RPE ${Number(group.target.rpe)}`}. There&apos;s no
                    history to suggest a weight from yet, so choose your own.
                  </p>
                )}

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
                          <div className="mt-2">
                            <SetRest
                              timer={timer}
                              setKey={set.key}
                              setNumber={setIndex + 1}
                            />
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
                      onClick={() => {
                        group.sets.forEach((set) => timer.releaseSet(set.key));
                        setGroups((current) => current.filter((item) => item.key !== group.key));
                      }}
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

      <RestAnnouncement timer={timer} />

      <AddExerciseDialog
        open={newExerciseFor !== null}
        onClose={() => setNewExerciseFor(null)}
        onCreated={(created) => {
          setExercises((current) => [...(current ?? []), created]);
          if (newExerciseFor !== null) {
            changeGroup(newExerciseFor, {
              exercise_id: created.id,
              suggestion: undefined,
              target: undefined,
            });
          }
        }}
      />
    </main>
  );
}
