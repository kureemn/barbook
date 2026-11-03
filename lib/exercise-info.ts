export const MUSCLE_NAMES = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  traps: "Traps",
  lats: "Lats",
  lowerBack: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
} as const;

export type Muscle = keyof typeof MUSCLE_NAMES;

export const EQUIPMENT_NAMES = {
  barbell: "Barbell",
  dumbbell: "Dumbbells",
  bench: "Bench",
  rack: "Squat rack",
  cable: "Cable machine",
  machine: "Machine",
  pullUpBar: "Pull-up bar",
  dipBars: "Dip bars",
} as const;

export type Equipment = keyof typeof EQUIPMENT_NAMES;

export type ExerciseInfo = {
  main: Muscle[];
  also: Muscle[];
  equipment: Equipment[];
};

const SQUAT: ExerciseInfo = {
  main: ["quads", "glutes"],
  also: ["hamstrings", "lowerBack", "abs"],
  equipment: ["barbell", "rack"],
};

const BENCH: ExerciseInfo = {
  main: ["chest"],
  also: ["triceps", "shoulders"],
  equipment: ["barbell", "bench"],
};

const DEADLIFT: ExerciseInfo = {
  main: ["glutes", "hamstrings", "lowerBack"],
  also: ["quads", "lats", "traps", "forearms"],
  equipment: ["barbell"],
};

// Keyed by lowercase name, so a lifter's own "squat" still matches.
const INFO: Record<string, ExerciseInfo> = {
  squat: SQUAT,
  "pause squat": SQUAT,
  bench: BENCH,
  "pause bench": BENCH,
  deadlift: DEADLIFT,
  "deficit deadlift": DEADLIFT,
  "back extension": { main: ["lowerBack"], also: ["glutes", "hamstrings"], equipment: ["machine"] },
  "barbell row": { main: ["lats"], also: ["traps", "biceps", "lowerBack"], equipment: ["barbell"] },
  "bicep curl": { main: ["biceps"], also: ["forearms"], equipment: ["dumbbell"] },
  "bulgarian split squat": {
    main: ["quads", "glutes"],
    also: ["hamstrings"],
    equipment: ["dumbbell", "bench"],
  },
  "cable row": { main: ["lats"], also: ["traps", "biceps"], equipment: ["cable"] },
  "calf raise": { main: ["calves"], also: [], equipment: ["dumbbell"] },
  "close-grip bench": {
    main: ["triceps", "chest"],
    also: ["shoulders"],
    equipment: ["barbell", "bench"],
  },
  dip: { main: ["chest", "triceps"], also: ["shoulders"], equipment: ["dipBars"] },
  "dumbbell bench": {
    main: ["chest"],
    also: ["triceps", "shoulders"],
    equipment: ["dumbbell", "bench"],
  },
  "dumbbell row": { main: ["lats"], also: ["traps", "biceps"], equipment: ["dumbbell", "bench"] },
  "dumbbell shoulder press": {
    main: ["shoulders"],
    also: ["triceps"],
    equipment: ["dumbbell", "bench"],
  },
  "face pull": { main: ["shoulders"], also: ["traps"], equipment: ["cable"] },
  "front squat": {
    main: ["quads"],
    also: ["glutes", "abs"],
    equipment: ["barbell", "rack"],
  },
  "good morning": {
    main: ["hamstrings", "lowerBack"],
    also: ["glutes"],
    equipment: ["barbell", "rack"],
  },
  "hanging leg raise": { main: ["abs"], also: ["forearms"], equipment: ["pullUpBar"] },
  "hip thrust": { main: ["glutes"], also: ["hamstrings"], equipment: ["barbell", "bench"] },
  "incline bench": {
    main: ["chest", "shoulders"],
    also: ["triceps"],
    equipment: ["barbell", "bench"],
  },
  "lat pulldown": { main: ["lats"], also: ["biceps"], equipment: ["cable"] },
  "lateral raise": { main: ["shoulders"], also: ["traps"], equipment: ["dumbbell"] },
  "leg curl": { main: ["hamstrings"], also: ["calves"], equipment: ["machine"] },
  "leg extension": { main: ["quads"], also: [], equipment: ["machine"] },
  "leg press": { main: ["quads", "glutes"], also: ["hamstrings"], equipment: ["machine"] },
  lunge: { main: ["quads", "glutes"], also: ["hamstrings"], equipment: ["dumbbell"] },
  "military press": {
    main: ["shoulders"],
    also: ["triceps", "traps"],
    equipment: ["barbell", "rack"],
  },
  "pull-up": { main: ["lats"], also: ["biceps", "forearms"], equipment: ["pullUpBar"] },
  "romanian deadlift": {
    main: ["hamstrings", "glutes"],
    also: ["lowerBack", "forearms"],
    equipment: ["barbell"],
  },
  "sumo deadlift": {
    main: ["glutes", "quads"],
    also: ["hamstrings", "lowerBack", "traps"],
    equipment: ["barbell"],
  },
  "tricep pushdown": { main: ["triceps"], also: [], equipment: ["cable"] },
};

/** The main muscles across a workout's exercises, in the order they were trained. */
export function workoutMuscles(names: (string | undefined)[]): Muscle[] {
  return [...new Set(names.flatMap((name) => exerciseInfo(name)?.main ?? []))];
}

/** Null for an exercise the lifter added themselves, since we can't know what it trains. */
export function exerciseInfo(name: string | undefined): ExerciseInfo | null {
  if (!name) return null;
  return INFO[name.trim().toLowerCase()] ?? null;
}
