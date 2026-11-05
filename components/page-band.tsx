import type { ReactNode } from "react";

/** The full-width color a page opens on, so the app feels like the landing page. */
export function PageBand({ children }: { children: ReactNode }) {
  return (
    <div className="bg-tint-peach text-tint-peach-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
