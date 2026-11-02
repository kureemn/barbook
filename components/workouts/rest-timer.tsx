"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime, REST_PRESETS, savedRest, secondsLeft } from "@/lib/rest-timer";
import { cn, selectClass } from "@/lib/utils";

const STORAGE_KEY = "barbook-rest-seconds";

/** Three short beeps. Browsers only allow sound set up from a tap, so start() creates the context. */
function beep(audio: AudioContext) {
  for (const delay of [0, 0.35, 0.7]) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.3;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + delay);
    oscillator.stop(audio.currentTime + delay + 0.2);
  }
}

const currentTime = () => Date.now();

function loadRest() {
  try {
    return savedRest(localStorage.getItem(STORAGE_KEY));
  } catch {
    return savedRest(null);
  }
}

/** One timer for the whole form, so starting from a new set replaces the last rest. */
export function useRestTimer() {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finishedSet, setFinishedSet] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(loadRest);
  const [activeSet, setActiveSet] = useState<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  // A locked phone pauses the page, so keep the screen on while the timer runs.
  // Not every browser allows this, and the timer still works without it.
  async function keepScreenOn() {
    try {
      wakeLock.current ??= (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLock.current = null;
    }
  }

  function letScreenSleep() {
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  }

  useEffect(() => {
    if (endAt === null) return;
    const end = endAt;

    function tick() {
      const current = currentTime();
      setNow(current);
      if (current < end) return;
      setEndAt(null);
      setActiveSet(null);
      setFinishedSet(activeSet);
      letScreenSleep();
      if (audio.current) beep(audio.current);
      navigator.vibrate?.([300, 150, 300, 150, 300]);
    }

    // Coming back to the app catches up right away, and the screen lock needs renewing.
    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      tick();
      if (currentTime() < end) {
        wakeLock.current = null;
        void keepScreenOn();
      }
    }

    const interval = setInterval(tick, 250);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [endAt, activeSet]);

  useEffect(
    () => () => {
      letScreenSleep();
      audio.current?.close().catch(() => {});
    },
    []
  );

  function start(setKey: number) {
    try {
      audio.current ??= new AudioContext();
      audio.current.resume().catch(() => {});
    } catch {
      audio.current = null;
    }
    const current = currentTime();
    setNow(current);
    setEndAt(current + restSeconds * 1000);
    setActiveSet(setKey);
    setFinishedSet(null);
    void keepScreenOn();
  }

  function stop() {
    setEndAt(null);
    setActiveSet(null);
    letScreenSleep();
  }

  /** A removed set can't show its timer anymore, so its rest ends with it. */
  function releaseSet(setKey: number) {
    if (activeSet === setKey) stop();
    if (finishedSet === setKey) setFinishedSet(null);
  }

  function addThirtySeconds() {
    setEndAt((current) => (current === null ? null : current + 30_000));
  }

  function chooseRest(seconds: number) {
    setRestSeconds(seconds);
    try {
      localStorage.setItem(STORAGE_KEY, String(seconds));
    } catch {
      // Remembering the choice is only a convenience.
    }
  }

  return {
    running: endAt !== null,
    timeLeft: endAt === null ? 0 : secondsLeft(endAt, now),
    finishedSet,
    restSeconds,
    activeSet,
    start,
    stop,
    releaseSet,
    addThirtySeconds,
    chooseRest,
  };
}

export type RestTimerState = ReturnType<typeof useRestTimer>;

/** Sits under a set: starts the rest, then shows its countdown and the alert. */
export function SetRest({
  timer,
  setKey,
  setNumber,
}: {
  timer: RestTimerState;
  setKey: number;
  setNumber: number;
}) {
  if (timer.activeSet === setKey) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold tabular-nums">
          <span className="sr-only">Rest time left: </span>
          {formatTime(timer.timeLeft)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            aria-label="Add 30 seconds"
            onClick={timer.addThirtySeconds}
          >
            <Plus className="size-4" aria-hidden="true" />
            30s
          </Button>
          <Button type="button" variant="outline" onClick={timer.stop}>
            <Square className="size-4" aria-hidden="true" />
            Stop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {timer.finishedSet === setKey && (
        <p className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">
          Rest over. Time for your next set.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          aria-label={`Start ${formatTime(timer.restSeconds)} rest after set ${setNumber}`}
          onClick={() => timer.start(setKey)}
        >
          <Timer className="size-4" aria-hidden="true" />
          Rest
        </Button>
        <select
          aria-label={`Rest length for set ${setNumber}`}
          className={cn(selectClass, "w-24 tabular-nums")}
          value={timer.restSeconds}
          onChange={(e) => timer.chooseRest(Number(e.target.value))}
        >
          {REST_PRESETS.map((seconds) => (
            <option key={seconds} value={seconds}>
              {formatTime(seconds)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Tells screen readers when a rest ends, without reading out every second. */
export function RestAnnouncement({ timer }: { timer: RestTimerState }) {
  return (
    <p role="status" className="sr-only">
      {timer.finishedSet !== null ? "Rest over. Time for your next set." : ""}
    </p>
  );
}
