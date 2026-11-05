import { describe, expect, it } from "vitest";
import { exerciseCues } from "@/lib/exercise-cues";
import { STARTER_EXERCISES } from "@/lib/starter-exercises";

describe("exerciseCues", () => {
  it.each(STARTER_EXERCISES.map((exercise) => exercise.name))("has complete, short cues for %s", (name) => {
    const cues = exerciseCues(name);
    for (const cue of [cues?.setup, cues?.brace, cues?.move, cues?.safety]) {
      expect(cue).toMatch(/\.$/);
      expect(cue?.length).toBeLessThanOrEqual(120);
    }
    expect(cues?.source).toMatch(/^[a-z-]+$/);
  });

  it("matches a lifter's own spelling of a name", () => {
    expect(exerciseCues("  sQuAt ")).toBe(exerciseCues("Squat"));
  });

  it("has nothing for an exercise the lifter added", () => {
    expect(exerciseCues("Zottman Curl")).toBeNull();
    expect(exerciseCues(undefined)).toBeNull();
  });
});
