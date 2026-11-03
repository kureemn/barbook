"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ExerciseDetails } from "@/components/exercises/exercise-details";
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
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { StarButton } from "@/components/workouts/star-button";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { groupByExercise } from "@/lib/set-groups";
import { workoutVolume } from "@/lib/volume";
import {
  deleteWorkout,
  formatDate,
  loadWorkout,
  type Workout,
} from "@/lib/workouts";

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const status = useRequireAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadWorkout(id)
      .then((loaded) => {
        if (loaded) setWorkout(loaded);
        else setError("We couldn't find that workout.");
      })
      .catch(() => setError("We couldn't find that workout."));
  }, [status, id]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkout(id);
      toast.success("Workout deleted.");
      router.replace("/workouts");
    } catch {
      setDeleteError("Couldn't delete this workout. Please try again.");
      setDeleting(false);
    }
  }

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workout) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link
        href="/workouts"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All workouts
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-4xl font-bold tracking-wide uppercase">{workout.title}</h1>
        <StarButton
          workoutId={workout.id}
          title={workout.title}
          initialStarred={workout.stars !== null}
        />
      </div>
      <p className="mt-1 text-muted-foreground">
        {formatDate(workout.performed_on)}
        {workout.bodyweight !== null && ` · ${workout.bodyweight} lb bodyweight`}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <dt className="text-sm text-muted-foreground">Working volume</dt>
          <dd className="mt-1 font-heading text-3xl font-bold tabular-nums">
            {workoutVolume(workout.workout_sets).toLocaleString()} lb
          </dd>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <dt className="text-sm text-muted-foreground">Working sets</dt>
          <dd className="mt-1 font-heading text-3xl font-bold tabular-nums">
            {workout.workout_sets.filter((set) => !set.is_warmup).length}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/workouts/${workout.id}/edit`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {groupByExercise(workout.workout_sets).map((group) => (
          <section key={group.sets[0].id} className="rounded-lg border bg-card p-4">
            <h2 className="text-2xl font-semibold tracking-wide uppercase">
              {group.sets[0].exercises?.name ?? "Exercise"}
            </h2>
            <div className="mt-3 empty:hidden">
              <ExerciseDetails name={group.sets[0].exercises?.name} />
            </div>
            <ol className="mt-3 flex flex-col gap-2">
              {group.sets.map((set, setIndex) => (
                <li key={set.id} className="flex flex-wrap items-center gap-x-3 text-lg tabular-nums">
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-secondary text-sm font-semibold"
                  >
                    {setIndex + 1}
                  </span>
                  <span>
                    {Number(set.weight)} lb × {set.reps}
                  </span>
                  {set.rpe !== null && (
                    <span className="text-sm text-muted-foreground">RPE {Number(set.rpe)}</span>
                  )}
                  {set.is_warmup && <span className="text-sm text-muted-foreground">Warm-up</span>}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {workout.notes && (
        <section className="mt-6">
          <h2 className="text-2xl font-semibold tracking-wide uppercase">Notes</h2>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{workout.notes}</p>
        </section>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this workout?</DialogTitle>
            <DialogDescription>
              Are you sure? This permanently deletes “{workout.title}” and all of its sets.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep workout
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
