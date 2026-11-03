import {
  bestEstimatedTotal,
  e1rmHistory,
  estimatedOneRepMax,
  LIFTS,
  type DashboardWorkout,
  type Lift,
} from "@/lib/dashboard";
import { exerciseInfo, MUSCLE_NAMES, type Muscle } from "@/lib/exercise-info";
import { workoutVolume } from "@/lib/volume";

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Oldest first, leaving out any workout dated after today. */
function chronological(workouts: DashboardWorkout[], today: string) {
  return workouts
    .filter((workout) => workout.performed_on <= today)
    .sort((a, b) => a.performed_on.localeCompare(b.performed_on));
}

function workingSets(workout: DashboardWorkout) {
  return workout.workout_sets.filter((set) => !set.is_warmup);
}

export type LiftSummary = {
  category: Lift;
  label: string;
  color: string;
  best: number;
  /** Latest session's best estimate minus the first session's. Null with only one session. */
  change: number | null;
  since: string;
  heaviest: { weight: number; reps: number; date: string };
};

/** Where each competition lift stands. A lift that's never been logged is left out. */
export function liftSummaries(workouts: DashboardWorkout[], today: string) {
  const dated = chronological(workouts, today);
  const history = e1rmHistory(dated);
  const summaries: LiftSummary[] = [];

  for (const { category, label, color } of LIFTS) {
    const points = history.filter((point) => point[category] !== undefined);
    if (points.length === 0) continue;

    let heaviest: LiftSummary["heaviest"] | null = null;
    for (const workout of dated) {
      for (const set of workingSets(workout)) {
        if (set.exercises?.category !== category) continue;
        if (!heaviest || Number(set.weight) > heaviest.weight) {
          heaviest = { weight: Number(set.weight), reps: set.reps, date: workout.performed_on };
        }
      }
    }

    summaries.push({
      category,
      label,
      color,
      best: Math.max(...points.map((point) => point[category] as number)),
      change:
        points.length > 1
          ? (points[points.length - 1][category] as number) - (points[0][category] as number)
          : null,
      since: points[0].date,
      heaviest: heaviest as LiftSummary["heaviest"],
    });
  }
  return summaries;
}

export type PersonalRecord = {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  estimate: number;
  gain: number;
};

/**
 * Days an exercise beat its best estimated 1-rep max, newest first. The first
 * time an exercise is logged sets the baseline, so it isn't a record.
 */
export function recentRecords(workouts: DashboardWorkout[], today: string, limit = 5) {
  const bests = new Map<string, number>();
  const records: PersonalRecord[] = [];

  for (const workout of chronological(workouts, today)) {
    const topSets = new Map<string, { weight: number; reps: number; estimate: number }>();
    for (const set of workingSets(workout)) {
      const name = set.exercises?.name;
      if (!name) continue;
      const estimate = estimatedOneRepMax(set.weight, set.reps, set.rpe);
      if (estimate > (topSets.get(name)?.estimate ?? 0)) {
        topSets.set(name, { weight: Number(set.weight), reps: set.reps, estimate });
      }
    }
    for (const [exercise, top] of topSets) {
      const best = bests.get(exercise);
      if (best !== undefined && top.estimate > best) {
        records.push({ date: workout.performed_on, exercise, ...top, gain: top.estimate - best });
      }
      bests.set(exercise, Math.max(best ?? 0, top.estimate));
    }
  }
  return records.reverse().slice(0, limit);
}

export type TrainingWeek = { weekStart: string; sessions: number; volume: number };

function mondayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDate(date, -((weekday + 6) % 7));
}

/** The last several Monday-to-Sunday weeks, oldest first, including weeks with no training. */
export function trainingWeeks(workouts: DashboardWorkout[], today: string, count = 8) {
  const thisWeek = mondayOf(today);
  const weeks: TrainingWeek[] = Array.from({ length: count }, (_, index) => ({
    weekStart: shiftDate(thisWeek, (index - count + 1) * 7),
    sessions: 0,
    volume: 0,
  }));
  for (const workout of workouts) {
    if (workout.performed_on > today) continue;
    const week = weeks.find((item) => item.weekStart === mondayOf(workout.performed_on));
    if (!week) continue;
    week.sessions += 1;
    week.volume += workoutVolume(workout.workout_sets);
  }
  return weeks;
}

/**
 * Weeks in a row with at least one workout, ending now. This week doesn't break
 * the streak until it's over, since it may just not have had a session yet.
 */
export function weekStreak(workouts: DashboardWorkout[], today: string) {
  const trained = new Set(
    workouts.filter((workout) => workout.performed_on <= today).map((w) => mondayOf(w.performed_on))
  );
  let week = mondayOf(today);
  if (!trained.has(week)) week = shiftDate(week, -7);
  let streak = 0;
  while (trained.has(week)) {
    streak += 1;
    week = shiftDate(week, -7);
  }
  return streak;
}

export type MuscleCount = { muscle: Muscle; name: string; sets: number };

/**
 * Working sets for each muscle over the last 30 days, most first. Only an exercise's
 * main muscles count, and every muscle is listed, so a neglected one shows as 0.
 */
export function setsByMuscle(workouts: DashboardWorkout[], today: string) {
  const start = shiftDate(today, -29);
  const counts = new Map<Muscle, number>();
  let uncounted = 0;

  for (const workout of workouts) {
    if (workout.performed_on < start || workout.performed_on > today) continue;
    for (const set of workingSets(workout)) {
      const info = exerciseInfo(set.exercises?.name);
      if (!info) uncounted += 1;
      info?.main.forEach((muscle) => counts.set(muscle, (counts.get(muscle) ?? 0) + 1));
    }
  }

  const muscles = (Object.keys(MUSCLE_NAMES) as Muscle[])
    .map((muscle) => ({ muscle, name: MUSCLE_NAMES[muscle], sets: counts.get(muscle) ?? 0 }))
    .sort((a, b) => b.sets - a.sets);
  return { muscles, uncounted };
}

/** The best estimated total divided by the latest logged bodyweight. Null without both. */
export function strengthRatio(workouts: DashboardWorkout[], today: string) {
  const dated = chronological(workouts, today);
  const total = bestEstimatedTotal(e1rmHistory(dated));
  const latest = dated.filter((workout) => workout.bodyweight).at(-1);
  if (total === null || !latest?.bodyweight) return null;
  const bodyweight = Number(latest.bodyweight);
  return { ratio: total / bodyweight, bodyweight, date: latest.performed_on };
}
