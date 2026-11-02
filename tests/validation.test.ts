import { describe, expect, it } from "vitest";
import { validateExercise, validateSignIn, validateSignUp, validateWorkout } from "../lib/validation";

const set = { exercise_id: "squat", weight: "300", reps: "5", rpe: "8", is_warmup: false };
const workout = {
  title: "Heavy squats",
  performed_on: "2026-11-02",
  bodyweight: "",
  notes: "",
  sets: [set],
};

describe("validateWorkout", () => {
  it("accepts a complete workout and converts its numbers", () => {
    const result = validateWorkout(workout);
    expect(result.success).toBe(true);
    expect(result.data?.bodyweight).toBeNull();
    expect(result.data?.notes).toBeNull();
    expect(result.data?.sets[0]).toMatchObject({ weight: 300, reps: 5, rpe: 8 });
  });

  it("accepts a set with no RPE", () => {
    const result = validateWorkout({ ...workout, sets: [{ ...set, rpe: "" }] });
    expect(result.data?.sets[0].rpe).toBeNull();
  });

  it("accepts a weight of 0 for bodyweight movements", () => {
    expect(validateWorkout({ ...workout, sets: [{ ...set, weight: "0" }] }).success).toBe(true);
  });

  it.each([["" ], ["   "]])("rejects the title %j", (title) => {
    expect(validateWorkout({ ...workout, title }).errors.title).toBe("Give this workout a title.");
  });

  it.each([[""], ["2026-02-30"], ["soon"]])("rejects the date %j", (performed_on) => {
    expect(validateWorkout({ ...workout, performed_on }).errors.performed_on).toBe(
      "Choose the date of this workout."
    );
  });

  it("rejects a workout with no sets", () => {
    expect(validateWorkout({ ...workout, sets: [] }).errors.sets).toBe("Add at least one set.");
  });

  it("names the exact set that has a problem", () => {
    const result = validateWorkout({ ...workout, sets: [set, { ...set, weight: "" }] });
    expect(result.errors).toEqual({ "sets.1.weight": "Enter the weight." });
  });

  it.each([
    ["exercise_id", "", "Choose an exercise."],
    ["weight", "", "Enter the weight."],
    ["weight", "-5", "Enter a weight from 0 to 9,999 lb."],
    ["reps", "", "Enter the reps."],
    ["reps", "0", "Reps must be a whole number, 1 or more."],
    ["reps", "2.5", "Reps must be a whole number, 1 or more."],
    ["rpe", "11", "RPE must be from 6 to 10, in steps of 0.5."],
    ["rpe", "5", "RPE must be from 6 to 10, in steps of 0.5."],
    ["rpe", "8.3", "RPE must be from 6 to 10, in steps of 0.5."],
  ])("for %s, rejects %j", (field, value, message) => {
    const result = validateWorkout({ ...workout, sets: [{ ...set, [field]: value }] });
    expect(result.errors[`sets.0.${field}`]).toBe(message);
  });

  it("rejects a bodyweight of 0", () => {
    expect(validateWorkout({ ...workout, bodyweight: "0" }).errors.bodyweight).toBeDefined();
  });
});

describe("account forms", () => {
  it("reports every blank sign-up field", () => {
    expect(validateSignUp({ name: " ", email: "", password: "" }).errors).toEqual({
      name: "Enter your name.",
      email: "Enter your email.",
      password: "Use at least 8 characters for your password.",
    });
  });

  it("rejects a malformed email", () => {
    expect(validateSignIn({ email: "lifter", password: "x" }).errors.email).toBe(
      "Enter a valid email address."
    );
  });

  it("accepts complete details", () => {
    expect(
      validateSignUp({ name: "A", email: "a@example.com", password: "12345678" }).success
    ).toBe(true);
  });
});

describe("validateExercise", () => {
  it("rejects a blank name", () => {
    expect(validateExercise({ name: "  " }).errors.name).toBe("Enter a name for this exercise.");
  });
});
