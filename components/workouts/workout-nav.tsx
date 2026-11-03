import Link from "next/link";
import { CalendarDays, ChartLine, ClipboardList, History, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const VIEWS = [
  { href: "/workouts", label: "Workouts", icon: History },
  { href: "/program", label: "Program", icon: CalendarDays },
  { href: "/workouts/starred", label: "Starred", icon: Star },
  { href: "/dashboard", label: "Dashboard", icon: ChartLine },
  { href: "/templates", label: "Templates", icon: ClipboardList },
];

/** Which tab a page belongs to, so a workout's own page still lights up Workouts. */
export function viewFor(pathname: string) {
  if (pathname.startsWith("/workouts/starred")) return "/workouts/starred";
  return VIEWS.find((view) => pathname.startsWith(view.href))?.href;
}

/** The bottom tab bar on phones, within thumb reach. Bigger screens use the top bar's tabs. */
export function WorkoutNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
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
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("size-5", active && "text-primary")} aria-hidden="true" />
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
