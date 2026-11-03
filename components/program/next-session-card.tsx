"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BarbellArt } from "@/components/program/barbell-art";
import { Button } from "@/components/ui/button";
import { loadActiveRun, type ProgramRun } from "@/lib/program-runs";
import { DAYS, DELOAD_WEEK, nextSession, PROGRAM_NAME, WEEKS } from "@/lib/programs";
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
  plates,
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
  plates: number;
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
              Start workout
            </Link>
          </Button>
          <div className="mt-2 flex flex-wrap justify-between gap-x-4">{links}</div>
        </div>
        {wideSide && <div className="hidden lg:block">{wideSide}</div>}
      </div>
    </section>
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
        detail={`Start an empty workout, or follow the ${PROGRAM_NAME}.`}
        href="/workouts/new"
        plates={PLATES_WITHOUT_PROGRAM}
        wideSide={
          <SideList
            heading="The 6-week block"
            rows={[
              ["4 days a week"],
              ["Squat, bench, deadlift, and a second bench day"],
              ["Reps drop and effort climbs through week 5"],
              ["Week 6 is a lighter deload"],
            ]}
          />
        }
        links={programLink}
      />
    );
  }

  const logged = run.program_sessions.length;
  // One plate goes on for each finished week, so the bar fills as the program does.
  const plates = Math.floor(logged / DAYS);
  const session = nextSession(run.program_sessions);

  if (!session) {
    return (
      <Hero
        label="Start training"
        title="Program finished"
        detail={`You've logged every session of the ${PROGRAM_NAME}. Nice work.`}
        href="/workouts/new"
        plates={plates}
        links={programLink}
      />
    );
  }

  return (
    <Hero
      label="Your next session"
      eyebrow={`Up next · Week ${session.week}, Day ${session.day}${session.week === DELOAD_WEEK ? " · Deload" : ""}`}
      title={session.name}
      detail={`${session.exercises.map((exercise) => exercise.name).join(", ")}. ${logged} of ${WEEKS * DAYS} sessions logged.`}
      wideDetail={`${logged} of ${WEEKS * DAYS} sessions logged.`}
      wideSide={
        <SideList
          heading="Today's plan"
          rows={session.exercises.map((exercise) => [
            exercise.name,
            `${exercise.sets} × ${exercise.reps} @ RPE ${exercise.rpe}`,
          ])}
        />
      }
      href={`/workouts/new?week=${session.week}&day=${session.day}`}
      plates={plates}
      links={
        <>
          {programLink}
          <HeroLink href="/workouts/new">Log a different workout</HeroLink>
        </>
      }
    />
  );
}
