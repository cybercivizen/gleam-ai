import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestampToDate(date: Date | string | number): string {
  if (typeof date === "string" || typeof date === "number") {
    date = new Date(date);
  }
  return date
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/(\d+)\/(\d+)\/(\d+),/, "$3-$1-$2");
}
