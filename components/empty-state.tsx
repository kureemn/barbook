import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Fills an empty page with what goes there and how to get started. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-card p-6 lg:p-10">
      <Icon className="size-10 text-primary" aria-hidden="true" />
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="max-w-prose text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
