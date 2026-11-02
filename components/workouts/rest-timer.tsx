"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime, REST_PRESETS, secondsLeft } from "@/lib/rest-timer";

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

export function RestTimer() {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finished, setFinished] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  // A locked phone pauses the page, so keep the screen on while the timer runs.
  // Not every browser allows this, and the timer still works without it.
  async function keepScreenOn() {
    try {
      wakeLock.current = (await navigator.wakeLock?.request("screen")) ?? null;
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
      setFinished(true);
      letScreenSleep();
      if (audio.current) beep(audio.current);
      navigator.vibrate?.([300, 150, 300, 150, 300]);
    }

    // Coming back to the app catches up right away, and the screen lock needs renewing.
    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      tick();
      if (currentTime() < end) void keepScreenOn();
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

  function start(seconds: number) {
    try {
      audio.current ??= new AudioContext();
      audio.current.resume().catch(() => {});
    } catch {
      audio.current = null;
    }
    const current = currentTime();
    setNow(current);
    setEndAt(current + seconds * 1000);
    setFinished(false);
    void keepScreenOn();
  }

  function stop() {
    setEndAt(null);
    letScreenSleep();
  }

  const running = endAt !== null;

  return (
    <section
      aria-label="Rest timer"
      className={`sticky bottom-0 z-10 -mx-4 mt-6 border-t px-4 py-3 ${
        finished ? "bg-primary text-primary-foreground" : "bg-card"
      }`}
    >
      {/* Announces the end only, not every second. */}
      <p role="status" className={finished ? "mb-2 font-semibold" : "sr-only"}>
        {finished ? "Rest over. Time for your next set." : ""}
      </p>
      {running ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums">
            <span className="sr-only">Rest time left: </span>
            {formatTime(secondsLeft(endAt, now))}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              aria-label="Add 30 seconds"
              onClick={() => setEndAt(endAt + 30_000)}
            >
              <Plus className="size-4" aria-hidden="true" />
              30s
            </Button>
            <Button type="button" variant="outline" onClick={stop}>
              <Square className="size-4" aria-hidden="true" />
              Stop
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="shrink-0 text-sm font-medium">Rest</p>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {REST_PRESETS.map((seconds) => (
              <Button
                key={seconds}
                type="button"
                variant="outline"
                className="px-1 tabular-nums text-foreground"
                aria-label={`Start ${formatTime(seconds)} rest`}
                onClick={() => start(seconds)}
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
