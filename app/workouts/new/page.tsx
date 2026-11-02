"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { suggestionsForTemplate, type Suggestion } from "@/lib/suggestions";
import { loadTemplate, type Template } from "@/lib/templates";
import { loadSetHistory, todayLocal } from "@/lib/workouts";

function NewWorkout() {
  const status = useRequireAuth();
  const templateId = useSearchParams().get("template");
  const [template, setTemplate] = useState<Template | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed" || !templateId) return;
    loadTemplate(templateId)
      .then(async (loaded) => {
        if (!loaded) {
          setError("We couldn't find that template.");
          return;
        }
        // Suggestions are a convenience, so a failure here shouldn't block logging.
        try {
          const exercises = loaded.template_exercises;
          const history = await loadSetHistory(exercises.map((exercise) => exercise.exercise_id));
          setSuggestions(suggestionsForTemplate(exercises, history, todayLocal()));
        } catch {
          setSuggestions({});
        }
        setTemplate(loaded);
      })
      .catch(() => setError("We couldn't find that template."));
  }, [status, templateId]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || (templateId && !template)) return <PageLoading />;
  return <WorkoutForm template={template ?? undefined} suggestions={suggestions} />;
}

// Reading the link's template needs a Suspense boundary for Next.js to build the page.
export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewWorkout />
    </Suspense>
  );
}
