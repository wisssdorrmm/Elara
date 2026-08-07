import { differenceInYears, differenceInMonths, differenceInDays, differenceInCalendarDays, addYears, addMonths, startOfDay } from 'date-fns';

export interface RelationshipDuration {
  years: number;
  months: number;
  days: number;
}

export function getRelationshipDuration(startedAt: string, today: Date = new Date()): RelationshipDuration {
  const start = startOfDay(new Date(startedAt));
  const normalizedToday = startOfDay(today);

  const years = Math.max(differenceInYears(normalizedToday, start), 0);
  const afterYears = addYears(start, years);
  const months = Math.max(differenceInMonths(normalizedToday, afterYears), 0);
  const afterMonths = addMonths(afterYears, months);
  const days = Math.max(differenceInDays(normalizedToday, afterMonths), 0);

  return { years, months, days };
}

export function formatRelationshipDuration(startedAt: string, today: Date = new Date()): string {
  const { years, months, days } = getRelationshipDuration(startedAt, today);
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Month${months !== 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

/** Days until the next occurrence of an annual date (anniversary or birthday), always >= 0. */
export function daysUntilNextAnnualDate(dateStr: string | null, today: Date = new Date()): number | null {
  if (!dateStr) return null;
  const source = new Date(dateStr);
  const normalizedToday = startOfDay(today);

  let next = new Date(normalizedToday.getFullYear(), source.getMonth(), source.getDate());
  if (startOfDay(next) < normalizedToday) {
    next = new Date(normalizedToday.getFullYear() + 1, source.getMonth(), source.getDate());
  }
  return differenceInCalendarDays(next, normalizedToday);
}
