import { describe, expect, it } from "vitest";
import { exerciseVideo } from "@/lib/exercise-videos";
import { STARTER_EXERCISES } from "@/lib/starter-exercises";

describe("exerciseVideo", () => {
  it.each(STARTER_EXERCISES.map((exercise) => exercise.name))("has a short video for %s", (name) => {
    const video = exerciseVideo(name);
    expect(video?.id).toMatch(/^[\w-]{11}$/);
    expect(video?.channel).not.toBe("");
    const [minutes] = (video?.length ?? "").split(":").map(Number);
    expect(minutes).toBeLessThan(4);
  });

  it("matches a lifter's own spelling of a name", () => {
    expect(exerciseVideo("  sQuAt ")).toBe(exerciseVideo("Squat"));
  });

  it("has nothing for an exercise the lifter added", () => {
    expect(exerciseVideo("Zottman Curl")).toBeNull();
    expect(exerciseVideo(undefined)).toBeNull();
  });
});
