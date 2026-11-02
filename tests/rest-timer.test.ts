import { describe, expect, it } from "vitest";
import { DEFAULT_REST, formatTime, savedRest, secondsLeft } from "@/lib/rest-timer";

describe("secondsLeft", () => {
  it("counts down from the end time", () => {
    expect(secondsLeft(90_000, 0)).toBe(90);
    expect(secondsLeft(90_000, 30_000)).toBe(60);
  });

  it("rounds a partial second up, so 0:00 only shows at the end", () => {
    expect(secondsLeft(90_000, 89_500)).toBe(1);
  });

  it("is correct after the page was paused past the end", () => {
    expect(secondsLeft(90_000, 500_000)).toBe(0);
  });
});

describe("formatTime", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(300)).toBe("5:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(0)).toBe("0:00");
  });
});

describe("savedRest", () => {
  it("uses a saved preset", () => {
    expect(savedRest("120")).toBe(120);
  });

  it("falls back to the default for nothing saved or an unknown value", () => {
    expect(savedRest(null)).toBe(DEFAULT_REST);
    expect(savedRest("7")).toBe(DEFAULT_REST);
    expect(savedRest("abc")).toBe(DEFAULT_REST);
  });
});
