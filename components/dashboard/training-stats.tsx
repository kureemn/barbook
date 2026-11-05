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

const TONES = {
  plain: "bg-card",
  peach: "bg-tint-peach text-tint-peach-foreground",
  blue: "bg-tint-blue text-tint-blue-foreground",
};

export function Stat({
  label,
  value,
  note,
  tone = "plain",
  className,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const quiet = tone === "plain" && "text-muted-foreground";
  return (
    <div className={cn("rounded-2xl p-4", TONES[tone], className)}>
      <dt className={cn("text-sm", quiet)}>{label}</dt>
      <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</dd>
      {note && <dd className={cn("mt-1 text-sm", quiet)}>{note}</dd>}
    </div>
  );
}

export function TrainingStats({ workouts }: { workouts: DashboardWorkout[] }) {
  const today = todayLocal();
  const total = bestEstimatedTotal(e1rmHistory(workouts));

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
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
    </dl>
  );
}
