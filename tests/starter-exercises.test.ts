import { describe, expect, it } from "vitest";
import { missingStarters, STARTER_EXERCISES } from "@/lib/starter-exercises";

describe("starter exercises", () => {
  it("includes the lifts I train", () => {
    const names = STARTER_EXERCISES.map((exercise) => exercise.name);
    for (const lift of ["Squat", "Bench", "Deadlift", "Military Press", "Incline Bench", "Romanian Deadlift", "Barbell Row"]) {
      expect(names).toContain(lift);
    }
  });

  it("has no duplicate names", () => {
    const names = STARTER_EXERCISES.map((exercise) => exercise.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives only the competition lifts a main-lift category", () => {
    const main = STARTER_EXERCISES.filter((exercise) => exercise.category !== "accessory");
    expect(main.map((exercise) => exercise.name)).toEqual(["Squat", "Bench", "Deadlift"]);
  });

  it("offers the whole list to a new account", () => {
    expect(missingStarters([])).toEqual(STARTER_EXERCISES);
  });

  it("skips exercises the user already has, ignoring case", () => {
    const missing = missingStarters([{ name: "Squat" }, { name: "romanian deadlift" }]).map(
      (exercise) => exercise.name
    );
    expect(missing).not.toContain("Squat");
    expect(missing).not.toContain("Romanian Deadlift");
    expect(missing).toContain("Bench");
  });

  it("adds nothing once the user has everything", () => {
    expect(missingStarters(STARTER_EXERCISES)).toEqual([]);
  });
});
