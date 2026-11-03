import Link from "next/link";
import { CalendarDays, ChartLine, ClipboardList, History, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { href: "/workouts", label: "Workouts", icon: History },
  { href: "/program", label: "Program", icon: CalendarDays },
  { href: "/workouts/starred", label: "Starred", icon: Star },
  { href: "/dashboard", label: "Dashboard", icon: ChartLine },
  { href: "/templates", label: "Templates", icon: ClipboardList },
];

/** A bottom tab bar on phones, within thumb reach mid-workout. A row of tabs on bigger screens. */
export function WorkoutNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:static sm:mt-4 sm:flex sm:flex-wrap sm:gap-1 sm:border-0 sm:bg-transparent sm:pb-0"
    >
      {VIEWS.map((view) => {
        const active = view.href === current;
        const Icon = view.icon;
        return (
          <Link
            key={view.href}
            href={view.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-11 sm:flex-row sm:gap-2 sm:rounded-md sm:px-3 sm:text-sm",
              active ? "text-foreground sm:bg-secondary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("size-5 sm:size-4", active && "text-primary")} aria-hidden="true" />
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
