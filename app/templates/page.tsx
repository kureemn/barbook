"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { WorkoutNav } from "@/components/workouts/workout-nav";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { deleteTemplate, loadTemplates, type Template } from "@/lib/templates";

export default function TemplatesPage() {
  const status = useRequireAuth();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status !== "authed") return;
    loadTemplates()
      .then(setTemplates)
      .catch(() => setError("Couldn't load your templates. Please try again."));
  }, [status]);

  async function handleDelete() {
    if (!confirming) return;
    setDeleting(true);
    try {
      await deleteTemplate(confirming.id);
      setTemplates((current) => (current ?? []).filter((item) => item.id !== confirming.id));
      setConfirming(null);
      toast.success("Template deleted.");
    } catch {
      toast.error("Couldn't delete that template. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !templates) return <PageLoading />;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-wide uppercase">Templates</h1>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="size-4" aria-hidden="true" />
            New template
          </Link>
        </Button>
      </div>
      <WorkoutNav current="/templates" />

      {templates.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          No templates yet. Build one to start your workouts with your targets filled in.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {templates.map((template) => (
            <li key={template.id} className="rounded-lg border bg-card p-4">
              <h2 className="text-2xl font-semibold tracking-wide uppercase">{template.name}</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                {template.template_exercises.map((exercise) => (
                  <li key={exercise.id} className="tabular-nums">
                    {exercise.exercises?.name ?? "Exercise"}: {exercise.target_sets} ×{" "}
                    {exercise.target_reps}
                    {exercise.target_rpe !== null && ` @ RPE ${Number(exercise.target_rpe)}`}
                  </li>
                ))}
              </ul>
              {template.notes && (
                <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {template.notes}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/workouts/new?template=${template.id}`}>
                    <Play className="size-4" aria-hidden="true" />
                    Start workout
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/templates/${template.id}/edit`} aria-label={`Edit ${template.name}`}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  aria-label={`Delete ${template.name}`}
                  onClick={() => setConfirming(template)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this template?</DialogTitle>
            <DialogDescription>
              Are you sure? This permanently deletes “{confirming?.name}”. Workouts you started from
              it stay in your log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Delete template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
