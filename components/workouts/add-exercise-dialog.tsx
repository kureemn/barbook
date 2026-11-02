"use client";

import { useState } from "react";
import { errorProps, FieldError, focusFirstError } from "@/components/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectClass } from "@/lib/utils";
import { validateExercise } from "@/lib/validation";
import { CATEGORIES, createExercise, type Category, type Exercise } from "@/lib/workouts";

export function AddExerciseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (exercise: Exercise) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("accessory");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const nameError = attempted ? validateExercise({ name }).errors.name : undefined;

  function close() {
    setName("");
    setCategory("accessory");
    setError(null);
    setAttempted(false);
    onClose();
  }

  async function handleAdd() {
    setError(null);
    setAttempted(true);
    const result = validateExercise({ name });
    if (!result.success) {
      focusFirstError();
      return;
    }
    try {
      onCreated(await createExercise(result.data.name, category));
      close();
    } catch {
      setError("Couldn't add that exercise. It may already be on your list.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
          <DialogDescription>It stays on your list for future workouts.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="new-exercise-name">Name</Label>
          <Input
            id="new-exercise-name"
            required
            {...errorProps("new-exercise-name-error", nameError)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldError id="new-exercise-name-error" message={nameError} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-exercise-category">Category</Label>
          <select
            id="new-exercise-category"
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAdd}>
            Add exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
