import { ChevronDown, ListChecks, ShieldCheck } from "lucide-react";
import type { ExerciseCues } from "@/lib/exercise-cues";

/** Closed at first, so the sets stay near the top of the screen. */
export function FormCues({ cues }: { cues: ExerciseCues }) {
  return (
    <details className="group rounded-xl bg-tint-peach text-tint-peach-foreground">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ListChecks className="size-4" aria-hidden="true" />
          Form cues
        </span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-3 text-sm">
        <p><span className="font-semibold">Setup:</span> {cues.setup}</p>
        <p><span className="font-semibold">Brace:</span> {cues.brace}</p>
        <p><span className="font-semibold">Move:</span> {cues.move}</p>
        <p className="flex gap-2 rounded-lg bg-background p-2.5 text-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold">Stay safe:</span> {cues.safety} Stop if you feel sharp pain.
          </span>
        </p>
        <p className="text-xs">
          General cues, not coaching or medical advice. Technique is based on{" "}
          <a
            href={`https://www.strengthlog.com/${cues.source}/`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            StrengthLog&apos;s guide
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          . Safety notes are Barbook&apos;s.
        </p>
      </div>
    </details>
  );
}
