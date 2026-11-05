export type ExerciseCues = {
  setup: string;
  brace: string;
  move: string;
  safety: string;
  /** The page on strengthlog.com that the technique is based on. */
  source: string;
};

// Keyed by lowercase name like exercise info. Short enough to read between sets. The technique
// follows StrengthLog's guides, in Barbook's own words. The safety notes are Barbook's.
const CUES: Record<string, ExerciseCues> = {
  "back extension": {
    setup: "Set the top pad against the top of your thighs, with your upper body hanging off the edge.",
    brace: "Breathe in, tighten your core, and cross your arms over your chest.",
    move: "Hinge down with control, then lift until your body is in a straight line.",
    safety: "Stop at a straight line. Don't swing or lean back past it.",
    source: "back-extension",
  },
  "barbell row": {
    setup: "Grip the bar overhand, lean forward, and let it hang from straight arms.",
    brace: "Breathe in and tighten your core before each pull.",
    move: "Pull the bar to your abs or chest, then lower it with control.",
    safety: "Keep your back flat. If you have to jerk the weight up, go lighter.",
    source: "barbell-row",
  },
  bench: {
    setup: "Pull your shoulder blades together and down, and grip slightly wider than your shoulders.",
    brace: "Breathe in and hold it before you unrack the bar.",
    move: "Lower with control to your chest near your breastbone, then press up as you breathe out.",
    safety: "Use a spotter or safety bars. Never bench heavy alone without a way out from under the bar.",
    source: "bench-press",
  },
  "bicep curl": {
    setup: "Hold the dumbbells underhand, with your arms hanging by your sides.",
    brace: "Stand tall and tighten your core so your body doesn't swing.",
    move: "Bend your elbows to lift, keep your upper arms at your sides, and lower with control.",
    safety: "If you have to swing or lean back, go lighter.",
    source: "dumbbell-curl",
  },
  "bulgarian split squat": {
    setup: "Stand a long step in front of a knee-height bench, with one foot on it behind you.",
    brace: "Breathe in, look forward, and tighten your core.",
    move: "Lower with control until your back knee is almost at the floor, then push up through your front leg.",
    safety: "Start with just your bodyweight until you feel balanced. Stay clear of anything you could fall into.",
    source: "bulgarian-split-squat",
  },
  "cable row": {
    setup: "Sit tall with your feet on the platform and a slight bend in your knees.",
    brace: "Breathe in and tighten your core, with your chest up.",
    move: "Pull the handle to your stomach, then let your arms straighten with control.",
    safety: "Don't let your lower back round as the weight pulls you forward.",
    source: "cable-close-grip-seated-row",
  },
  "calf raise": {
    setup: "Put the balls of your feet on the support and stand upright.",
    brace: "Tighten your core and keep your knees still.",
    move: "Lower your heels with control, then push up as high as you can.",
    safety: "Don't bounce at the bottom. Slow down if you feel it in your Achilles.",
    source: "standing-calf-raise",
  },
  "close-grip bench": {
    setup: "Pull your shoulder blades together and down, with your hands about over your shoulders.",
    brace: "Breathe in and hold it before you unrack the bar.",
    move: "Lower with control to the bottom of your chest, then press up as you breathe out.",
    safety: "Use a spotter or safety bars. Go no narrower than feels good on your wrists.",
    source: "close-grip-bench-press",
  },
  deadlift: {
    setup: "Stand close with the bar over the middle of your foot, then lean forward and grip it.",
    brace: "Breathe in, hold it, and tighten your core before you pull.",
    move: "Keep your back straight and the bar close as you stand up, then lower it with control.",
    safety: "If your back starts to round, end the set or lower the weight.",
    source: "deadlift",
  },
  "deficit deadlift": {
    setup: "Stand on a low, stable plate with the bar over the middle of your foot, and grip it.",
    brace: "Breathe in, hold it, and tighten your core before you pull.",
    move: "Keep your back straight and the bar close as you stand up, then lower it with control.",
    safety: "This position is harder to hold, so go lighter than your deadlift. Make sure the platform won't slide.",
    source: "deficit-deadlift",
  },
  dip: {
    setup: "Grip the bars about shoulder width apart and get to the top with straight arms.",
    brace: "Tighten your core and keep your shoulders down, away from your ears.",
    move: "Lower with control until your shoulders are just below your elbows, or as deep as is comfortable, then press up.",
    safety: "Stop higher if you feel it in the front of your shoulders.",
    source: "bar-dip",
  },
  "dumbbell bench": {
    setup: "Lie back with the dumbbells at your chest, shoulder blades together and down.",
    brace: "Breathe in and plant your feet before you press.",
    move: "Press up until your arms are straight, then lower with control as you breathe in.",
    safety: "Use weights you can get into position without help, and don't drop them from the top.",
    source: "dumbbell-chest-press",
  },
  "dumbbell row": {
    setup: "Put one hand and knee on a bench, with your back flat and the dumbbell in your other hand.",
    brace: "Breathe in and tighten your core before each pull.",
    move: "Drive your elbow toward the ceiling, then lower with control as you breathe out.",
    safety: "Keep your back flat, and don't twist your body to lift the weight.",
    source: "dumbbell-row",
  },
  "dumbbell shoulder press": {
    setup: "Lift the dumbbells to your shoulders.",
    brace: "Breathe in and lightly tighten your core.",
    move: "Press up until your arms are straight as you breathe out, then lower with control.",
    safety: "Keep your ribs down so you don't lean back. Take the weights down in control, not in a drop.",
    source: "dumbbell-shoulder-press",
  },
  "face pull": {
    setup: "Set a rope high on the cable, grip it overhand, and step back.",
    brace: "Stand tall and tighten your core so you don't lean back.",
    move: "Keep your elbows high, pull the rope toward your face, and return with control.",
    safety: "Keep this light enough to control. It isn't a lift to force.",
    source: "face-pull",
  },
  "front squat": {
    setup: "Rest the bar on the front of your shoulders, close to your throat, then step back and set your feet.",
    brace: "Breathe in and tighten your core before you unrack the bar.",
    move: "Keep your chest up, lower with control as deep as good form allows, then stand up.",
    safety: "Set the safety bars just below your lowest point. If you lose it, let the bar fall forward onto them.",
    source: "front-squat",
  },
  "good morning": {
    setup: "Rest the bar on your upper back, step back, and set your feet slightly wider than your hips.",
    brace: "Breathe in, hold it, and tighten your core.",
    move: "Push your hips back and lean forward with a straight back, then reverse the movement.",
    safety: "Start light and stop before your back rounds. Set the safety bars low enough to clear your path.",
    source: "good-morning",
  },
  "hanging leg raise": {
    setup: "Hang from a bar high enough that your legs are straight.",
    brace: "Tighten your core and stop any swinging.",
    move: "Lift your legs as high as you can, then lower them with control.",
    safety: "Bend your knees to make it easier, and let go only with your feet under you.",
    source: "hanging-leg-raise",
  },
  "hip thrust": {
    setup: "Sit with your back against a sturdy bench, and roll the bar over your hips with your feet on the floor.",
    brace: "Tighten your core and hold the bar steady with your hands.",
    move: "Push your hips up until your knees are at about 90 degrees, then lower with control.",
    safety: "Make sure the bench can't slide, and use a pad if the bar hurts your hips.",
    source: "hip-thrust",
  },
  "incline bench": {
    setup: "Sit on the incline and unrack the bar over your shoulders with straight arms.",
    brace: "Breathe in and tighten your core before you lower it.",
    move: "Lower the bar to your chest with control, then press up as you breathe out.",
    safety: "Use a spotter or safety bars, the same as on a flat bench.",
    source: "incline-bench-press",
  },
  "lat pulldown": {
    setup: "Grip the bar, sit with your thighs under the pad, and look up at it.",
    brace: "Breathe in with your chest up.",
    move: "Pull the bar to your upper chest, then let it rise with control until your arms are straight.",
    safety: "Pull to the front, not behind your neck, and don't lean far back to finish a rep.",
    source: "lat-pulldown-with-pronated-grip",
  },
  "lateral raise": {
    setup: "Hold the dumbbells by your sides with almost straight arms.",
    brace: "Stand tall and tighten your core so you don't swing.",
    move: "Lift out to your sides until your upper arms are level, then lower with control.",
    safety: "Keep it light. If you have to swing, the weight is too heavy.",
    source: "dumbbell-lateral-raise",
  },
  "leg curl": {
    setup: "Adjust the machine so your knees line up with its joint.",
    brace: "Keep your hips down on the pad and hold the handles.",
    move: "Bend your knees as far as you can, then lower slowly.",
    safety: "Lower under control, and don't let the weight stack slam.",
    source: "lying-leg-curl",
  },
  "leg extension": {
    setup: "Adjust the machine so your knees line up with its joint.",
    brace: "Sit back against the pad and hold the handles.",
    move: "Straighten your knees with control, then lower slowly.",
    safety: "Don't kick the weight up. Go lighter if you feel it in your kneecap.",
    source: "leg-extension",
  },
  "leg press": {
    setup: "Set the machine and its safety stops, with your feet about shoulder width apart on the platform.",
    brace: "Breathe in and keep your hips on the seat.",
    move: "Lower as deep as you can without your back rounding, then press up as you breathe out.",
    safety: "Keep the safety stops in place, and don't slam your knees straight at the top.",
    source: "leg-press",
  },
  lunge: {
    setup: "Stand with your feet about shoulder width apart and a dumbbell in each hand.",
    brace: "Stand tall and tighten your core.",
    move: "Take a big step forward, sink down without your back knee hitting the floor, and push back.",
    safety: "Start with just your bodyweight until you feel balanced, and clear the floor around you.",
    source: "dumbbell-lunge",
  },
  "military press": {
    setup: "Set the bar at about chest height, grip slightly wider than your shoulders, and step back.",
    brace: "Breathe in and lightly tighten your core, with your glutes tight.",
    move: "Press up until your arms are straight as you breathe out, then lower with control.",
    safety: "Keep your ribs down so you don't lean back, and move your head out of the bar's path.",
    source: "overhead-press",
  },
  "pause bench": {
    setup: "Pull your shoulder blades together and down, and grip slightly wider than your shoulders.",
    brace: "Breathe in and hold it before you unrack the bar.",
    move: "Lower to your chest, hold it still for a moment, then press up as you breathe out.",
    safety: "Use a spotter or safety bars. Stay tight during the pause, and don't let the bar sink into your chest.",
    source: "bench-press",
  },
  "pause squat": {
    setup: "Rest the bar on your upper back, unrack it, take two steps back, and set your feet.",
    brace: "Breathe in and tighten your core before you go down.",
    move: "Lower as deep as good form allows, stop for a clear pause, then stand up.",
    safety: "Set the safety bars just below your lowest point, and stay tight during the pause.",
    source: "pause-squat",
  },
  "pull-up": {
    setup: "Grip the bar overhand, slightly wider than your shoulders.",
    brace: "Keep your chest up and look up at the bar.",
    move: "Pull until your chin clears the bar, then lower with control until your arms are straight.",
    safety: "Don't drop into the bottom. Use a band or assistance until you can lower with control.",
    source: "pull-up",
  },
  "romanian deadlift": {
    setup: "Start standing with the bar, lifted from the floor or a rack.",
    brace: "Breathe in and tighten your core before you lean.",
    move: "Push your hips back with almost straight knees, and stop before your back rounds. Then stand up.",
    safety: "Your back sets the depth. The bar doesn't need to reach the floor.",
    source: "romanian-deadlift",
  },
  squat: {
    setup: "Rest the bar on your upper back, unrack it, take two steps back, and set your feet.",
    brace: "Big breath and tighten your core before you go down.",
    move: "Lower with control as deep as good form allows, keeping your knees in line with your toes, then stand up.",
    safety: "Set the rack's safety bars just below your lowest point, especially when lifting alone.",
    source: "squat",
  },
  "sumo deadlift": {
    setup: "Take a wide stance with the bar over the middle of your foot and your shins about vertical.",
    brace: "Breathe in, hold it, and tighten your core before you pull.",
    move: "Keep your back straight and the bar close as you stand up, then lower it with control.",
    safety: "Push your knees out in line with your toes. If your back rounds, end the set or lower the weight.",
    source: "sumo-deadlift",
  },
  "tricep pushdown": {
    setup: "Set a rope high on the cable, grip it, and step back.",
    brace: "Stand tall and pin your upper arms to your sides.",
    move: "Push down until your arms are straight, then let the rope rise with control.",
    safety: "Keep your elbows still. If you have to lean over it, go lighter.",
    source: "tricep-pushdown-with-rope",
  },
};

/** Null for an exercise the lifter added themselves. */
export function exerciseCues(name: string | undefined): ExerciseCues | null {
  if (!name) return null;
  return CUES[name.trim().toLowerCase()] ?? null;
}
