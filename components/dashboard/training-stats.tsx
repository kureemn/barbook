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
  plain: "bg-background text-foreground",
  peach: "bg-tint-peach text-tint-peach-foreground",
  blue: "bg-tint-blue text-tint-blue-foreground",
  green: "bg-tint-green text-tint-green-foreground",
};

export function Stat({
  label,
  value,
  note,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-4", TONES[tone], className)}>
      <dt className="text-sm">{label}</dt>
      <dd className="mt-1 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</dd>
      {note && <dd className="mt-1 text-sm">{note}</dd>}
    </div>
  );
}

export function TrainingStats({ workouts }: { workouts: DashboardWorkout[] }) {
  const today = todayLocal();
  const total = bestEstimatedTotal(e1rmHistory(workouts));

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Workouts this month" value={workoutsThisMonth(workouts, today)} tone="peach" />
      <Stat
        label="Best estimated total"
        value={total === null ? "Not yet" : `${Math.round(total).toLocaleString()} lb`}
        note={total === null ? "Log squat, bench, and deadlift to see this" : "Best of each lift, added"}
        tone="blue"
      />
      <Stat
        label="Volume, last 30 days"
        value={`${volumeLast30Days(workouts, today).toLocaleString()} lb`}
        note="Working sets only"
        tone="green"
        className="col-span-2 sm:col-span-1"
      />
    </dl>
  );
}
