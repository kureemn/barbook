import { describe, expect, it } from "vitest";
import { formatTime, secondsLeft } from "@/lib/rest-timer";

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
