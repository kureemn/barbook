"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Play, Plus } from "lucide-react";
import { BarbellArt } from "@/components/program/barbell-art";
import { Button } from "@/components/ui/button";
import { loadActiveRun, type ProgramRun } from "@/lib/program-runs";
import {
  getProgram,
  nextSession,
  PROGRAMS,
  targetText,
  totalSessions,
} from "@/lib/programs";
import { cn } from "@/lib/utils";

const SURFACE = "overflow-hidden rounded-xl bg-primary text-primary-foreground";
const PLATES_WITHOUT_PROGRAM = 3;

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-foreground/60"
    >
      {children}
    </Link>
  );
}

function Hero({
  label,
  eyebrow,
  title,
  detail,
  wideDetail,
  wideSide,
  href,
  startLabel,
  plates,
  action,
  links,
}: {
  label: string;
  eyebrow?: string;
  title: string;
  detail: string;
  /** Replaces the detail on a large screen, when the side panel already covers it. */
  wideDetail?: string;
  wideSide?: ReactNode;
  href: string;
  startLabel: string;
  plates: number;
  /** A second way in, under Start workout. */
  action?: ReactNode;
  links: ReactNode;
}) {
  return (
    <section aria-label={label} className={SURFACE}>
      <div className="-mx-6 pt-5">
        <BarbellArt plates={plates} />
      </div>
      <div className="p-5 pt-4 sm:p-6 sm:pt-5 lg:grid lg:grid-cols-2 lg:gap-12 lg:p-8 lg:pt-6">
        <div>
          {eyebrow && <p className="text-sm font-semibold tracking-wider uppercase">{eyebrow}</p>}
          <h2 className="mt-1 text-6xl leading-[0.9] font-bold tracking-wide uppercase sm:text-7xl lg:text-8xl">
            {title}
          </h2>
          <p className={cn("mt-3 text-sm", wideDetail && "lg:hidden")}>{detail}</p>
          {wideDetail && <p className="mt-3 hidden text-sm lg:block">{wideDetail}</p>}
          <Button
            asChild
            size="lg"
            className="mt-5 h-16 w-full bg-foreground font-heading text-2xl font-bold tracking-wide text-background uppercase hover:bg-foreground/85"
          >
            <Link href={href}>
              <Play className="size-5 fill-current" aria-hidden="true" />
              {startLabel}
            </Link>
          </Button>
          {action}
          <div className="mt-2 flex flex-wrap justify-between gap-x-4">{links}</div>
        </div>
        {wideSide && <div className="hidden lg:block">{wideSide}</div>}
      </div>
    </section>
  );
}

/** The main button follows the program, so this is the way to log anything else. */
function EmptyWorkoutButton() {
  return (
    <>
      <Button
        asChild
        variant="outline"
        size="lg"
        className="mt-2 w-full border-primary-foreground bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground dark:border-primary-foreground dark:bg-transparent dark:hover:bg-primary-foreground/15"
      >
        <Link href="/workouts/new">
          <Plus className="size-5" aria-hidden="true" />
          Start empty workout
        </Link>
      </Button>
      <p className="mt-2 text-sm">Choose your own exercises, or log a past workout.</p>
    </>
  );
}

function SideList({ heading, rows }: { heading: string; rows: [string, string?][] }) {
  return (
    <>
      <h3 className="font-heading text-2xl font-bold tracking-wide uppercase">{heading}</h3>
      <ul className="mt-3">
        {rows.map(([name, target]) => (
          <li
            key={name}
            className="flex items-baseline justify-between gap-4 border-t border-primary-foreground/30 py-2.5"
          >
            <span className="font-medium">{name}</span>
            {target && <span className="shrink-0 text-sm tabular-nums">{target}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function NextSessionCard() {
  // undefined while loading, null when the lifter isn't on a program.
  const [run, setRun] = useState<ProgramRun | null | undefined>(undefined);

  useEffect(() => {
    // Program info is extra here, so a failure just falls back to an empty workout.
    loadActiveRun()
      .then(setRun)
      .catch(() => setRun(null));
  }, []);

  if (run === undefined) return <div className={`${SURFACE} h-96`} aria-hidden="true" />;

  const programLink = (
    <HeroLink href="/program">
      {run ? "See program" : "View program"}
      <ArrowRight className="size-4" aria-hidden="true" />
    </HeroLink>
  );

  if (!run) {
    return (
      <Hero
        label="Start training"
        title="Ready to lift?"
        detail="Start an empty workout, or choose a program to follow."
        href="/workouts/new"
        startLabel="Start empty workout"
        plates={PLATES_WITHOUT_PROGRAM}
        wideSide={
          <SideList
            heading="Choose a program"
            rows={PROGRAMS.map((program) => [program.name, program.focus])}
          />
        }
        links={programLink}
      />
    );
  }

  const program = getProgram(run.program_key);
  const logged = run.program_sessions.length;
  const total = totalSessions(program);
  // One plate goes on for each finished week, so the bar fills as the program does.
  const plates = Math.floor(logged / program.days.length);
  const session = nextSession(program, run.program_sessions);

  if (!session) {
    return (
      <Hero
        label="Start training"
        title="Program finished"
        detail={`You've logged every session of ${program.name}. Nice work.`}
        href="/workouts/new"
        startLabel="Start empty workout"
        plates={plates}
        links={
          <HeroLink href="/program">
            Choose your next program
            <ArrowRight className="size-4" aria-hidden="true" />
          </HeroLink>
        }
      />
    );
  }

  return (
    <Hero
      label="Your next session"
      eyebrow={`${program.name} · Week ${session.week}, Day ${session.day}${session.week === program.deloadWeek ? " · Deload" : ""}`}
      title={session.name}
      detail={`${session.exercises.map((exercise) => exercise.name).join(", ")}. ${logged} of ${total} sessions logged.`}
      wideDetail={`${logged} of ${total} sessions logged.`}
      wideSide={
        <SideList
          heading="Today's plan"
          rows={session.exercises.map((exercise) => [
            exercise.name,
            targetText(exercise),
          ])}
        />
      }
      href={`/workouts/new?week=${session.week}&day=${session.day}`}
      startLabel={`Start Day ${session.day}`}
      plates={plates}
      action={<EmptyWorkoutButton />}
      links={programLink}
    />
  );
}
