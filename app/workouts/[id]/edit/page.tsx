"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { loadWorkout, type Workout } from "@/lib/workouts";

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const status = useRequireAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadWorkout(id)
      .then((loaded) => {
        if (loaded) setWorkout(loaded);
        else setError("We couldn't find that workout.");
      })
      .catch(() => setError("We couldn't find that workout."));
  }, [status, id]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !workout) return <PageLoading />;
  return <WorkoutForm workout={workout} />;
}
