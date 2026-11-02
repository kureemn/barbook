import { describe, expect, it } from "vitest";
import { flattenGroups, groupByExercise } from "@/lib/set-groups";

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
