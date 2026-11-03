"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { client } from "@/lib/neon/client";
import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { VIEWS, viewFor } from "@/components/workouts/workout-nav";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function SiteHeader() {
  const { data } = client.auth.useSession();
  const router = useRouter();
  const current = viewFor(usePathname());

  async function handleSignOut() {
    await client.auth.signOut();
    toast.success("Logged out.");
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-6 border-b bg-card px-4 sm:px-6">
      <Link
        href={data?.user ? "/workouts" : "/"}
        className="flex min-h-11 items-center gap-2"
      >
        <EquipmentPicture equipment="barbell" className="h-6 w-8 text-primary" />
        <span className="font-heading text-2xl font-bold tracking-wide uppercase">Barbook</span>
      </Link>
      {data?.user && (
        <nav aria-label="Main" className="hidden h-full md:flex">
          {VIEWS.map((view) => {
            const active = view.href === current;
            return (
              <Link
                key={view.href}
                href={view.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center px-3 text-sm font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  active
                    ? "text-foreground shadow-[inset_0_-3px_0_var(--primary)]"
                    : "text-muted-foreground"
                )}
              >
                {view.label}
              </Link>
            );
          })}
        </nav>
      )}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        {data?.user && (
          <>
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {data.user.name || data.user.email}
            </span>
            <Button variant="ghost" className="px-3" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
