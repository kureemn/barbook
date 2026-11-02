"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { client } from "@/lib/neon/client";
import { Button } from "@/components/ui/button";
import { Dumbbell, LogOut } from "lucide-react";
import { toast } from "sonner";

export function SiteHeader() {
  const { data } = client.auth.useSession();
  const router = useRouter();

  async function handleSignOut() {
    await client.auth.signOut();
    toast.success("Logged out.");
    router.replace("/");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <Link
        href={data?.user ? "/workouts" : "/"}
        className="flex min-h-11 items-center gap-2 font-semibold"
      >
        <Dumbbell className="size-5 text-primary" aria-hidden="true" />
        <span>Barbook</span>
      </Link>
      {data?.user && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {data.user.name || data.user.email}
          </span>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
