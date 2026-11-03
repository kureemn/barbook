import { MuscleMap } from "@/components/exercises/muscle-map";
import type { MuscleCount } from "@/lib/progress";

/** Working sets per muscle: the body shows the pattern, and the list gives the numbers. */
export function MuscleBalance({ muscles, uncounted }: { muscles: MuscleCount[]; uncounted: number }) {
  const most = muscles[0]?.sets ?? 0;
  const worked = muscles.filter((item) => item.sets > 0);
  const main = worked.filter((item) => item.sets >= most / 2).map((item) => item.muscle);
  const also = worked.filter((item) => item.sets < most / 2).map((item) => item.muscle);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <MuscleMap
          info={{ main, also, equipment: [] }}
          description="Body diagram of the muscles trained in the last 30 days. The numbers are in the list beside it."
        />
        <ul aria-hidden="true" className="flex flex-col gap-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-(--muscle-main)" />
            Most sets
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-(--muscle-also)" />
            Fewer sets
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-(--muscle-rest)" />
            None
          </li>
        </ul>
      </div>
      <div className="min-w-0 flex-1">
        <ul className="grid gap-x-8 gap-y-2 lg:grid-cols-2">
          {muscles.map((item) => (
            <li key={item.muscle} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-sm">
              <span>{item.name}</span>
              <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: most > 0 ? `${(item.sets / most) * 100}%` : 0 }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{item.sets}</span>
            </li>
          ))}
        </ul>
        {uncounted > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {uncounted} {uncounted === 1 ? "set" : "sets"} from exercises you added aren&apos;t counted,
            since the app doesn&apos;t know what they train.
          </p>
        )}
      </div>
    </div>
  );
}
