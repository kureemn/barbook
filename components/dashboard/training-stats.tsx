import type { ReactNode } from "react";
import {
  bestEstimatedTotal,
  e1rmHistory,
  volumeLast30Days,
  workoutsThisMonth,
  type DashboardWorkout,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { todayLocal } from "@/lib/workouts";

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-4xl font-bold tabular-nums">{value}</dd>
      {note && <dd className="mt-1 text-sm text-muted-foreground">{note}</dd>}
    </div>
  );
}

export function TrainingStats({
  workouts,
  extra,
}: {
  workouts: DashboardWorkout[];
  extra?: ReactNode;
}) {
  const today = todayLocal();
  const total = bestEstimatedTotal(e1rmHistory(workouts));

  return (
    <dl className={cn("grid gap-3", extra ? "grid-cols-2 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1" : "sm:grid-cols-3")}>
      <Stat label="Workouts this month" value={workoutsThisMonth(workouts, today)} />
      <Stat
        label="Volume, last 30 days"
        value={`${volumeLast30Days(workouts, today).toLocaleString()} lb`}
        note="Working sets only"
      />
      <Stat
        label="Best estimated total"
        value={total === null ? "Not yet" : `${Math.round(total).toLocaleString()} lb`}
        note={total === null ? "Log squat, bench, and deadlift to see this" : "Best of each lift, added"}
      />
      {extra}
    </dl>
  );
}
