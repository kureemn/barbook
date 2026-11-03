export type ExerciseVideo = {
  id: string;
  title: string;
  channel: string;
  length: string;
};

// YouTube videos, keyed by lowercase name like exercise info. Chosen to be short, and
// from channels that teach lifting, so a lifter can check their form between sets.
const VIDEOS: Record<string, ExerciseVideo> = {
  "back extension": {
    id: "D_FUg2wHhk8",
    title: "Movement Demo - Back Extensions",
    channel: "Rogue Fitness",
    length: "1:16",
  },
  "barbell row": {
    id: "FWJR5Ve8bnQ",
    title: "How to do the BENT-OVER BARBELL ROW! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  bench: {
    id: "GIqcXj2pAPA",
    title: "How to Bench Press",
    channel: "CanditoTrainingHQ",
    length: "3:42",
  },
  "bicep curl": {
    id: "cBSD6mQIPQk",
    title: "Dumbbell Bicep Curl | Nuffield Health",
    channel: "Nuffield Health",
    length: "0:36",
  },
  "bulgarian split squat": {
    id: "SkNsa3eBwLA",
    title: "How to do the BULGARIAN SPLIT SQUAT! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "cable row": {
    id: "vwHG9Jfu4sw",
    title: "How to do the SEATED CABLE ROW! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "calf raise": {
    id: "wxwY7GXxL4k",
    title: "Standing Dumbbell Calf Raises - Calf Exercise - Bodybuilding.com",
    channel: "Bodybuilding.com",
    length: "0:48",
  },
  "close-grip bench": {
    id: "nEF0bv2FW94",
    title: "How To: Close-Grip Barbell Bench Press",
    channel: "ScottHermanFitness",
    length: "1:36",
  },
  deadlift: {
    id: "u6UgD1H_AXw",
    title: "How To Deadlift With Proper Form",
    channel: "CanditoTrainingHQ",
    length: "2:35",
  },
  "deficit deadlift": {
    id: "CpWsUsqBtN8",
    title: "Movement Demo - The Deficit Deadlift",
    channel: "Rogue Fitness",
    length: "1:13",
  },
  dip: {
    id: "TrJVszDm7ik",
    title: "How to do the BODYWEIGHT DIP! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "dumbbell bench": {
    id: "VmB1G1K7v94",
    title: "How To: Dumbbell Chest Press",
    channel: "ScottHermanFitness",
    length: "2:11",
  },
  "dumbbell row": {
    id: "dFzUjzfih7k",
    title: "How to do the SINGLE ARM DUMBBELL ROW! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "dumbbell shoulder press": {
    id: "rO_iEImwHyo",
    title: "How to do the SEATED DUMBBELL SHOULDER PRESS! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "face pull": {
    id: "V8dZ3pyiCBo",
    title: "Face Pulls | How To Perform Them Properly",
    channel: "KAGED",
    length: "1:56",
  },
  "front squat": {
    id: "wyDbagKS7Rg",
    title: "How To Front Squat With Proper Form",
    channel: "CanditoTrainingHQ",
    length: "2:26",
  },
  "good morning": {
    id: "5Xj6XUa77qc",
    title: "How To: Good Mornings",
    channel: "ScottHermanFitness",
    length: "1:50",
  },
  "hanging leg raise": {
    id: "hdng3Nm1x_E",
    title: "How To: Hanging Leg-Lift",
    channel: "ScottHermanFitness",
    length: "2:19",
  },
  "hip thrust": {
    id: "pBH7pKHn-dI",
    title: "How to Perform Barbell Hip Thrusts | Glutes Exercise Tutorial",
    channel: "Buff Dudes Workouts",
    length: "1:29",
  },
  "incline bench": {
    id: "5kyLUGVq_pk",
    title: "How to PROPERLY Incline Barbell Bench Press (FIX YOUR FORM NOW)",
    channel: "Colossus Fitness",
    length: "2:18",
  },
  "lat pulldown": {
    id: "trZQjegcRx0",
    title: "How to Do a Lat Pulldown + Common Mistake",
    channel: "Muscle & Motion",
    length: "0:36",
  },
  "lateral raise": {
    id: "PzsMitRdI_8",
    title: "How to do the DUMBBELL LATERAL RAISE! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:01",
  },
  "leg curl": {
    id: "vl5nUdE9mWM",
    title: "How to Lying Leg Curl | Proper Technique, Set Up, & Mistakes",
    channel: "Physique Development",
    length: "2:44",
  },
  "leg extension": {
    id: "YyvSfVjQeL0",
    title: "How To: Leg Extension (Cybex)",
    channel: "ScottHermanFitness",
    length: "2:41",
  },
  "leg press": {
    id: "cDGOn-yfKJA",
    title: "How to do a Leg Press  | Proper Form & Technique | NASM",
    channel: "National Academy of Sports Medicine (NASM)",
    length: "0:33",
  },
  lunge: {
    id: "D7KaRcUTQeE",
    title: "How To: Dumbbell Stepping Lunge",
    channel: "ScottHermanFitness",
    length: "2:12",
  },
  "military press": {
    id: "KP1sYz2VICk",
    title: "How to do the BARBELL OVERHEAD 'MILITARY' PRESS! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  "pause bench": {
    id: "K4BIkKGKy9k",
    title: "Paused Bench Press: Gym Shorts (How To)",
    channel: "Barbell Logic",
    length: "0:49",
  },
  "pause squat": {
    id: "nknf16JJTZo",
    title: "The Paused Squat: Gym Shorts (How To)",
    channel: "Barbell Logic",
    length: "0:49",
  },
  "pull-up": {
    id: "XB_7En-zf_M",
    title: "How to do a Perfect Pullup",
    channel: "FitnessFAQs",
    length: "2:24",
  },
  "romanian deadlift": {
    id: "3VXmecChYYM",
    title: "How to do the ROMANIAN DEADLIFT! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
  squat: {
    id: "zoZWgTrZLd8",
    title: "How To Squat With Perfect Form",
    channel: "CanditoTrainingHQ",
    length: "2:36",
  },
  "sumo deadlift": {
    id: "PQ3A_HmfQyk",
    title: "HOW TO SUMO DEADLIFT ft. Larry",
    channel: "Barbell Brigade",
    length: "3:00",
  },
  "tricep pushdown": {
    id: "-zLyUAo1gMw",
    title: "How to do the CABLE TRICEP PUSHDOWN! | 2 Minute Tutorial",
    channel: "Max Euceda",
    length: "2:00",
  },
};

/** Null for an exercise the lifter added themselves. */
export function exerciseVideo(name: string | undefined): ExerciseVideo | null {
  if (!name) return null;
  return VIDEOS[name.trim().toLowerCase()] ?? null;
}
