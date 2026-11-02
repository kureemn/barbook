import { describe, expect, it } from "vitest";
import {
  lastTopSet,
  suggestionsForTemplate,
  suggestWeight,
  type HistorySet,
} from "@/lib/suggestions";

const TODAY = "2026-11-02";

function set(weight: number, reps: number, rpe: number | null, overrides: Partial<HistorySet> = {}): HistorySet {
  return {
    exercise_id: "squat",
    weight,
    reps,
    rpe,
    performed_on: "2026-10-26",
    created_at: "2026-10-26T10:00:00Z",
    ...overrides,
  };
}

describe("suggestWeight", () => {
  // The two examples in PLAN.md.
  it("suggests 305 after 300x5 at RPE 8, for a target of 5 at RPE 8", () => {
    expect(suggestWeight(set(300, 5, 8), 5, 8)).toBe(305);
  });

  it("suggests 290 after 300x5 at RPE 9, for a target of 5 at RPE 8", () => {
    expect(suggestWeight(set(300, 5, 9), 5, 8)).toBe(290);
  });

  it("treats a missing RPE on the last set as 10", () => {
    expect(suggestWeight(set(300, 5, null), 5, 8)).toBe(suggestWeight(set(300, 5, 10), 5, 8));
  });

  it("rounds to the nearest 5 lb", () => {
    // 245 x (1 + 10/30) / (1 + 7/30) = 264.9
    expect(suggestWeight(set(245, 8, 8), 5, 8)).toBe(265);
  });

  it("aims for the same effort as last time when there's no target RPE", () => {
    expect(suggestWeight(set(300, 5, 8), 5, null)).toBe(305);
  });

  it("adds 5 lb when the set was easier and the estimate doesn't go up", () => {
    // 100 x (1 + 5/30) at RPE 10 only supports 100 again for a target of RPE 10.
    expect(suggestWeight(set(100, 5, 10), 5, 10)).toBe(105);
  });

  it("doesn't add 5 lb when the last set was harder than the target", () => {
    expect(suggestWeight(set(300, 5, 10), 5, 8)).toBeLessThan(300);
  });

  it("handles numbers the database returns as text", () => {
    const text = (value: string) => value as unknown as number;
    expect(suggestWeight({ weight: text("300.00"), reps: 5, rpe: text("8.0") }, 5, text("8.0"))).toBe(305);
  });

  it("gives no suggestion after a set with no weight", () => {
    expect(suggestWeight(set(0, 10, 8), 5, 8)).toBeNull();
  });
});

describe("lastTopSet", () => {
  it("uses the most recent date, even if an older set was heavier", () => {
    const top = lastTopSet(
      [set(400, 1, 10, { performed_on: "2026-10-01" }), set(300, 5, 8)],
      "squat",
      TODAY
    );
    expect(top?.weight).toBe(300);
  });

  it("takes the heaviest set from that workout", () => {
    expect(lastTopSet([set(225, 8, 6), set(245, 8, 8), set(235, 8, 7)], "squat", TODAY)?.weight).toBe(245);
  });

  it("uses the later workout when two share a date", () => {
    const top = lastTopSet(
      [set(400, 5, 8), set(300, 5, 8, { created_at: "2026-10-26T18:00:00Z" })],
      "squat",
      TODAY
    );
    expect(top?.weight).toBe(300);
  });

  it("settles a tie on weight by the lower estimate", () => {
    expect(lastTopSet([set(300, 5, 7), set(300, 5, 9), set(300, 5, 8)], "squat", TODAY)?.rpe).toBe(9);
  });

  it("ignores other exercises and future dates", () => {
    const sets = [
      set(500, 5, 8, { exercise_id: "bench" }),
      set(500, 5, 8, { performed_on: "2026-11-20" }),
    ];
    expect(lastTopSet(sets, "squat", TODAY)).toBeNull();
  });
});

describe("suggestionsForTemplate", () => {
  const history = [set(300, 5, 8)];

  it("shows the set each suggestion came from", () => {
    const suggestions = suggestionsForTemplate(
      [{ id: "row", exercise_id: "squat", target_reps: 5, target_rpe: 8 }],
      history,
      TODAY
    );
    expect(suggestions.row.weight).toBe(305);
    expect(suggestions.row.basedOn).toEqual(history[0]);
  });

  it("gives no suggestion with no history", () => {
    const suggestions = suggestionsForTemplate(
      [{ id: "row", exercise_id: "bench", target_reps: 5, target_rpe: 8 }],
      history,
      TODAY
    );
    expect(suggestions).toEqual({});
  });

  it("works out the same exercise separately for different targets", () => {
    const suggestions = suggestionsForTemplate(
      [
        { id: "heavy", exercise_id: "squat", target_reps: 3, target_rpe: 8 },
        { id: "light", exercise_id: "squat", target_reps: 10, target_rpe: 7 },
      ],
      history,
      TODAY
    );
    expect(suggestions.heavy.weight).toBeGreaterThan(suggestions.light.weight);
  });
});
