"use client";

import { PageLoading } from "@/components/workouts/page-states";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";

export default function NewWorkoutPage() {
  const status = useRequireAuth();
  if (status !== "authed") return <PageLoading />;
  return <WorkoutForm />;
}
