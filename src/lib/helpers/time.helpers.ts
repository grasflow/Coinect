/**
 * Pomocnicze funkcje do konwersji czasu
 */

/**
 * Konwertuje całkowitą liczbę godzin na godziny i minuty
 * @param totalHours - Całkowita liczba godzin (np. 8.5)
 * @returns Obiekt z osobnymi wartościami godzin i minut
 */
export function hoursToHoursAndMinutes(totalHours: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return { hours, minutes };
}

/**
 * Konwertuje godziny i minuty na całkowitą liczbę godzin
 * @param hours - Liczba godzin
 * @param minutes - Liczba minut
 * @returns Całkowita liczba godzin jako liczba dziesiętna
 */
export function hoursAndMinutesToHours(hours: number, minutes: number): number {
  return hours + minutes / 60;
}

/**
 * Formatuje liczbę godzin do wyświetlenia (np. 8.5h lub 8h 30m)
 * @param totalHours - Całkowita liczba godzin
 * @param format - Format wyświetlania: 'decimal' | 'detailed'
 * @returns Sformatowany string
 */
export function formatHours(totalHours: number, format: "decimal" | "detailed" = "decimal"): string {
  if (format === "decimal") {
    return `${totalHours.toFixed(2)}h`;
  }

  const { hours, minutes } = hoursToHoursAndMinutes(totalHours);
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
