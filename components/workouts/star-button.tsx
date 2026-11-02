"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setStarred } from "@/lib/workouts";

export function StarButton({
  workoutId,
  title,
  initialStarred,
  onChange,
}: {
  workoutId: string;
  title: string;
  initialStarred: boolean;
  onChange?: (starred: boolean) => void;
}) {
  const [starred, setLocalStarred] = useState(initialStarred);
  const [saving, setSaving] = useState(false);

  // Show the change right away, and undo it if the save fails.
  async function toggle() {
    const next = !starred;
    setLocalStarred(next);
    setSaving(true);
    try {
      await setStarred(workoutId, next);
      onChange?.(next);
    } catch {
      setLocalStarred(!next);
      toast.error("Couldn't update that star. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={starred}
      aria-label={`Star ${title}`}
      disabled={saving}
      onClick={toggle}
    >
      <Star
        className={starred ? "size-6 fill-primary text-primary" : "size-6"}
        aria-hidden="true"
      />
    </Button>
  );
}
