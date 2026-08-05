import type { Language } from '@/i18n';

/** BCP 47 locale for date labels. French stays the default everywhere. */
export type DateLocale = 'fr-FR' | 'en-GB';

export function dateLocaleFromLanguage(language: Language): DateLocale {
  return language === 'en' ? 'en-GB' : 'fr-FR';
}

export function formatDate(dateStr: string, locale: DateLocale = 'fr-FR'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string, locale: DateLocale = 'fr-FR'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Label like "Lun. 27 mai" (fr) / "Mon 27 May" (en). */
export function formatWeekDayLabel(dateStr: string, locale: DateLocale = 'fr-FR'): string {
  const formatted = parseDateKey(dateStr).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Label like "Lun. 27 mai 2026" (fr) / "Mon 27 May 2026" (en). */
export function formatWeekDayLabelWithYear(dateStr: string, locale: DateLocale = 'fr-FR'): string {
  const formatted = parseDateKey(dateStr).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/** Monday–Sunday date keys for the week containing `dateStr`. */
export function getWeekDateStringsFromDate(dateStr: string): string[] {
  const monday = getMonday(parseDateKey(dateStr));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    dates.push(formatDateKey(d));
  }
  return dates;
}

export function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export function getEndOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(now.setDate(diff));
  sunday.setHours(23, 59, 59, 999);
  return sunday.toISOString().split('T')[0];
}

export function getWeekRange(locale: DateLocale = 'fr-FR'): string {
  const start = new Date(getStartOfWeek());
  const end = new Date(getEndOfWeek());
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`;
}

/** Calendar date in the device local timezone (not UTC). */
export function getTodayString(): string {
  return formatDateKey(new Date());
}

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value?: string): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Shift a YYYY-MM-DD key by `delta` calendar days. */
export function addDaysToDateKey(dateKey: string, delta: number): string {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + delta);
  return formatDateKey(next);
}

/** Calendar key `YYYY-MM-DD` from Postgres `date`, ISO datetime, or route param. */
export function normalizeDateKey(value?: string | null): string {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  const head = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return head ? head[1] : raw;
}

/** Weekday initials Sun→Sat for calendar / week strip cells. */
export function weekdayInitials(locale: DateLocale = 'fr-FR'): string[] {
  if (locale.startsWith('en')) return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
}
