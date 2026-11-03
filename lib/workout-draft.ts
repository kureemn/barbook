const PREFIX = "barbook-draft:";
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type WorkoutDraft<Group> = {
  title: string;
  performedOn: string;
  bodyweight: string;
  notes: string;
  groups: Group[];
};

/** One draft per thing being logged, so two different sessions can't overwrite each other. */
export function draftKey(source: {
  program?: { runId: string; week: number; day: number };
  templateId?: string;
}) {
  if (source.program) {
    const { runId, week, day } = source.program;
    return `${PREFIX}program:${runId}:${week}:${day}`;
  }
  return source.templateId ? `${PREFIX}template:${source.templateId}` : `${PREFIX}new`;
}

/** Reads a saved draft. Anything damaged or too old to still be the same session is ignored. */
export function parseDraft<Group>(text: string | null, now: number): WorkoutDraft<Group> | null {
  if (!text) return null;
  try {
    const draft = JSON.parse(text);
    const usable =
      typeof draft.savedAt === "number" &&
      now - draft.savedAt < MAX_AGE_MS &&
      typeof draft.title === "string" &&
      typeof draft.performedOn === "string" &&
      typeof draft.bodyweight === "string" &&
      typeof draft.notes === "string" &&
      Array.isArray(draft.groups) &&
      draft.groups.length > 0 &&
      draft.groups.every(
        (group: { sets?: unknown }) => Array.isArray(group.sets) && group.sets.length > 0
      );
    if (!usable) return null;
    const { title, performedOn, bodyweight, notes, groups } = draft;
    return { title, performedOn, bodyweight, notes, groups };
  } catch {
    return null;
  }
}

// Saving a draft is a safety net, so blocked storage just means there isn't one.
export function readDraft<Group>(key: string) {
  try {
    return parseDraft<Group>(localStorage.getItem(key), Date.now());
  } catch {
    return null;
  }
}

export function writeDraft<Group>(key: string, draft: WorkoutDraft<Group>) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // See above.
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // See above.
  }
}

/** Logging out removes drafts, so the next person on this phone can't see them. */
export function clearAllDrafts() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // See above.
  }
}
