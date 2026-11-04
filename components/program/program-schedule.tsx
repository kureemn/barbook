import Link from "next/link";
import { Check } from "lucide-react";
import { programSession, scheduleCell, targetText, type LoggedKey, type Program } from "@/lib/programs";
import { cn } from "@/lib/utils";

/** The whole program as one table: a row per week, a column per day. */
export function ProgramSchedule({ program, logged }: { program: Program; logged: LoggedKey[] }) {
  const weeks = Array.from({ length: program.weeks }, (_, index) => index + 1);
  const days = program.days.map((_, index) => index + 1);
  const cell = "border-t px-1 py-1.5 align-middle sm:px-2";
  // Targets change by week, so show the week the lifter is on.
  const currentWeek = weeks.find((week) =>
    days.some((day) => scheduleCell(program, week, day, logged).state === "next")
  );
  const shownWeek = currentWeek ?? 1;

  return (
    <>
      <table className="mt-3 w-full table-fixed text-sm">
        <thead>
          <tr>
            <td className="w-16 sm:w-40 lg:w-64" />
            {program.days.map((plan) => (
              <th key={plan.name} scope="col" className="px-1 pb-2 text-left align-bottom font-semibold sm:px-2 sm:text-base">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week}>
              <th scope="row" className={cn(cell, "text-left font-medium whitespace-nowrap sm:whitespace-normal")}>
                Week {week}
                {week === program.deloadWeek && (
                  <span className="block text-xs font-normal text-muted-foreground">Deload</span>
                )}
                <span className="hidden text-xs font-normal text-muted-foreground tabular-nums sm:block">
                  {program.weekSummary(week)}
                </span>
              </th>
              {days.map((day) => {
                const { state, href, label } = scheduleCell(program, week, day, logged);
                return (
                  <td key={day} className={cell}>
                    <Link
                      href={href}
                      aria-label={label}
                      className="flex min-h-11 items-center rounded-md px-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-2"
                    >
                      {state === "done" && <Check className="size-5" aria-hidden="true" />}
                      {state === "next" && (
                        <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          Next
                        </span>
                      )}
                      {state === "upcoming" && <span className="text-muted-foreground">Day {day}</span>}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="hidden md:table-row">
            <th scope="row" className={cn(cell, "pt-3 text-left align-top font-medium")}>
              In each day
              <span className="block text-xs font-normal text-muted-foreground">Week {shownWeek} targets</span>
            </th>
            {days.map((day) => (
              <td key={day} className={cn(cell, "pt-3 align-top")}>
                <ul className="flex flex-col gap-2 px-1 sm:px-2">
                  {programSession(program, shownWeek, day).exercises.map((exercise) => (
                    <li key={exercise.name}>
                      {exercise.name}
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {targetText(exercise)}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <ul className="mt-3 md:hidden">
        {days.map((day) => {
          const { name, exercises } = programSession(program, shownWeek, day);
          return (
            <li key={day} className="border-t py-2.5 text-sm">
              <span className="font-medium">
                Day {day}: {name}
              </span>
              <span className="block text-muted-foreground">
                {exercises.map((exercise) => exercise.name).join(", ")}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
