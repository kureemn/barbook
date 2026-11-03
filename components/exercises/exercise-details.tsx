import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { EQUIPMENT_NAMES, exerciseInfo, MUSCLE_NAMES } from "@/lib/exercise-info";

/** What an exercise trains and what it needs. Shows nothing for one the lifter added. */
export function ExerciseDetails({ name }: { name: string | undefined }) {
  const info = exerciseInfo(name);
  if (!info) return null;

  return (
    <div className="flex gap-4 rounded-md bg-muted/60 p-3">
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
