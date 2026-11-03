import { totalSessions, type Program } from "@/lib/programs";

export function ProgramProgress({ logged, program }: { logged: number; program: Program }) {
  const total = totalSessions(program);
  return (
    <div className="mt-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {logged} of {total} sessions logged
      </p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(logged / total) * 100}%` }} />
      </div>
    </div>
  );
}
