import { LoadedBar, plateFill } from "@/components/program/barbell-art";
import type { Lift } from "@/lib/dashboard";

// Seen from the side, a bar's plates stack up as rings, biggest at the back.
const PLATE_RINGS = [24, 20, 16, 12, 9, 6];

const FIGURE = {
  fill: "none",
  stroke: "var(--tint-peach-foreground)",
  strokeWidth: 8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Squat({ plates }: { plates: number }) {
  return (
    <>
      <LoadedBar plates={plates} y={38} />
      <circle cx="180" cy="20" r="11" fill={FIGURE.stroke} />
      <g {...FIGURE}>
        <path d="M180 42V76" />
        <path d="M180 76L146 78L152 110M180 76L214 78L208 110" />
        <path d="M180 46L156 54L150 38M180 46L204 54L210 38" />
        <path d="M144 110H154M206 110H216" />
      </g>
    </>
  );
}

function Bench({ plates }: { plates: number }) {
  return (
    <>
      <rect x="84" y="82" width="150" height="10" rx="5" fill="var(--plate-bar)" />
      <path d="M104 92V112M214 92V112" stroke="var(--plate-bar)" strokeWidth="6" strokeLinecap="round" />
      {PLATE_RINGS.slice(0, plates).map((radius, index) => (
        <circle key={radius} cx="140" cy="26" r={radius} fill={plateFill(index)} />
      ))}
      <circle cx="90" cy="68" r="11" fill={FIGURE.stroke} />
      <g {...FIGURE}>
        <path d="M108 74H210" />
        <path d="M210 74L246 66L252 110H262" />
        <path d="M134 72L140 30" />
      </g>
      <circle cx="140" cy="26" r="4" fill="var(--plate-bar)" />
    </>
  );
}

function Deadlift({ plates }: { plates: number }) {
  return (
    <>
      <LoadedBar plates={plates} y={80} />
      <circle cx="180" cy="16" r="11" fill={FIGURE.stroke} />
      <g {...FIGURE}>
        <path d="M180 30V58" />
        <path d="M180 58L160 72L166 110M180 58L200 72L194 110" />
        <path d="M180 34L154 38L150 78M180 34L206 38L210 78" />
        <path d="M160 110H170M190 110H200" />
      </g>
    </>
  );
}

const FIGURES = { squat: Squat, bench: Bench, deadlift: Deadlift };

/** Someone doing the day's lift, with the bar loaded by how far through the program you are. */
export function LiftArt({ lift, plates }: { lift: Lift; plates: number }) {
  const Figure = FIGURES[lift];
  return (
    <svg viewBox="50 0 260 116" className="mx-auto block h-28 w-full overflow-visible lg:h-32" aria-hidden="true">
      <Figure plates={plates} />
    </svg>
  );
}
