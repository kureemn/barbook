"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { loadTemplate, type Template } from "@/lib/templates";

function NewWorkout() {
  const status = useRequireAuth();
  const templateId = useSearchParams().get("template");
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed" || !templateId) return;
    loadTemplate(templateId)
      .then((loaded) => {
        if (loaded) setTemplate(loaded);
        else setError("We couldn't find that template.");
      })
      .catch(() => setError("We couldn't find that template."));
  }, [status, templateId]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || (templateId && !template)) return <PageLoading />;
  return <WorkoutForm template={template ?? undefined} />;
}

// Reading the link's template needs a Suspense boundary for Next.js to build the page.
export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewWorkout />
    </Suspense>
  );
}
