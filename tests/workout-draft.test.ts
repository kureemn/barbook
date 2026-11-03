import { describe, expect, it } from "vitest";
import { draftKey, parseDraft } from "@/lib/workout-draft";

const NOW = 1_800_000_000_000;
const HOUR = 60 * 60 * 1000;

const draft = (changes = {}) =>
  JSON.stringify({
    savedAt: NOW - HOUR,
    title: "Squat",
    performedOn: "2026-11-02",
    bodyweight: "",
    notes: "",
    groups: [{ key: 0, sets: [{ key: 0, weight: "225" }] }],
    ...changes,
  });

describe("draftKey", () => {
  it("keeps each session, template, and empty workout apart", () => {
    const keys = [
      draftKey({}),
      draftKey({ templateId: "a" }),
      draftKey({ templateId: "b" }),
      draftKey({ program: { runId: "r", week: 1, day: 1 } }),
      draftKey({ program: { runId: "r", week: 1, day: 2 } }),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("parseDraft", () => {
  it("restores a recent draft", () => {
    expect(parseDraft(draft(), NOW)).toMatchObject({ title: "Squat", performedOn: "2026-11-02" });
  });

  it("ignores a draft from more than two days ago", () => {
    expect(parseDraft(draft({ savedAt: NOW - 49 * HOUR }), NOW)).toBeNull();
    expect(parseDraft(draft({ savedAt: NOW - 47 * HOUR }), NOW)).not.toBeNull();
  });

  it.each([
    ["nothing saved", null],
    ["broken JSON", "{oops"],
    ["no groups", draft({ groups: [] })],
    ["a group with no sets", draft({ groups: [{ key: 0, sets: [] }] })],
    ["a missing field", draft({ notes: undefined })],
    ["JSON that isn't a draft", "null"],
  ])("ignores %s", (_name, text) => {
    expect(parseDraft(text, NOW)).toBeNull();
  });
});
