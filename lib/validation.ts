// Form rules, in one place so they can be tested without a browser. They match
// the CHECK constraints in db/schema.sql: the database has the final say, and
// these give people a clear message before anything is sent.
import { z } from "zod";

const number = (text: string) => Number(text.trim());
const isBlank = (text: string) => text.trim() === "";

function isRealDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
}

const setSchema = z
  .object({
    id: z.string().optional(),
    exercise_id: z.string().min(1, "Choose an exercise."),
    weight: z
      .string()
      .refine((text) => !isBlank(text), "Enter the weight.")
      .refine(
        (text) => isBlank(text) || (number(text) >= 0 && number(text) < 10000),
        "Enter a weight from 0 to 9,999 lb."
      ),
    reps: z
      .string()
      .refine((text) => !isBlank(text), "Enter the reps.")
      .refine(
        (text) => isBlank(text) || (Number.isInteger(number(text)) && number(text) >= 1),
        "Reps must be a whole number, 1 or more."
      ),
    rpe: z
      .string()
      .refine(
        (text) =>
          isBlank(text) ||
          (number(text) >= 6 && number(text) <= 10 && Number.isInteger(number(text) * 2)),
        "RPE must be from 6 to 10, in steps of 0.5."
      ),
    is_warmup: z.boolean(),
  })
  .transform((set) => ({
    id: set.id,
    exercise_id: set.exercise_id,
    weight: number(set.weight),
    reps: number(set.reps),
    rpe: isBlank(set.rpe) ? null : number(set.rpe),
    is_warmup: set.is_warmup,
  }));

const workoutSchema = z.object({
  title: z.string().trim().min(1, "Give this workout a title."),
  performed_on: z.string().refine(isRealDate, "Choose the date of this workout."),
  bodyweight: z
    .string()
    .refine(
      (text) => isBlank(text) || (number(text) > 0 && number(text) < 10000),
      "Enter a bodyweight above 0, or leave it blank."
    )
    .transform((text) => (isBlank(text) ? null : number(text))),
  notes: z
    .string()
    .trim()
    .transform((text) => (text === "" ? null : text)),
  sets: z.array(setSchema).min(1, "Add at least one set."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().min(1, "Enter your email.").pipe(z.email("Enter a valid email address.")),
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Enter a name for this exercise."),
});

const templateExerciseSchema = z
  .object({
    exercise_id: z.string().min(1, "Choose an exercise."),
    target_sets: z
      .string()
      .refine((text) => !isBlank(text), "Enter the number of sets.")
      .refine(
        (text) =>
          isBlank(text) || (Number.isInteger(number(text)) && number(text) >= 1 && number(text) <= 20),
        "Sets must be a whole number from 1 to 20."
      ),
    target_reps: z
      .string()
      .refine((text) => !isBlank(text), "Enter the reps.")
      .refine(
        (text) => isBlank(text) || (Number.isInteger(number(text)) && number(text) >= 1),
        "Reps must be a whole number, 1 or more."
      ),
    target_rpe: z
      .string()
      .refine(
        (text) =>
          isBlank(text) ||
          (number(text) >= 6 && number(text) <= 10 && Number.isInteger(number(text) * 2)),
        "RPE must be from 6 to 10, in steps of 0.5."
      ),
  })
  .transform((exercise) => ({
    exercise_id: exercise.exercise_id,
    target_sets: number(exercise.target_sets),
    target_reps: number(exercise.target_reps),
    target_rpe: isBlank(exercise.target_rpe) ? null : number(exercise.target_rpe),
  }));

const templateSchema = z.object({
  name: z.string().trim().min(1, "Give this template a name."),
  notes: z
    .string()
    .trim()
    .transform((text) => (text === "" ? null : text)),
  exercises: z.array(templateExerciseSchema).min(1, "Add at least one exercise."),
});

export type FieldErrors = Record<string, string>;

/** Runs a schema and returns errors keyed by field path, like "sets.0.weight". */
function validate<Schema extends z.ZodType>(schema: Schema, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true as const, data: result.data as z.output<Schema>, errors: {} as FieldErrors };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false as const, errors };
}

export const validateWorkout = (input: unknown) => validate(workoutSchema, input);
export const validateSignUp = (input: unknown) => validate(signUpSchema, input);
export const validateSignIn = (input: unknown) => validate(signInSchema, input);
export const validateExercise = (input: unknown) => validate(exerciseSchema, input);
export const validateTemplate = (input: unknown) => validate(templateSchema, input);
