import { cn } from "@/lib/utils";

const PLATE_HEIGHTS = [68, 68, 56, 44, 34, 24];
const PLATE_FILLS = ["var(--primary)", "var(--plate-small)", "var(--tint-blue-foreground)"];

export function plateFill(index: number) {
  return PLATE_FILLS[index % PLATE_FILLS.length];
}

/** A bar seen from the front, loaded like a real one: the heaviest plates sit closest to the middle. */
export function LoadedBar({ plates, y }: { plates: number; y: number }) {
  return (
    <g fill="var(--plate-bar)">
      <rect x="-2000" y={y - 2} width="4360" height="4" />
      <rect x="116" y={y - 9} width="6" height="18" rx="1.5" />
      <rect x="238" y={y - 9} width="6" height="18" rx="1.5" />
      {PLATE_HEIGHTS.slice(0, plates).flatMap((height, index) => [
        <rect key={`l${index}`} x={103 - index * 13} y={y - height / 2} width="11" height={height} rx="5.5" fill={plateFill(index)} />,
        <rect key={`r${index}`} x={246 + index * 13} y={y - height / 2} width="11" height={height} rx="5.5" fill={plateFill(index)} />,
      ])}
    </g>
  );
}

export function BarbellArt({ plates, className }: { plates: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 360 72"
      className={cn("block h-auto w-full overflow-visible lg:h-24", className)}
      aria-hidden="true"
    >
      <LoadedBar plates={plates} y={36} />
    </svg>
  );
}
