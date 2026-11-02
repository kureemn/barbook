import Link from "next/link";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { href: "/workouts", label: "All" },
  { href: "/workouts/starred", label: "Starred" },
  { href: "/dashboard", label: "Dashboard" },
];

export function WorkoutNav({ current }: { current: string }) {
  return (
    <nav aria-label="Workout views" className="mt-4 flex gap-2">
      {VIEWS.map((view) => (
        <Button key={view.href} asChild variant={view.href === current ? "secondary" : "ghost"}>
          <Link href={view.href} aria-current={view.href === current ? "page" : undefined}>
            {view.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
