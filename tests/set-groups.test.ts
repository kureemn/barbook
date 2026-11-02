import { describe, expect, it } from "vitest";
import { flattenGroups, groupByExercise, setsFromTemplate } from "@/lib/set-groups";

const set = (exercise_id: string, weight: number) => ({ exercise_id, weight });

describe("groupByExercise", () => {
  it("puts consecutive sets of an exercise together, in order", () => {
    const groups = groupByExercise([set("squat", 225), set("squat", 235), set("rdl", 135)]);
    expect(groups).toEqual([
      { exercise_id: "squat", sets: [set("squat", 225), set("squat", 235)] },
      { exercise_id: "rdl", sets: [set("rdl", 135)] },
    ]);
  });

  it("keeps separate groups when an exercise is done again later", () => {
    const groups = groupByExercise([set("squat", 225), set("rdl", 135), set("squat", 125)]);
    expect(groups.map((group) => group.exercise_id)).toEqual(["squat", "rdl", "squat"]);
  });

  it("returns no groups for no sets", () => {
    expect(groupByExercise([])).toEqual([]);
  });
});

describe("flattenGroups", () => {
  it("gives every set its group's exercise, in order", () => {
    const flat = flattenGroups([
      { exercise_id: "squat", sets: [{ weight: 225 }, { weight: 235 }] },
      { exercise_id: "rdl", sets: [{ weight: 135 }] },
    ]);
    expect(flat).toEqual([set("squat", 225), set("squat", 235), set("rdl", 135)]);
  });

  it("uses the group's exercise over an older one on the set", () => {
    const flat = flattenGroups([{ exercise_id: "bench", sets: [set("squat", 100)] }]);
    expect(flat).toEqual([set("bench", 100)]);
  });

  it("undoes groupByExercise", () => {
    const sets = [set("squat", 225), set("rdl", 135), set("squat", 125)];
    expect(flattenGroups(groupByExercise(sets))).toEqual(sets);
  });
});

describe("setsFromTemplate", () => {
  it("makes the target number of sets, with reps and RPE filled in and weight blank", () => {
    const groups = setsFromTemplate([
      { exercise_id: "squat", target_sets: 2, target_reps: 5, target_rpe: 8 },
    ]);
    const planned = { weight: "", reps: "5", rpe: "8", is_warmup: false };
    expect(groups).toEqual([{ exercise_id: "squat", sets: [planned, planned] }]);
  });

  it("leaves RPE blank when the template has no target", () => {
    const groups = setsFromTemplate([
      { exercise_id: "squat", target_sets: 1, target_reps: 5, target_rpe: null },
    ]);
    expect(groups[0].sets[0].rpe).toBe("");
  });

  it("shows a decimal RPE from the database without trailing zeros", () => {
    const fromDatabase = "7.50" as unknown as number;
    const groups = setsFromTemplate([
      { exercise_id: "squat", target_sets: 1, target_reps: 5, target_rpe: fromDatabase },
    ]);
    expect(groups[0].sets[0].rpe).toBe("7.5");
  });

  it("keeps the template's exercise order", () => {
    const groups = setsFromTemplate([
      { exercise_id: "bench", target_sets: 1, target_reps: 5, target_rpe: null },
      { exercise_id: "squat", target_sets: 1, target_reps: 5, target_rpe: null },
    ]);
    expect(groups.map((group) => group.exercise_id)).toEqual(["bench", "squat"]);
  });
});
