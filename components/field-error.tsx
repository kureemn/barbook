export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** The props that tie an input to its error message for screen readers. */
export function errorProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": id } : {};
}

/** Moves the cursor to the first problem, once the messages have rendered. */
export function focusFirstError() {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus();
  });
}
