import { ChevronDown } from "lucide-react";
import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { EQUIPMENT_NAMES, exerciseInfo, MUSCLE_NAMES, type ExerciseInfo } from "@/lib/exercise-info";

/**
 * What an exercise trains and what it needs. Shows nothing for one the lifter added.
 * Collapsed, it stays out of the way of the sets until tapped.
 */
export function ExerciseDetails({
  name,
  collapsed = false,
}: {
  name: string | undefined;
  collapsed?: boolean;
}) {
  const info = exerciseInfo(name);
  if (!info) return null;

  if (collapsed) {
    return (
      <details className="group rounded-md bg-muted/60">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            {info.main.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
            <span className="text-muted-foreground">
              {" · "}
              {info.equipment.map((equipment) => EQUIPMENT_NAMES[equipment]).join(", ")}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-3 pb-3">
          <Details info={info} />
        </div>
      </details>
    );
  }

  return (
    <div className="rounded-md bg-muted/60 p-3">
      <Details info={info} />
    </div>
  );
}

function Details({ info }: { info: ExerciseInfo }) {
  return (
    <div className="flex gap-4">
      <MuscleMap info={info} />
      <div className="flex min-w-0 flex-col gap-3 text-sm">
        <dl className="flex flex-col gap-1">
          <div>
            <dt className="inline font-medium">
              <span
                className="mr-1.5 inline-block size-2.5 rounded-full bg-(--muscle-main)"
                aria-hidden="true"
              />
              Main:{" "}
            </dt>
            <dd className="inline">{info.main.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}</dd>
          </div>
          {info.also.length > 0 && (
            <div>
              <dt className="inline font-medium">
                <span
                  className="mr-1.5 inline-block size-2.5 rounded-full bg-(--muscle-also)"
                  aria-hidden="true"
                />
                Also:{" "}
              </dt>
              <dd className="inline text-muted-foreground">
                {info.also.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
              </dd>
            </div>
          )}
        </dl>
        <ul aria-label="Equipment" className="flex flex-wrap gap-3">
          {info.equipment.map((equipment) => (
            <li key={equipment} className="flex flex-col items-center gap-1 text-xs">
              <EquipmentPicture equipment={equipment} />
              {EQUIPMENT_NAMES[equipment]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
