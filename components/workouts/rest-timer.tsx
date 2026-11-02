"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime, REST_PRESETS, savedRest, secondsLeft } from "@/lib/rest-timer";

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
  const [finished, setFinished] = useState(false);
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
      setFinished(true);
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
  }, [endAt]);

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
    setFinished(false);
    void keepScreenOn();
  }

  function stop() {
    setEndAt(null);
    setActiveSet(null);
    letScreenSleep();
  }

  function addThirtySeconds() {
    setEndAt((current) => (current === null ? null : current + 30_000));
  }

  function chooseRest(seconds: number) {
    setRestSeconds(seconds);
    setFinished(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(seconds));
    } catch {
      // Remembering the choice is only a convenience.
    }
  }

  return {
    running: endAt !== null,
    timeLeft: endAt === null ? 0 : secondsLeft(endAt, now),
    finished,
    restSeconds,
    activeSet,
    start,
    stop,
    addThirtySeconds,
    chooseRest,
  };
}

export type RestTimerState = ReturnType<typeof useRestTimer>;

/** Sits under a set: starts the rest, then shows its countdown. */
export function SetRestButton({
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
      <p className="flex min-h-11 items-center gap-2 text-sm font-medium tabular-nums">
        <Timer className="size-4" aria-hidden="true" />
        Resting: {formatTime(timer.timeLeft)}
      </p>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full tabular-nums"
      aria-label={`Start ${formatTime(timer.restSeconds)} rest after set ${setNumber}`}
      onClick={() => timer.start(setKey)}
    >
      <Timer className="size-4" aria-hidden="true" />
      Rest {formatTime(timer.restSeconds)}
    </Button>
  );
}

/** Stays on screen while scrolling: the time left, or the choice of rest length. */
export function RestTimerBar({ timer }: { timer: RestTimerState }) {
  return (
    <section
      aria-label="Rest timer"
      className={`sticky bottom-0 z-10 -mx-4 mt-6 border-t px-4 py-3 ${
        timer.finished ? "bg-primary text-primary-foreground" : "bg-card"
      }`}
    >
      {/* Announces the end only, not every second. */}
      <p role="status" className={timer.finished ? "mb-2 font-semibold" : "sr-only"}>
        {timer.finished ? "Rest over. Time for your next set." : ""}
      </p>
      {timer.running ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums">
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
      ) : (
        <div className="flex items-center gap-3">
          <p id="rest-length" className="shrink-0 text-sm font-medium">
            Rest
          </p>
          <div role="group" aria-labelledby="rest-length" className="grid flex-1 grid-cols-4 gap-2">
            {REST_PRESETS.map((seconds) => (
              <Button
                key={seconds}
                type="button"
                variant={seconds === timer.restSeconds ? "secondary" : "outline"}
                className="px-1 tabular-nums text-foreground"
                aria-pressed={seconds === timer.restSeconds}
                onClick={() => timer.chooseRest(seconds)}
              >
                {formatTime(seconds)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
