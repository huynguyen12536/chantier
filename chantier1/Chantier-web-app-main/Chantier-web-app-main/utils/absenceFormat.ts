import type { AbsenceMotif } from '@/types';
import type { Translations } from '@/i18n';
import { countAbsenceDays, expandDateRange } from '@/utils/absence';
import { formatDateKey, parseDateKey } from '@/utils/date';

export function getAbsenceReason(commentaire: string | null | undefined): string {
  const value = commentaire?.trim();
  return value || '—';
}

export function getMotifLabel(motif: AbsenceMotif | null | undefined, t: Translations): string {
  if (!motif) return '—';
  return t.absences.motifs[motif] ?? motif;
}

export function formatAbsenceDuration(
  start: string,
  end: string,
  t: Translations,
): string {
  const count = countAbsenceDays(start, end);
  const template = count === 1 ? t.absences.days_one : t.absences.days_other;
  return template.replace('{{count}}', String(count));
}

export function formatAbsencePeriodLabel(
  start: string,
  end: string,
  locale: string,
): string {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  const sameDay = start === end;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (sameDay) {
    return startDate.toLocaleDateString(locale, opts);
  }

  const sameMonth =
    startDate.getFullYear() === endDate.getFullYear()
    && startDate.getMonth() === endDate.getMonth();

  if (sameMonth) {
    const dayStart = startDate.toLocaleDateString(locale, { day: 'numeric' });
    const dayEnd = endDate.toLocaleDateString(locale, opts);
    return `${dayStart} – ${dayEnd}`;
  }

  return `${startDate.toLocaleDateString(locale, opts)} – ${endDate.toLocaleDateString(locale, opts)}`;
}

export function formatAbsenceDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isDateInSelectedRange(
  dateKey: string,
  start?: string | null,
  end?: string | null,
): boolean {
  if (!start || !end) return false;
  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  return dateKey >= rangeStart && dateKey <= rangeEnd;
}

export function mergeRangeDates(start: string, end: string): Set<string> {
  return new Set(expandDateRange(start, end));
}

export function formatDateFieldLabel(dateKey: string, locale: string): string {
  return parseDateKey(dateKey).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function mapAbsenceError(error: unknown, t: Translations): string {
  const record = error as { message?: string; code?: string } | null;
  const message = error instanceof Error ? error.message : record?.message ?? '';
  const code = record?.code ?? '';

  if (message === 'absence_overlap') return t.absences.errors.overlap;
  if (message === 'absence_work_day_conflict') return t.absences.errors.dayHasWorkShift;
  if (message === 'absence_invalid_range') return t.absences.errors.invalidRange;
  if (message === 'absence_reason_required') return t.absences.errors.reasonRequired;
  if (code === 'PGRST205' || message.includes("Could not find the table 'public.absences'")) {
    return t.absences.errors.tableMissing;
  }
  return message || t.absences.errors.saveFailed;
}
