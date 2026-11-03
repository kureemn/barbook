import { describe, expect, it } from "vitest";
import {
  DAYS,
  DELOAD_WEEK,
  isSessionKey,
  nextSession,
  programSession,
  WEEKS,
} from "@/lib/programs";
import { STARTER_EXERCISES } from "@/lib/starter-exercises";

const allSessions = () =>
  Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: DAYS }, (_, day) => programSession(week + 1, day + 1))
  ).flat();

describe("the program", () => {
  it("has 24 sessions: 6 weeks of 4 days", () => {
    expect(allSessions()).toHaveLength(24);
  });

  it("only uses exercises every lifter has, so a session can always be built", () => {
    const starters = STARTER_EXERCISES.map((exercise) => exercise.name);
    for (const session of allSessions()) {
      for (const exercise of session.exercises) expect(starters).toContain(exercise.name);
    }
  });

  it("stays within what the workout form and database accept", () => {
    for (const session of allSessions()) {
      for (const { sets, reps, rpe } of session.exercises) {
        expect(sets).toBeGreaterThanOrEqual(1);
        expect(reps).toBeGreaterThan(0);
        expect(rpe).toBeGreaterThanOrEqual(6);
        expect(rpe).toBeLessThanOrEqual(10);
      }
    }
  });

  it("raises effort and lowers reps on the main lift through week 5", () => {
    for (let week = 2; week < DELOAD_WEEK; week++) {
      const earlier = programSession(week - 1, 1).exercises[0];
      const later = programSession(week, 1).exercises[0];
      expect(later.rpe).toBeGreaterThan(earlier.rpe);
      expect(later.reps).toBeLessThan(earlier.reps);
    }
  });

  it("makes week 6 easier than week 5 for every exercise", () => {
    for (let day = 1; day <= DAYS; day++) {
      const hard = programSession(DELOAD_WEEK - 1, day).exercises;
      programSession(DELOAD_WEEK, day).exercises.forEach((exercise, index) => {
        expect(exercise.rpe).toBeLessThan(hard[index].rpe);
      });
    }
  });
});

describe("nextSession", () => {
  it("starts at week 1, day 1", () => {
    expect(nextSession([])).toMatchObject({ week: 1, day: 1, name: "Squat" });
  });

  it("moves through the days, then to the next week", () => {
    expect(nextSession([{ week: 1, day: 1 }])).toMatchObject({ week: 1, day: 2 });
    const firstWeek = [1, 2, 3, 4].map((day) => ({ week: 1, day }));
    expect(nextSession(firstWeek)).toMatchObject({ week: 2, day: 1 });
  });

  it("comes back to a session that was skipped", () => {
    expect(nextSession([{ week: 1, day: 2 }])).toMatchObject({ week: 1, day: 1 });
  });

  it("returns null when everything is done", () => {
    expect(nextSession(allSessions())).toBeNull();
  });
});

describe("isSessionKey", () => {
  it("accepts a real session", () => {
    expect(isSessionKey({ week: 6, day: 4 })).toBe(true);
  });

  it.each([
    [0, 1],
    [7, 1],
    [1, 0],
    [1, 5],
    [1.5, 1],
    [NaN, 1],
  ])("rejects week %s, day %s from a hand-edited link", (week, day) => {
    expect(isSessionKey({ week, day })).toBe(false);
  });
});
