export const REST_PRESETS = [90, 120, 180, 300];

/** Works from the end time, so a timer stays right after the phone pauses the page. */
export function secondsLeft(endAt: number, now: number) {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export const DEFAULT_REST = 180;

/** Reads a saved rest length, falling back to the default for anything unexpected. */
export function savedRest(text: string | null) {
  const seconds = Number(text);
  return REST_PRESETS.includes(seconds) ? seconds : DEFAULT_REST;
}
