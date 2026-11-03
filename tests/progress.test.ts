import { describe, expect, it } from "vitest";
import type { DashboardSet, DashboardWorkout } from "@/lib/dashboard";
import {
  liftSummaries,
  recentRecords,
  setsByMuscle,
  strengthRatio,
  trainingWeeks,
  weekStreak,
} from "@/lib/progress";

// 2026-11-02 is a Monday.
const TODAY = "2026-11-02";

function set(
  name: string,
  weight: number,
  reps: number,
  { rpe = 10, warmup = false, category = "accessory" }: { rpe?: number | null; warmup?: boolean; category?: string } = {}
): DashboardSet {
  return { weight, reps, rpe, is_warmup: warmup, exercises: { name, category } };
}

const squat = (weight: number, reps: number, options = {}) =>
  set("Squat", weight, reps, { category: "squat", ...options });

function workout(performed_on: string, sets: DashboardSet[], bodyweight: number | null = null): DashboardWorkout {
  return { performed_on, bodyweight, workout_sets: sets };
}

describe("liftSummaries", () => {
  it("reports the best estimate, change, and heaviest set", () => {
    const [summary] = liftSummaries(
      [
        workout("2026-10-20", [squat(200, 5)]),
        workout("2026-10-27", [squat(250, 1), squat(100, 1, { warmup: true })]),
      ],
      TODAY
    );
    // 200 x (1 + 5/30) = 233.33, and a true single counts as its weight.
    expect(summary.best).toBe(250);
    expect(summary.change).toBeCloseTo(250 - 233.33, 1);
    expect(summary.since).toBe("2026-10-20");
    expect(summary.heaviest).toEqual({ weight: 250, reps: 1, date: "2026-10-27" });
  });

  it("has no change after only one session", () => {
    expect(liftSummaries([workout(TODAY, [squat(200, 5)])], TODAY)[0].change).toBeNull();
  });

  it("leaves out lifts never logged, and ignores warm-ups and future dates", () => {
    expect(liftSummaries([], TODAY)).toEqual([]);
    expect(liftSummaries([workout(TODAY, [squat(45, 5, { warmup: true })])], TODAY)).toEqual([]);
    expect(liftSummaries([workout("2026-12-01", [squat(500, 1)])], TODAY)).toEqual([]);
  });

  it("can show a loss as a negative change", () => {
    const [summary] = liftSummaries(
      [workout("2026-10-20", [squat(300, 1)]), workout("2026-10-27", [squat(250, 1)])],
      TODAY
    );
    expect(summary.change).toBe(-50);
    expect(summary.best).toBe(300);
  });
});

describe("recentRecords", () => {
  it("doesn't count an exercise's first time as a record", () => {
    expect(recentRecords([workout(TODAY, [squat(300, 1)])], TODAY)).toEqual([]);
  });

  it("finds a day that beat the previous best, newest first, with the gain", () => {
    const records = recentRecords(
      [
        workout("2026-10-01", [squat(200, 1), set("Dip", 50, 1)]),
        workout("2026-10-08", [squat(220, 1)]),
        workout("2026-10-15", [set("Dip", 60, 1)]),
      ],
      TODAY
    );
    expect(records.map((record) => [record.exercise, record.date, record.gain])).toEqual([
      ["Dip", "2026-10-15", 10],
      ["Squat", "2026-10-08", 20],
    ]);
  });

  it("gives one record per exercise per day, using its top set", () => {
    const records = recentRecords(
      [workout("2026-10-01", [squat(200, 1)]), workout("2026-10-08", [squat(210, 1), squat(230, 1)])],
      TODAY
    );
    expect(records).toHaveLength(1);
    expect(records[0].weight).toBe(230);
  });

  it("doesn't count matching the best, or falling short of it", () => {
    expect(
      recentRecords(
        [
          workout("2026-10-01", [squat(200, 1)]),
          workout("2026-10-08", [squat(200, 1)]),
          workout("2026-10-15", [squat(150, 1)]),
        ],
        TODAY
      )
    ).toEqual([]);
  });

  it("counts a lower weight for more reps when its estimate is higher", () => {
    const records = recentRecords(
      [workout("2026-10-01", [squat(300, 1)]), workout("2026-10-08", [squat(280, 5)])],
      TODAY
    );
    expect(records).toHaveLength(1);
    expect(records[0].weight).toBe(280);
  });

  it("keeps only the most recent ones", () => {
    const history = [100, 110, 120, 130].map((weight, index) =>
      workout(`2026-10-0${index + 1}`, [squat(weight, 1)])
    );
    const records = recentRecords(history, TODAY, 2);
    expect(records.map((record) => record.weight)).toEqual([130, 120]);
  });
});

describe("trainingWeeks", () => {
  it("lists Monday-start weeks oldest first, including empty ones", () => {
    const weeks = trainingWeeks([], TODAY, 3);
    expect(weeks.map((week) => week.weekStart)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(weeks.every((week) => week.sessions === 0 && week.volume === 0)).toBe(true);
  });

  it("puts Sunday in the week that started the Monday before", () => {
    const weeks = trainingWeeks(
      [workout("2026-11-01", [squat(100, 5)]), workout("2026-10-26", [squat(100, 5)])],
      TODAY,
      2
    );
    expect(weeks[0]).toEqual({ weekStart: "2026-10-26", sessions: 2, volume: 1000 });
    expect(weeks[1].sessions).toBe(0);
  });

  it("ignores workouts too old or in the future", () => {
    const weeks = trainingWeeks(
      [workout("2026-01-05", [squat(100, 5)]), workout("2026-11-05", [squat(100, 5)])],
      TODAY,
      2
    );
    expect(weeks.every((week) => week.sessions === 0)).toBe(true);
  });
});

describe("weekStreak", () => {
  it("counts weeks in a row up to now", () => {
    expect(
      weekStreak(
        [workout("2026-11-02", []), workout("2026-10-28", []), workout("2026-10-20", [])],
        TODAY
      )
    ).toBe(3);
  });

  it("doesn't let an unfinished week break the streak", () => {
    expect(weekStreak([workout("2026-10-28", []), workout("2026-10-20", [])], TODAY)).toBe(2);
  });

  it("ends at a missed week", () => {
    expect(weekStreak([workout("2026-11-02", []), workout("2026-10-20", [])], TODAY)).toBe(1);
    expect(weekStreak([workout("2026-10-12", [])], TODAY)).toBe(0);
    expect(weekStreak([], TODAY)).toBe(0);
  });
});

describe("setsByMuscle", () => {
  const count = (result: ReturnType<typeof setsByMuscle>, muscle: string) =>
    result.muscles.find((item) => item.muscle === muscle)?.sets;

  it("counts working sets for main muscles only, most first", () => {
    const result = setsByMuscle(
      [workout(TODAY, [set("Bench", 100, 5), set("Bench", 100, 5, { warmup: true }), squat(100, 5)])],
      TODAY
    );
    expect(count(result, "chest")).toBe(1);
    expect(count(result, "quads")).toBe(1);
    expect(count(result, "triceps")).toBe(0);
    expect(result.muscles[result.muscles.length - 1].sets).toBe(0);
    expect(result.muscles[0].sets).toBeGreaterThanOrEqual(result.muscles[1].sets);
  });

  it("lists every muscle, even with no training", () => {
    expect(setsByMuscle([], TODAY).muscles).toHaveLength(13);
  });

  it("only looks at the last 30 days, counting today", () => {
    const oldest = workout("2026-10-04", [squat(100, 5)]);
    const tooOld = workout("2026-10-03", [squat(100, 5), squat(100, 5)]);
    expect(count(setsByMuscle([oldest, tooOld], TODAY), "quads")).toBe(1);
  });

  it("reports sets it can't place, from exercises the lifter added", () => {
    expect(setsByMuscle([workout(TODAY, [set("Sled Push", 100, 5)])], TODAY).uncounted).toBe(1);
  });
});

describe("strengthRatio", () => {
  const all = [
    squat(300, 1),
    set("Bench", 200, 1, { category: "bench" }),
    set("Deadlift", 400, 1, { category: "deadlift" }),
  ];

  it("divides the best total by the latest bodyweight", () => {
    const result = strengthRatio(
      [workout("2026-10-01", all, 220), workout("2026-10-08", [], 200)],
      TODAY
    );
    expect(result).toEqual({ ratio: 4.5, bodyweight: 200, date: "2026-10-08" });
  });

  it("is null without all three lifts or a bodyweight", () => {
    expect(strengthRatio([workout(TODAY, all)], TODAY)).toBeNull();
    expect(strengthRatio([workout(TODAY, [squat(300, 1)], 200)], TODAY)).toBeNull();
  });
});
