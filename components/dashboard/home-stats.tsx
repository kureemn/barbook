"use client";

import { useEffect, useState } from "react";
import { TrainingStats } from "@/components/dashboard/training-stats";
import type { DashboardWorkout } from "@/lib/dashboard";
import { loadDashboardWorkouts } from "@/lib/workouts";

/** A quick look at your training, with the full picture on the Dashboard tab. */
export function HomeStats() {
  const [workouts, setWorkouts] = useState<DashboardWorkout[] | null>(null);

  useEffect(() => {
    // These are extra here, so a failure just leaves them out.
    loadDashboardWorkouts()
      .then(setWorkouts)
      .catch(() => setWorkouts(null));
  }, []);

  if (!workouts) return null;

  return (
    <section aria-label="Your training so far" className="mt-6">
      <TrainingStats workouts={workouts} />
    </section>
  );
}
