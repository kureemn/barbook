import { MUSCLE_NAMES, type ExerciseInfo, type Muscle } from "@/lib/exercise-info";

// Each shape is the figure's left side, then mirrored, on a 100 × 200 canvas.
const SHOULDER = "M57 30C65 27 73 32 74 42C69 43 63 41 58 37Z";
const UPPER_ARM = "M69 45C74 46 77 56 76 66C73 67 69 66 67 62C66 56 66 49 69 45Z";
const FOREARM = "M67 66C70 69 74 70 77 69C79 78 77 90 75 97L71 97C68 88 66 76 67 66Z";
const LOWER_LEG = "M54 146C60 144 64 150 63 162C62 172 60 182 59 190L56 190C54 176 52 158 54 146Z";

type Shapes = Partial<Record<Muscle, string>>;

const FRONT: Shapes = {
  shoulders: SHOULDER,
  chest: "M51 33C58 31 66 37 67 43C66 51 58 55 51 53Z",
  biceps: UPPER_ARM,
  forearms: FOREARM,
  abs: "M51 56L60 55C62 65 61 78 59 86L51 92Z",
  quads: "M52 96C58 90 63 90 65 94C67 108 65 126 61 140L54 140C52 125 51 108 52 96Z",
  calves: LOWER_LEG,
};

const BACK: Shapes = {
  traps: "M50 23L56 26L66 33L57 38L51 55L50 55Z",
  shoulders: SHOULDER,
  triceps: UPPER_ARM,
  forearms: FOREARM,
  lats: "M59 40C64 42 67 46 66 52C63 62 58 70 52 74L52 57Z",
  lowerBack: "M51 76L59 69L61 84L51 90Z",
  glutes: "M51 92C57 88 65 90 66 98C67 108 60 114 51 110Z",
  hamstrings: "M52 113C58 116 64 113 65 108C66 120 64 132 61 142L55 142C53 130 52 122 52 113Z",
  calves: LOWER_LEG,
};

function fillFor(muscle: Muscle, info: ExerciseInfo) {
  if (info.main.includes(muscle)) return "var(--muscle-main)";
  if (info.also.includes(muscle)) return "var(--muscle-also)";
  return "var(--muscle-rest)";
}

function Figure({ label, shapes, info }: { label: string; shapes: Shapes; info: ExerciseInfo }) {
  const entries = Object.entries(shapes) as [Muscle, string][];
  const side = entries.map(([muscle, path]) => (
    <path key={muscle} d={path} fill={fillFor(muscle, info)} />
  ));
  return (
    <figure className="flex w-14 flex-col items-center gap-1">
      <svg viewBox="16 2 68 192" className="h-28 w-full" aria-hidden="true">
        <circle cx="50" cy="13" r="9" fill="var(--muscle-rest)" />
        <path d="M45 21H55V27L50 30L45 27Z" fill="var(--muscle-rest)" />
        {side}
        <g transform="translate(100 0) scale(-1 1)">{side}</g>
      </svg>
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

/** Front and back of the body, with the muscles an exercise trains filled in. */
export function MuscleMap({ info }: { info: ExerciseInfo }) {
  const names = (muscles: Muscle[]) => muscles.map((muscle) => MUSCLE_NAMES[muscle]).join(", ");
  const description = `Body diagram. Main muscles: ${names(info.main)}.${
    info.also.length > 0 ? ` Also works: ${names(info.also)}.` : ""
  }`;
  return (
    <div role="img" aria-label={description} className="flex shrink-0 gap-1">
      <Figure label="Front" shapes={FRONT} info={info} />
      <Figure label="Back" shapes={BACK} info={info} />
    </div>
  );
}
