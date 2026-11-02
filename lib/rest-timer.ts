export const REST_PRESETS = [90, 120, 180, 300];

/** Works from the end time, so a timer stays right after the phone pauses the page. */
export function secondsLeft(endAt: number, now: number) {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
