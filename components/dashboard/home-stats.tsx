"use client";

import { useEffect, useState } from "react";
import { TrainingStats } from "@/components/dashboard/training-stats";
import type { DashboardWorkout } from "@/lib/dashboard";
import { loadDashboardWorkouts } from "@/lib/workouts";

/** Stats for the large-screen home page. A phone keeps them on the Dashboard tab. */
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
    <section aria-label="Your training so far" className="mt-6 hidden lg:block">
      <TrainingStats workouts={workouts} />
    </section>
  );
}
