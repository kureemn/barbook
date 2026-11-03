export const PROGRAM_KEY = "six-week-strength";
export const PROGRAM_NAME = "6-week strength block";
export const WEEKS = 6;
export const DAYS = 4;
export const DELOAD_WEEK = 6;

type Target = { sets: number; reps: number; rpe: number };

// One entry per week. Reps fall and effort rises until the deload in week 6.
const MAIN: Target[] = [
  { sets: 4, reps: 6, rpe: 7 },
  { sets: 4, reps: 5, rpe: 7.5 },
  { sets: 4, reps: 4, rpe: 8 },
  { sets: 4, reps: 3, rpe: 8.5 },
  { sets: 3, reps: 2, rpe: 9 },
  { sets: 3, reps: 3, rpe: 6 },
];

const SECONDARY: Target[] = [
  { sets: 3, reps: 8, rpe: 7 },
  { sets: 3, reps: 8, rpe: 7.5 },
  { sets: 3, reps: 6, rpe: 7.5 },
  { sets: 3, reps: 6, rpe: 8 },
  { sets: 3, reps: 5, rpe: 8 },
  { sets: 2, reps: 5, rpe: 6 },
];

const ACCESSORY: Target[] = [
  { sets: 3, reps: 10, rpe: 7 },
  { sets: 3, reps: 10, rpe: 7.5 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 2, reps: 10, rpe: 6 },
];

const PROGRAM_DAYS: { name: string; exercises: [string, Target[]][] }[] = [
  {
    name: "Squat",
    exercises: [
      ["Squat", MAIN],
      ["Pause Squat", SECONDARY],
      ["Leg Curl", ACCESSORY],
      ["Hanging Leg Raise", ACCESSORY],
    ],
  },
  {
    name: "Bench",
    exercises: [
      ["Bench", MAIN],
      ["Barbell Row", SECONDARY],
      ["Military Press", SECONDARY],
      ["Tricep Pushdown", ACCESSORY],
    ],
  },
  {
    name: "Deadlift",
    exercises: [
      ["Deadlift", MAIN],
      ["Romanian Deadlift", SECONDARY],
      ["Lat Pulldown", ACCESSORY],
      ["Back Extension", ACCESSORY],
    ],
  },
  {
    name: "Bench volume",
    exercises: [
      ["Pause Bench", SECONDARY],
      ["Incline Bench", SECONDARY],
      ["Dumbbell Row", ACCESSORY],
      ["Lateral Raise", ACCESSORY],
      ["Bicep Curl", ACCESSORY],
    ],
  },
];

export type SessionKey = { week: number; day: number };

export type ProgramExercise = Target & { name: string };

export type ProgramSession = SessionKey & {
  name: string;
  title: string;
  exercises: ProgramExercise[];
};

export function isSessionKey({ week, day }: SessionKey) {
  return (
    Number.isInteger(week) && Number.isInteger(day) && week >= 1 && week <= WEEKS && day >= 1 && day <= DAYS
  );
}

export function dayName(day: number) {
  return PROGRAM_DAYS[day - 1].name;
}

/** Week and day count from 1, matching what the lifter sees. */
export function programSession(week: number, day: number): ProgramSession {
  const { name, exercises } = PROGRAM_DAYS[day - 1];
  return {
    week,
    day,
    name,
    title: `Week ${week}, Day ${day}: ${name}`,
    exercises: exercises.map(([exercise, targets]) => ({ name: exercise, ...targets[week - 1] })),
  };
}

/** What the main lifts ask for that week, for the program overview. */
export function weekTarget(week: number) {
  return MAIN[week - 1];
}

/** The first session not yet logged, or null when the whole program is done. */
export function nextSession(done: SessionKey[]): ProgramSession | null {
  for (let week = 1; week <= WEEKS; week++) {
    for (let day = 1; day <= DAYS; day++) {
      if (!done.some((session) => session.week === week && session.day === day)) {
        return programSession(week, day);
      }
    }
  }
  return null;
}
