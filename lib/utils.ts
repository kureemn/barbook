import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The shared width for main pages. The workout form stays narrower, for easy logging. */
export const PAGE_CLASS = "mx-auto w-full max-w-[100rem] flex-1 px-4 py-8 lg:px-8";

export const selectClass =
  "h-11 w-full rounded-md border border-input bg-card px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/40";
