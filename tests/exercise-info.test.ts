import { describe, expect, it } from "vitest";
import { exerciseInfo } from "@/lib/exercise-info";
import { STARTER_EXERCISES } from "@/lib/starter-exercises";

describe("exerciseInfo", () => {
  it.each(STARTER_EXERCISES.map((starter) => starter.name))("knows %s", (name) => {
    const info = exerciseInfo(name);
    expect(info?.main.length).toBeGreaterThan(0);
    expect(info?.equipment.length).toBeGreaterThan(0);
  });

  it.each(STARTER_EXERCISES.map((starter) => starter.name))(
    "doesn't list a muscle twice for %s",
    (name) => {
      const info = exerciseInfo(name)!;
      const muscles = [...info.main, ...info.also];
      expect(new Set(muscles).size).toBe(muscles.length);
    }
  );

  it("ignores case and stray spaces in the name", () => {
    expect(exerciseInfo("  romanian DEADLIFT ")).toEqual(exerciseInfo("Romanian Deadlift"));
  });

  it("has nothing for an exercise the lifter added, or no exercise", () => {
    expect(exerciseInfo("Sled Push")).toBeNull();
    expect(exerciseInfo("")).toBeNull();
    expect(exerciseInfo(undefined)).toBeNull();
  });
});
