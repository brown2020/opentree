/**
 * Formats a Date as a YYYY-MM-DD string using local timezone (not UTC).
 * This avoids the off-by-one day bug caused by Date.toISOString() using UTC.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
