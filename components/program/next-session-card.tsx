"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BarbellArt } from "@/components/program/barbell-art";
import { Button } from "@/components/ui/button";
import { loadActiveRun, type ProgramRun } from "@/lib/program-runs";
import { DAYS, DELOAD_WEEK, nextSession, PROGRAM_NAME, WEEKS } from "@/lib/programs";

const SURFACE = "mt-0 overflow-hidden rounded-xl bg-foreground text-background sm:mt-6";
const PLATES_WITHOUT_PROGRAM = 3;

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-background/60"
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
  href,
  plates,
  links,
}: {
  label: string;
  eyebrow?: string;
  title: string;
  detail: string;
  href: string;
  plates: number;
  links: ReactNode;
}) {
  return (
    <section aria-label={label} className={SURFACE}>
      <div className="-mx-6 pt-5">
        <BarbellArt plates={plates} />
      </div>
      <div className="p-5 pt-4 sm:p-6 sm:pt-5">
        {eyebrow && <p className="text-sm font-semibold tracking-wider uppercase opacity-70">{eyebrow}</p>}
        <h2 className="mt-1 text-6xl leading-[0.9] font-bold tracking-wide uppercase sm:text-7xl">
          {title}
        </h2>
        <p className="mt-3 text-sm opacity-70">{detail}</p>
        <Button
          asChild
          size="lg"
          className="mt-5 h-16 w-full font-heading text-2xl font-bold tracking-wide uppercase focus-visible:ring-background/60"
        >
          <Link href={href}>
            <Play className="size-5 fill-current" aria-hidden="true" />
            Start workout
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4">{links}</div>
      </div>
    </section>
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
