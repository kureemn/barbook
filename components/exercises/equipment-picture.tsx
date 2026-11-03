import type { ReactNode } from "react";
import type { Equipment } from "@/lib/exercise-info";

// Drawn for Barbook on a 64 × 48 canvas. Lines use the stroke, weights use the fill.
const PICTURES: Record<Equipment, ReactNode> = {
  barbell: (
    <>
      <path d="M2 24H62" />
      <rect x="9" y="8" width="5" height="32" rx="1.5" className="fill-current" />
      <rect x="16" y="13" width="4" height="22" rx="1.5" className="fill-current" />
      <rect x="50" y="8" width="5" height="32" rx="1.5" className="fill-current" />
      <rect x="44" y="13" width="4" height="22" rx="1.5" className="fill-current" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M22 24H42" strokeWidth="4" />
      <path d="M8 16L14 12H20V36H14L8 32Z" className="fill-current" />
      <path d="M56 16L50 12H44V36H50L56 32Z" className="fill-current" />
    </>
  ),
  bench: (
    <>
      <rect x="6" y="17" width="52" height="7" rx="3" className="fill-current" />
      <path d="M16 24V40M48 24V40M9 40H23M41 40H55" />
    </>
  ),
  rack: (
    <>
      <path d="M18 4V44M46 4V44M10 44H26M38 44H54M18 8H46" />
      <path d="M18 20H23V16M46 20H41V16" />
      <path d="M4 15H60" />
      <rect x="7" y="8" width="4" height="14" rx="1.5" className="fill-current" />
      <rect x="53" y="8" width="4" height="14" rx="1.5" className="fill-current" />
    </>
  ),
  cable: (
    <>
      <path d="M12 4V44M26 4V44M6 44H32M12 4H52" />
      <circle cx="52" cy="8" r="3" />
      <path d="M52 11V28" strokeWidth="1.5" />
      <path d="M44 29H60" strokeWidth="4" />
      <rect x="15" y="24" width="8" height="4" className="fill-current" stroke="none" />
      <rect x="15" y="30" width="8" height="4" className="fill-current" stroke="none" />
      <rect x="15" y="36" width="8" height="4" className="fill-current" stroke="none" />
    </>
  ),
  machine: (
    <>
      <path d="M6 44H58M46 4V44M58 4V44M46 4H58" />
      <rect x="49" y="22" width="6" height="4" className="fill-current" stroke="none" />
      <rect x="49" y="28" width="6" height="4" className="fill-current" stroke="none" />
      <rect x="49" y="34" width="6" height="4" className="fill-current" stroke="none" />
      <rect x="10" y="28" width="22" height="6" rx="3" className="fill-current" />
      <rect x="8" y="9" width="6" height="19" rx="3" className="fill-current" />
      <path d="M22 34V44M32 18H46" />
    </>
  ),
  pullUpBar: (
    <>
      <path d="M12 12V44M52 12V44M6 44H18M46 44H58" />
      <path d="M3 12H61" strokeWidth="4" />
    </>
  ),
  dipBars: (
    <>
      <path d="M16 18V44M48 18V44M8 44H24M40 44H56" />
      <path d="M6 18H26M38 18H58" strokeWidth="4" />
    </>
  ),
};

export function EquipmentPicture({
  equipment,
  className = "h-9 w-12 text-foreground",
}: {
  equipment: Equipment;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PICTURES[equipment]}
    </svg>
  );
}
