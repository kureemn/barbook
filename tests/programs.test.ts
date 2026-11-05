import { describe, expect, it } from "vitest";
import {
  getProgram,
  isSessionKey,
  nextSession,
  PROGRAM_KEYS,
  PROGRAMS,
  programSession,
  scheduleCell,
  sessionLift,
  targetText,
  totalSessions,
  type Program,
} from "@/lib/programs";
import { exerciseInfo } from "@/lib/exercise-info";
import { setsFromTemplate } from "@/lib/set-groups";
import { STARTER_EXERCISES } from "@/lib/starter-exercises";

const allSessions = (program: Program) =>
  Array.from({ length: program.weeks }, (_, week) =>
    program.days.map((_, day) => programSession(program, week + 1, day + 1))
  ).flat();

describe.each(PROGRAMS.map((program) => [program.name, program] as const))("%s", (_name, program) => {
  it("fits what the database accepts: up to 6 weeks and 4 days", () => {
    expect(program.weeks).toBeLessThanOrEqual(6);
    expect(program.days).toHaveLength(4);
    expect(allSessions(program)).toHaveLength(totalSessions(program));
  });

  it("only uses exercises every lifter has, so a session can always be built", () => {
    const starters = STARTER_EXERCISES.map((exercise) => exercise.name);
    for (const session of allSessions(program)) {
      for (const exercise of session.exercises) expect(starters).toContain(exercise.name);
    }
  });

  it("only needs barbells, dumbbells, a bench, a rack, or a pull-up bar", () => {
    const available = ["barbell", "dumbbell", "bench", "rack", "pullUpBar"];
    for (const session of allSessions(program)) {
      for (const exercise of session.exercises) {
        const equipment = exerciseInfo(exercise.name)?.equipment ?? [];
        expect(equipment.length).toBeGreaterThan(0);
        expect(equipment.filter((item) => !available.includes(item))).toEqual([]);
      }
    }
  });

  it("stays within what the workout form and database accept", () => {
    for (const session of allSessions(program)) {
      for (const { sets, reps, rpe, setTargets } of session.exercises) {
        expect(sets).toBeGreaterThanOrEqual(1);
        expect(sets).toBeLessThanOrEqual(20);
        expect(reps).toBeGreaterThan(0);
        if (rpe !== null) {
          expect(rpe).toBeGreaterThanOrEqual(6);
          expect(rpe).toBeLessThanOrEqual(10);
        }
        if (setTargets) expect(setTargets).toHaveLength(sets);
      }
    }
  });

  it("doesn't repeat an exercise within a day, so each shows once", () => {
    for (const session of allSessions(program)) {
      const names = session.exercises.map((exercise) => exercise.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("explains where it comes from, and links any program it's based on", () => {
    expect(program.origin.length).toBeGreaterThan(0);
    for (const source of program.sources) expect(source.url).toMatch(/^https:\/\//);
  });
});

describe("the program list", () => {
  it("offers every key the database allows", () => {
    expect(PROGRAMS.map((program) => program.key)).toEqual([...PROGRAM_KEYS]);
  });

  it("falls back to the first program for an unknown key", () => {
    expect(getProgram("nope")).toBe(PROGRAMS[0]);
    expect(getProgram("phul").name).toBe("PHUL");
  });
});

describe("the 6-week strength block", () => {
  const block = getProgram("six-week-strength");

  it("raises effort and lowers reps on the main lift through week 5", () => {
    for (let week = 2; week < 6; week++) {
      const earlier = programSession(block, week - 1, 1).exercises[0];
      const later = programSession(block, week, 1).exercises[0];
      expect(later.rpe as number).toBeGreaterThan(earlier.rpe as number);
      expect(later.reps).toBeLessThan(earlier.reps);
    }
  });

  it("makes week 6 easier than week 5 for every exercise", () => {
    block.days.forEach((_, index) => {
      const hard = programSession(block, 5, index + 1).exercises;
      programSession(block, 6, index + 1).exercises.forEach((exercise, position) => {
        expect(exercise.rpe as number).toBeLessThan(hard[position].rpe as number);
      });
    });
  });
});

describe("5/3/1", () => {
  const program = getProgram("five-three-one-bbb");
  const press = (week: number) => programSession(program, week, 1).exercises[0];

  it("uses the published sets, reps, and percentages each week", () => {
    const ramp = (week: number) => press(week).setTargets?.slice(0, 3);
    expect(ramp(1)).toEqual([
      { reps: 5, percent: 0.65 },
      { reps: 5, percent: 0.75 },
      { reps: 5, percent: 0.85 },
    ]);
    expect(ramp(2)?.map((set) => set.reps)).toEqual([3, 3, 3]);
    expect(ramp(3)?.map((set) => [set.reps, set.percent])).toEqual([
      [5, 0.75],
      [3, 0.85],
      [1, 0.95],
    ]);
    expect(ramp(4)?.map((set) => set.percent)).toEqual([0.4, 0.5, 0.6]);
  });

  it("adds 5 × 10 after the ramp, except on the deload", () => {
    expect(press(1).setTargets).toHaveLength(8);
    expect(press(4).setTargets).toHaveLength(3);
    expect(targetText(press(3))).toBe("5, 3, 1+, then 5 × 10");
    expect(targetText(press(4))).toBe("5, 5, 5");
  });
});

describe("PHUL", () => {
  const program = getProgram("phul");

  it("has two power days and then two size days", () => {
    expect(program.days.map((day) => day.name)).toEqual([
      "Upper power",
      "Lower power",
      "Upper size",
      "Lower size",
    ]);
  });

  it("keeps power reps low and size reps high", () => {
    expect(programSession(program, 1, 1).exercises[0].reps).toBeLessThanOrEqual(5);
    expect(programSession(program, 1, 4).exercises[0].reps).toBeGreaterThanOrEqual(8);
  });

  it("moves main lifts from 3 to 4 sets in week 4", () => {
    expect(programSession(program, 3, 1).exercises[0].sets).toBe(3);
    expect(programSession(program, 4, 1).exercises[0].sets).toBe(4);
  });
});

describe("per-set targets", () => {
  const exercise = {
    id: "1",
    exercise_id: "bench",
    target_sets: 2,
    target_reps: 1,
    target_rpe: null,
    set_targets: [
      { reps: 5, percent: 0.75 },
      { reps: 1, percent: 0.95 },
    ],
  };

  it("works out each set's weight from the training max, to the nearest 5 lb", () => {
    const [group] = setsFromTemplate([exercise], () => undefined, () => 300);
    expect(group.sets.map((set) => [set.weight, set.reps])).toEqual([
      ["225", "5"],
      ["285", "1"],
    ]);
  });

  it("leaves weights blank with no history to work from", () => {
    const [group] = setsFromTemplate([exercise]);
    expect(group.sets.map((set) => set.weight)).toEqual(["", ""]);
    expect(group.sets.map((set) => set.reps)).toEqual(["5", "1"]);
  });
});

describe("nextSession", () => {
  const block = getProgram("six-week-strength");

  it("starts at week 1, day 1", () => {
    expect(nextSession(block, [])).toMatchObject({ week: 1, day: 1, name: "Squat" });
  });

  it("moves through the days, then to the next week", () => {
    expect(nextSession(block, [{ week: 1, day: 1 }])).toMatchObject({ week: 1, day: 2 });
    const firstWeek = [1, 2, 3, 4].map((day) => ({ week: 1, day }));
    expect(nextSession(block, firstWeek)).toMatchObject({ week: 2, day: 1 });
  });

  it("comes back to a session that was skipped", () => {
    expect(nextSession(block, [{ week: 1, day: 2 }])).toMatchObject({ week: 1, day: 1 });
  });

  it("returns null when everything is done, at each program's own length", () => {
    for (const program of PROGRAMS) {
      expect(nextSession(program, allSessions(program))).toBeNull();
    }
  });
});

describe("scheduleCell", () => {
  const block = getProgram("six-week-strength");
  const logged = [{ week: 1, day: 1, workout_id: "abc" }];

  it("opens the logged workout for a finished session", () => {
    expect(scheduleCell(block, 1, 1, logged)).toMatchObject({ state: "done", href: "/workouts/abc" });
  });

  it("marks only the first unlogged session as next", () => {
    expect(scheduleCell(block, 1, 2, logged)).toMatchObject({
      state: "next",
      href: "/workouts/new?week=1&day=2",
    });
    expect(scheduleCell(block, 1, 3, logged).state).toBe("upcoming");
    expect(scheduleCell(block, 6, 4, logged).state).toBe("upcoming");
  });

  it("says which session a link opens", () => {
    expect(scheduleCell(block, 1, 2, logged).label).toContain("Week 1, Day 2: Bench");
    expect(scheduleCell(block, 1, 1, logged).label).toContain("done");
  });
});

describe("isSessionKey", () => {
  const block = getProgram("six-week-strength");

  it("accepts a real session", () => {
    expect(isSessionKey(block, { week: 6, day: 4 })).toBe(true);
  });

  it("depends on the program's length", () => {
    expect(isSessionKey(getProgram("five-three-one-bbb"), { week: 5, day: 1 })).toBe(false);
  });

  it.each([
    [0, 1],
    [7, 1],
    [1, 0],
    [1, 5],
    [1.5, 1],
    [NaN, 1],
  ])("rejects week %s, day %s from a hand-edited link", (week, day) => {
    expect(isSessionKey(block, { week, day })).toBe(false);
  });
});

describe("sessionLift", () => {
  const session = (name: string) => ({ exercises: [{ name }, { name: "Deadlift" }] });

  it("names the lift from the first exercise only", () => {
    expect(sessionLift(session("Squat"))).toBe("squat");
    expect(sessionLift(session("Pause Bench"))).toBe("bench");
    expect(sessionLift(session("Romanian Deadlift"))).toBe("deadlift");
  });

  it("is null when the session starts with something else", () => {
    expect(sessionLift(session("Military Press"))).toBeNull();
    expect(sessionLift({ exercises: [] })).toBeNull();
  });

  it("draws the first week of the 6-week program as squat, bench, deadlift, and bench", () => {
    const program = getProgram("six-week-strength");
    const lifts = program.days.map((_, index) => sessionLift(programSession(program, 1, index + 1)));
    expect(lifts).toEqual(["squat", "bench", "deadlift", "bench"]);
  });
});
