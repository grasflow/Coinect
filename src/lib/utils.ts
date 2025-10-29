import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatuje czas w godzinach do formatu czytelnego dla człowieka "27h 31m"
 * @param hours - liczba godzin w formacie dziesiętnym
 * @returns sformatowany ciąg znaków
 */
export function formatHoursToHumanReadable(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  if (displayHours === 0) {
    return `${displayMinutes}m`;
  } else if (displayMinutes === 0) {
    return `${displayHours}h`;
  } else {
    return `${displayHours}h ${displayMinutes}m`;
  }
}
