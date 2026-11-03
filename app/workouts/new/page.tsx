"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { loadActiveRun, sessionAsTemplate } from "@/lib/program-runs";
import { isSessionKey, programSession, type SessionKey } from "@/lib/programs";
import { suggestionsForTemplate, type Suggestion } from "@/lib/suggestions";
import { loadTemplate, type Template } from "@/lib/templates";
import { loadExercises, loadSetHistory, todayLocal } from "@/lib/workouts";

/** Loads a program session as a template. Throws a message the lifter should see. */
async function loadSession(key: SessionKey) {
  if (!isSessionKey(key)) throw new Error("We couldn't find that program session.");
  const run = await loadActiveRun();
  if (!run) throw new Error("You aren't on a program right now.");
  if (run.program_sessions.some((item) => item.week === key.week && item.day === key.day)) {
    throw new Error("You've already logged that session. Delete its workout to log it again.");
  }
  const session = programSession(key.week, key.day);
  return { template: sessionAsTemplate(session, await loadExercises()), runId: run.id };
}

function NewWorkout() {
  const status = useRequireAuth();
  const params = useSearchParams();
  const templateId = params.get("template");
  const weekParam = params.get("week");
  const dayParam = params.get("day");
  const isProgram = weekParam !== null || dayParam !== null;
  const [template, setTemplate] = useState<Template | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;

    async function addSuggestions(loaded: Template) {
      // Suggestions are a convenience, so a failure here shouldn't block logging.
      try {
        const exercises = loaded.template_exercises;
        const history = await loadSetHistory(exercises.map((exercise) => exercise.exercise_id));
        setSuggestions(suggestionsForTemplate(exercises, history, todayLocal()));
      } catch {
        setSuggestions({});
      }
      setTemplate(loaded);
    }

    if (isProgram) {
      loadSession({ week: Number(weekParam), day: Number(dayParam) })
        .then(async (loaded) => {
          setRunId(loaded.runId);
          await addSuggestions(loaded.template);
        })
        .catch((failure: unknown) =>
          setError(
            failure instanceof Error && !("code" in failure)
              ? failure.message
              : "Couldn't load that session. Please try again."
          )
        );
    } else if (templateId) {
      loadTemplate(templateId)
        .then(async (loaded) => {
          if (loaded) await addSuggestions(loaded);
          else setError("We couldn't find that template.");
        })
        .catch(() => setError("We couldn't find that template."));
    }
  }, [status, templateId, isProgram, weekParam, dayParam]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || ((templateId || isProgram) && !template)) return <PageLoading />;
  return (
    <WorkoutForm
      template={template ?? undefined}
      suggestions={suggestions}
      program={
        isProgram && runId
          ? { runId, week: Number(weekParam), day: Number(dayParam) }
          : undefined
      }
    />
  );
}

// Reading the link's template needs a Suspense boundary for Next.js to build the page.
export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewWorkout />
    </Suspense>
  );
}
