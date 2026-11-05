"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Play, Plus } from "lucide-react";
import { PageBand } from "@/components/page-band";
import { BarbellArt } from "@/components/program/barbell-art";
import { PlanVideos } from "@/components/program/plan-videos";
import { Button } from "@/components/ui/button";
import { loadActiveRun, type ProgramRun } from "@/lib/program-runs";
import {
  getProgram,
  nextSession,
  PROGRAMS,
  targetText,
  totalSessions,
} from "@/lib/programs";

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
  side,
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
  /** Beside the card on a large screen, and under it on a phone. */
  side?: ReactNode;
  wideSide?: ReactNode;
  href: string;
  startLabel: string;
  plates: number;
  /** A second way in, under Start workout. */
  action?: ReactNode;
  links: ReactNode;
}) {
  return (
    <section aria-label={label}>
      <PageBand>
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            {eyebrow && <p className="text-sm font-medium">{eyebrow}</p>}
            <h2 className="mt-1 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{title}</h2>
            <p className="mt-1 text-sm">{detail}</p>
            <div className="-mx-4 my-4 overflow-hidden lg:mx-0">
              <BarbellArt plates={plates} />
            </div>
            <Button asChild size="lg" className="h-auto min-h-14 w-full text-base whitespace-normal">
              <Link href={href}>
                <Play className="size-4 fill-current" aria-hidden="true" />
                {startLabel}
              </Link>
            </Button>
            {action}
            <div className="mt-2 flex flex-wrap justify-between gap-x-4">{links}</div>
          </div>
          {side && <div className="mt-6 min-w-0 lg:mt-0">{side}</div>}
          {wideSide && <div className="hidden lg:block">{wideSide}</div>}
        </div>
      </PageBand>
    </section>
  );
}

/** The main button follows the program, so this is the way to log anything else. */
function OwnWorkoutButton() {
  return (
    <>
      <Button
        asChild
        variant="secondary"
        size="lg"
        className="mt-2 min-h-14 w-full bg-background text-base hover:bg-background/80"
      >
        <Link href="/workouts/new">
          <Plus className="size-5 text-primary" aria-hidden="true" />
          Start my own workout
        </Link>
      </Button>
      <p className="mt-2 text-center text-sm">Choose your own exercises, or log a past workout.</p>
    </>
  );
}

function SideList({ heading, rows }: { heading: string; rows: [string, string?][] }) {
  return (
    <>
      <h3 className="text-xl font-bold tracking-tight">{heading}</h3>
      <ul className="mt-3">
        {rows.map(([name, target]) => (
          <li
            key={name}
            className="flex items-baseline justify-between gap-4 border-t border-tint-peach-foreground/15 py-2.5"
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

  if (run === undefined) return <div className="h-72 bg-tint-peach" aria-hidden="true" />;

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
        detail="Start your own workout, or choose a program to follow."
        href="/workouts/new"
        startLabel="Start my own workout"
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
        startLabel="Start my own workout"
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
      detail={`${logged} of ${total} sessions logged.`}
      side={
        <PlanVideos
          rows={session.exercises.map((exercise) => ({
            name: exercise.name,
            target: targetText(exercise),
          }))}
        />
      }
      href={`/workouts/new?week=${session.week}&day=${session.day}`}
      startLabel="Start program workout"
      plates={plates}
      action={<OwnWorkoutButton />}
      links={programLink}
    />
  );
}
