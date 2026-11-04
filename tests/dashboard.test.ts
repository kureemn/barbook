import { describe, expect, it } from "vitest";
import {
  bestEstimatedTotal,
  e1rmHistory,
  estimatedOneRepMax,
  RPE_IF_BLANK,
  RPE_MEANING,
  volumeLast30Days,
  workoutsThisMonth,
  type DashboardSet,
  type DashboardWorkout,
} from "@/lib/dashboard";

const TODAY = "2026-11-02";

function set(
  weight: number,
  reps: number,
  { rpe = null, warmup = false, category = "squat" }: { rpe?: number | null; warmup?: boolean; category?: string } = {}
): DashboardSet {
  return { weight, reps, rpe, is_warmup: warmup, exercises: { category } };
}

function workout(performed_on: string, ...workout_sets: DashboardSet[]): DashboardWorkout {
  return { performed_on, workout_sets };
}

describe("volumeLast30Days", () => {
  // The required test, as written in section 4 of PLAN.md.
  it("adds up working sets and leaves out warm-ups: 100x5 + 120x3 = 860", () => {
    const workouts = [workout("2026-10-20", set(100, 5), set(120, 3), set(60, 5, { warmup: true }))];
    expect(volumeLast30Days(workouts, TODAY)).toBe(860);
  });

  it("includes today and the day 29 days ago, but not 30 days ago or the future", () => {
    const workouts = [
      workout(TODAY, set(100, 1)),
      workout("2026-10-04", set(10, 1)),
      workout("2026-10-03", set(1000, 1)),
      workout("2026-11-03", set(1000, 1)),
    ];
    expect(volumeLast30Days(workouts, TODAY)).toBe(110);
  });

  it("is 0 with no workouts", () => {
    expect(volumeLast30Days([], TODAY)).toBe(0);
  });
});

describe("workoutsThisMonth", () => {
  it("counts only this calendar month, up to today", () => {
    const workouts = [
      workout("2026-11-01"),
      workout(TODAY),
      workout("2026-10-31"),
      workout("2025-11-02"),
      workout("2026-11-20"),
    ];
    expect(workoutsThisMonth(workouts, TODAY)).toBe(2);
  });
});

describe("estimatedOneRepMax", () => {
  it("counts the reps left in the tank from RPE", () => {
    // 300 x (1 + 7/30)
    expect(estimatedOneRepMax(300, 5, 8)).toBeCloseTo(370);
  });

  it("treats a missing RPE as 10", () => {
    expect(estimatedOneRepMax(300, 5, null)).toBeCloseTo(estimatedOneRepMax(300, 5, 10));
  });

  it("returns the weight for a true single at RPE 10", () => {
    expect(estimatedOneRepMax(405, 1, 10)).toBe(405);
  });

  it("handles numbers the database returns as text", () => {
    const fromDatabase = "8.0" as unknown as number;
    expect(estimatedOneRepMax(300, 5, fromDatabase)).toBeCloseTo(370);
  });
});

describe("e1rmHistory", () => {
  it("keeps each lift's best working set per date, oldest first", () => {
    const history = e1rmHistory([
      workout(TODAY, set(245, 8, { rpe: 8 }), set(225, 8, { rpe: 6 })),
      workout("2026-10-26", set(225, 8, { rpe: 8 })),
    ]);
    expect(history.map((point) => point.date)).toEqual(["2026-10-26", TODAY]);
    expect(history[0].squat).toBeCloseTo(300);
    expect(history[1].squat).toBeCloseTo(326.67, 1);
  });

  it("leaves out warm-ups and accessories", () => {
    const history = e1rmHistory([
      workout(TODAY, set(500, 5, { warmup: true }), set(500, 5, { category: "accessory" })),
    ]);
    expect(history).toEqual([]);
  });

  it("combines two workouts on the same date", () => {
    const history = e1rmHistory([
      workout(TODAY, set(100, 1, { rpe: 10 })),
      workout(TODAY, set(200, 1, { rpe: 10, category: "bench" })),
    ]);
    expect(history).toEqual([{ date: TODAY, squat: 100, bench: 200 }]);
  });
});

describe("bestEstimatedTotal", () => {
  it("adds each lift's best, even when they came from different days", () => {
    expect(
      bestEstimatedTotal([
        { date: "2026-10-26", squat: 300, bench: 200, deadlift: 400 },
        { date: TODAY, squat: 280, bench: 210, deadlift: 390 },
      ])
    ).toBe(910);
  });

  it("is null until all three lifts are logged", () => {
    expect(bestEstimatedTotal([{ date: TODAY, squat: 300, bench: 200 }])).toBeNull();
  });
});

describe("the RPE explanation", () => {
  it("matches the estimated max formula", () => {
    expect(RPE_MEANING).toContain("10 means no reps left, 8 means 2 left");
    // RPE 8 leaves 2 reps, so 5 reps at RPE 8 estimates like 7 reps at RPE 10.
    expect(estimatedOneRepMax(100, 5, 8)).toBe(estimatedOneRepMax(100, 7, 10));
    expect(RPE_IF_BLANK).toContain("counts as 10");
    expect(estimatedOneRepMax(100, 5, null)).toBe(estimatedOneRepMax(100, 5, 10));
  });
});
