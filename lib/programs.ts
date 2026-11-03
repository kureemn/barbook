export const PROGRAM_KEYS = ["six-week-strength", "five-three-one-bbb", "phul"] as const;
export type ProgramKey = (typeof PROGRAM_KEYS)[number];

export type SetTarget = { reps: number; percent: number };

type Target = {
  sets: number;
  reps: number;
  rpe: number | null;
  /** For a program that changes the weight within a session, as a share of the training max. */
  setTargets?: SetTarget[];
  note?: string;
};

type DayPlan = { name: string; exercises: { name: string; target: (week: number) => Target }[] };

export type SessionKey = { week: number; day: number };

export type ProgramExercise = Target & { name: string };

export type ProgramSession = SessionKey & {
  name: string;
  title: string;
  exercises: ProgramExercise[];
};

export type Program = {
  key: ProgramKey;
  name: string;
  focus: string;
  summary: string;
  weeks: number;
  deloadWeek: number | null;
  days: DayPlan[];
  weekSummary: (week: number) => string;
  /** Where the program came from, including what Barbook changed. */
  origin: string;
  sources: { label: string; url: string }[];
};

const byWeek =
  (targets: Target[]) =>
  (week: number): Target =>
    targets[week - 1];

const fixed = (target: Target) => () => target;

/** The share of an estimated 1-rep max that 5/3/1 calculates its percentages from. */
export const TRAINING_MAX_SHARE = 0.9;

// One entry per week. Reps fall and effort rises until the deload in week 6.
const MAIN = [
  { sets: 4, reps: 6, rpe: 7 },
  { sets: 4, reps: 5, rpe: 7.5 },
  { sets: 4, reps: 4, rpe: 8 },
  { sets: 4, reps: 3, rpe: 8.5 },
  { sets: 3, reps: 2, rpe: 9 },
  { sets: 3, reps: 3, rpe: 6 },
];

const SECONDARY = [
  { sets: 3, reps: 8, rpe: 7 },
  { sets: 3, reps: 8, rpe: 7.5 },
  { sets: 3, reps: 6, rpe: 7.5 },
  { sets: 3, reps: 6, rpe: 8 },
  { sets: 3, reps: 5, rpe: 8 },
  { sets: 2, reps: 5, rpe: 6 },
];

const ACCESSORY = [
  { sets: 3, reps: 10, rpe: 7 },
  { sets: 3, reps: 10, rpe: 7.5 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 3, reps: 10, rpe: 8 },
  { sets: 2, reps: 10, rpe: 6 },
];

const SIX_WEEK_STRENGTH: Program = {
  key: "six-week-strength",
  name: "6-week strength block",
  focus: "Squat, bench, and deadlift",
  summary:
    "Reps drop and effort climbs through week 5, then week 6 is a lighter deload. Effort is set by RPE, so weights come from what you've logged.",
  weeks: 6,
  deloadWeek: 6,
  days: [
    {
      name: "Squat",
      exercises: [
        { name: "Squat", target: byWeek(MAIN) },
        { name: "Pause Squat", target: byWeek(SECONDARY) },
        { name: "Leg Curl", target: byWeek(ACCESSORY) },
        { name: "Hanging Leg Raise", target: byWeek(ACCESSORY) },
      ],
    },
    {
      name: "Bench",
      exercises: [
        { name: "Bench", target: byWeek(MAIN) },
        { name: "Barbell Row", target: byWeek(SECONDARY) },
        { name: "Military Press", target: byWeek(SECONDARY) },
        { name: "Tricep Pushdown", target: byWeek(ACCESSORY) },
      ],
    },
    {
      name: "Deadlift",
      exercises: [
        { name: "Deadlift", target: byWeek(MAIN) },
        { name: "Romanian Deadlift", target: byWeek(SECONDARY) },
        { name: "Lat Pulldown", target: byWeek(ACCESSORY) },
        { name: "Back Extension", target: byWeek(ACCESSORY) },
      ],
    },
    {
      name: "Bench volume",
      exercises: [
        { name: "Pause Bench", target: byWeek(SECONDARY) },
        { name: "Incline Bench", target: byWeek(SECONDARY) },
        { name: "Dumbbell Row", target: byWeek(ACCESSORY) },
        { name: "Lateral Raise", target: byWeek(ACCESSORY) },
        { name: "Bicep Curl", target: byWeek(ACCESSORY) },
      ],
    },
  ],
  weekSummary: (week) => {
    const { sets, reps, rpe } = MAIN[week - 1];
    return `Main lifts: ${sets} × ${reps} @ RPE ${rpe}`;
  },
  origin:
    "Written for Barbook, not taken from a coach or a published program. It uses a common strength pattern: reps fall as effort rises, followed by a deload. The specific exercises and numbers haven't been tested on lifters.",
  sources: [],
};

// The ramp for each week, as a share of the training max.
const FIVE_THREE_ONE: SetTarget[][] = [
  [
    { reps: 5, percent: 0.65 },
    { reps: 5, percent: 0.75 },
    { reps: 5, percent: 0.85 },
  ],
  [
    { reps: 3, percent: 0.7 },
    { reps: 3, percent: 0.8 },
    { reps: 3, percent: 0.9 },
  ],
  [
    { reps: 5, percent: 0.75 },
    { reps: 3, percent: 0.85 },
    { reps: 1, percent: 0.95 },
  ],
  [
    { reps: 5, percent: 0.4 },
    { reps: 5, percent: 0.5 },
    { reps: 5, percent: 0.6 },
  ],
];

const BORING_BUT_BIG: SetTarget[] = Array.from({ length: 5 }, () => ({ reps: 10, percent: 0.5 }));

/** The main lift's ramp, then 5 × 10 with the same lift, except on the deload. */
function mainLift(week: number): Target {
  const deload = week === 4;
  const ramp = FIVE_THREE_ONE[week - 1];
  const setTargets = deload ? ramp : [...ramp, ...BORING_BUT_BIG];
  return {
    sets: setTargets.length,
    reps: ramp[ramp.length - 1].reps,
    rpe: null,
    setTargets,
    note: deload
      ? "Deload week. Keep it easy."
      : "On your third set, do as many good reps as you can, and log what you got. Then 5 × 10, lighter.",
  };
}

const fiveByTen = (week: number): Target =>
  week === 4 ? { sets: 3, reps: 10, rpe: 6 } : { sets: 5, reps: 10, rpe: 7 };

const FIVE_THREE_ONE_BBB: Program = {
  key: "five-three-one-bbb",
  name: "5/3/1 with Boring But Big",
  focus: "Steady strength plus extra size",
  summary:
    "One main lift a day. Each 4-week cycle builds from sets of 5 to a heavy top single, then deloads. Add 5 × 10 with the same lift for volume.",
  weeks: 4,
  deloadWeek: 4,
  days: [
    {
      name: "Press",
      exercises: [
        { name: "Military Press", target: mainLift },
        { name: "Pull-Up", target: fiveByTen },
      ],
    },
    {
      name: "Deadlift",
      exercises: [
        { name: "Deadlift", target: mainLift },
        { name: "Hanging Leg Raise", target: fiveByTen },
      ],
    },
    {
      name: "Bench",
      exercises: [
        { name: "Bench", target: mainLift },
        { name: "Dumbbell Row", target: fiveByTen },
      ],
    },
    {
      name: "Squat",
      exercises: [
        { name: "Squat", target: mainLift },
        { name: "Leg Curl", target: fiveByTen },
      ],
    },
  ],
  weekSummary: (week) =>
    [
      "Main lifts: 5, 5, 5+ @ 65–85%",
      "Main lifts: 3, 3, 3+ @ 70–90%",
      "Main lifts: 5, 3, 1+ @ 75–95%",
      "Deload: 5, 5, 5 @ 40–60%",
    ][week - 1],
  origin:
    "Based on 5/3/1 by Jim Wendler, and not affiliated with him. The sets, reps, and percentages follow the published 5/3/1 cycle, using a training max of 90% of your estimated max. Barbook simplifies it: it works out your training max from your best logged set instead of adding to it each cycle. The order of days, the assistance exercises, and using 50% for 5 × 10 are Barbook's choices, so check the original before relying on them.",
  sources: [
    {
      label: "5/3/1 cycle summary (Lift Vault)",
      url: "https://liftvault.com/programs/strength/jim-wendlers-531-spreadsheet/",
    },
  ],
};

const phulTarget =
  (startSets: number, laterSets: number, reps: number) =>
  (week: number): Target => ({ sets: week <= 3 ? startSets : laterSets, reps, rpe: 8 });

const PHUL: Program = {
  key: "phul",
  name: "PHUL",
  focus: "Building muscle",
  summary:
    "Power Hypertrophy Upper Lower: heavy upper and lower days early in the week, then higher-rep upper and lower days to build size.",
  weeks: 6,
  deloadWeek: null,
  days: [
    {
      name: "Upper power",
      exercises: [
        { name: "Bench", target: phulTarget(3, 4, 5) },
        { name: "Incline Bench", target: phulTarget(3, 4, 6) },
        { name: "Barbell Row", target: phulTarget(3, 4, 6) },
        { name: "Lat Pulldown", target: phulTarget(3, 4, 8) },
        { name: "Military Press", target: fixed({ sets: 3, reps: 6, rpe: 8 }) },
        { name: "Bicep Curl", target: fixed({ sets: 3, reps: 8, rpe: 8 }) },
        { name: "Tricep Pushdown", target: fixed({ sets: 3, reps: 8, rpe: 8 }) },
      ],
    },
    {
      name: "Lower power",
      exercises: [
        { name: "Squat", target: phulTarget(3, 4, 5) },
        { name: "Deadlift", target: phulTarget(3, 4, 5) },
        { name: "Leg Press", target: phulTarget(3, 4, 8) },
        { name: "Leg Curl", target: fixed({ sets: 3, reps: 12, rpe: 8 }) },
        { name: "Calf Raise", target: fixed({ sets: 3, reps: 8, rpe: 8 }) },
      ],
    },
    {
      name: "Upper size",
      exercises: [
        { name: "Incline Bench", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Dumbbell Row", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Dumbbell Bench", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
        { name: "Cable Row", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Lateral Raise", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
        { name: "Bicep Curl", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
        { name: "Tricep Pushdown", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
      ],
    },
    {
      name: "Lower size",
      exercises: [
        { name: "Front Squat", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Lunge", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Leg Curl", target: fixed({ sets: 4, reps: 10, rpe: 8 }) },
        { name: "Leg Extension", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
        { name: "Calf Raise", target: fixed({ sets: 4, reps: 12, rpe: 8 }) },
      ],
    },
  ],
  weekSummary: (week) =>
    week <= 3 ? "Power days: main lifts 3 × 5" : "Power days: main lifts 4 × 5",
  origin:
    "Based on PHUL by Brandon Campbell, and not affiliated with him. The days, exercises, and rep ranges come from Hevy's write-up, because the original Muscle & Strength article couldn't be read directly. Barbook simplifies it: it picks one rep target from each range, adds RPE 8, moves from 3 to 4 sets in week 4, and sets the length to 6 weeks. It also swaps exercises Barbook doesn't list, using Tricep Pushdown for skullcrushers and Dumbbell Bench for chest flies.",
  sources: [
    { label: "PHUL write-up (Hevy)", url: "https://www.hevyapp.com/phul-power-hypertrophy-upper-lower/" },
    { label: "Original article (Muscle & Strength)", url: "https://www.muscleandstrength.com/workouts/phul-workout" },
  ],
};

export const PROGRAMS: Program[] = [SIX_WEEK_STRENGTH, FIVE_THREE_ONE_BBB, PHUL];

/** A run saved with a program this version doesn't know falls back to the first one. */
export function getProgram(key: string) {
  return PROGRAMS.find((program) => program.key === key) ?? PROGRAMS[0];
}

export function totalSessions(program: Program) {
  return program.weeks * program.days.length;
}

export function isSessionKey(program: Program, { week, day }: SessionKey) {
  return (
    Number.isInteger(week) &&
    Number.isInteger(day) &&
    week >= 1 &&
    week <= program.weeks &&
    day >= 1 &&
    day <= program.days.length
  );
}

/** Week and day count from 1, matching what the lifter sees. */
export function programSession(program: Program, week: number, day: number): ProgramSession {
  const { name, exercises } = program.days[day - 1];
  return {
    week,
    day,
    name,
    title: `Week ${week}, Day ${day}: ${name}`,
    exercises: exercises.map(({ name: exercise, target }) => ({ name: exercise, ...target(week) })),
  };
}

/** The first session not yet logged, or null when the whole program is done. */
export function nextSession(program: Program, done: SessionKey[]): ProgramSession | null {
  for (let week = 1; week <= program.weeks; week++) {
    for (let day = 1; day <= program.days.length; day++) {
      if (!done.some((session) => session.week === week && session.day === day)) {
        return programSession(program, week, day);
      }
    }
  }
  return null;
}

/** A session exercise's target in words, like "4 × 6 @ RPE 7" or "5, 3, 1+, then 5 × 10". */
export function targetText({ sets, reps, rpe, setTargets }: ProgramExercise) {
  if (setTargets) {
    const ramp = setTargets.slice(0, 3).map((target) => target.reps);
    return setTargets.length > 3 ? `${ramp.join(", ")}+, then 5 × 10` : ramp.join(", ");
  }
  return rpe === null ? `${sets} × ${reps}` : `${sets} × ${reps} @ RPE ${rpe}`;
}
