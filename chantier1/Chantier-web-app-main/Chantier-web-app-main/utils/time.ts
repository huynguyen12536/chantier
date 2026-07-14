export function timeToMinutes(time: string): number {
  const { hour, minute } = parseTimeValue(time);
  return Number(hour) * 60 + Number(minute);
}

function minutesToTime(totalMinutes: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, totalMinutes));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return composeTime(String(hour).padStart(2, '0'), String(minute).padStart(2, '0'));
}

/** Earliest valid end time when start is fixed (end cannot be before start). */
export function getMinEndTime(start: string): string {
  return minutesToTime(timeToMinutes(start));
}

/** Recompute end after start changes when it would no longer be after start. */
export function getEndTimeForNewStart(
  newStart: string,
  previousStart: string,
  previousEnd: string,
): string {
  if (timeToMinutes(previousEnd) > timeToMinutes(newStart)) {
    return previousEnd;
  }
  const duration = timeToMinutes(previousEnd) - timeToMinutes(previousStart);
  const slotMinutes = duration > 0 ? duration : 30;
  return minutesToTime(timeToMinutes(newStart) + slotMinutes);
}

/** Latest valid start time when end is fixed (start cannot be after end). */
export function getMaxStartTime(end: string): string {
  return minutesToTime(timeToMinutes(end));
}

export function clampTimeToRange(
  time: string,
  bounds: { minTime?: string; maxTime?: string },
): string {
  let minutes = timeToMinutes(time);
  if (bounds.minTime) {
    minutes = Math.max(minutes, timeToMinutes(bounds.minTime));
  }
  if (bounds.maxTime) {
    minutes = Math.min(minutes, timeToMinutes(bounds.maxTime));
  }
  return minutesToTime(minutes);
}

export function isEndAfterStart(start: string, end: string): boolean {
  return timeToMinutes(end) >= timeToMinutes(start);
}

export function calculateDuration(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return (endMinutes - startMinutes) / 60;
}

export type ChantierHoursBreakdown = {
  heuresNormales: number;
  heuresSupplementaires: number;
  totalHeures: number;
};

/**
 * Heures normales = intersection travail ∩ créneau chantier [début, fin].
 * Heures supp. = uniquement le travail après heure_fin chantier (pas avant le cadre).
 * Sans cadre chantier : repli sur le découpage 7h / au-delà.
 */
export function computeChantierHoursBreakdown(
  workDebut: string,
  workFin: string,
  chantierDebut: string | null | undefined,
  chantierFin: string | null | undefined,
  fallbackNormal = 0,
  fallbackSupp = 0,
): ChantierHoursBreakdown {
  const w0 = timeToMinutes(workDebut);
  const w1 = timeToMinutes(workFin);
  if (w1 <= w0) {
    return { heuresNormales: 0, heuresSupplementaires: 0, totalHeures: 0 };
  }

  const totalHeures = round2((w1 - w0) / 60);

  if (!chantierDebut || !chantierFin) {
    if (fallbackNormal > 0 || fallbackSupp > 0) {
      return {
        heuresNormales: round2(fallbackNormal),
        heuresSupplementaires: round2(fallbackSupp),
        totalHeures,
      };
    }
    const heuresNormales = round2(Math.min(totalHeures, 7));
    const heuresSupplementaires = round2(Math.max(totalHeures - 7, 0));
    return { heuresNormales, heuresSupplementaires, totalHeures };
  }

  const c0 = timeToMinutes(chantierDebut);
  const c1 = timeToMinutes(chantierFin);
  if (c1 <= c0) {
    return {
      heuresNormales: round2(Math.min(totalHeures, 7)),
      heuresSupplementaires: round2(Math.max(totalHeures - 7, 0)),
      totalHeures,
    };
  }

  const normalMinutes = Math.max(0, Math.min(w1, c1) - Math.max(w0, c0));
  const suppMinutes = w1 > c1 ? w1 - Math.max(w0, c1) : 0;

  return {
    heuresNormales: round2(normalMinutes / 60),
    heuresSupplementaires: round2(suppMinutes / 60),
    totalHeures,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Half-open overlap on same calendar day: [start, end) intersect with positive length.
 * Adjacent slots (e.g. 16:30→17:00 and 17:00→18:00) do not overlap.
 */
export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMin = (t: string) => {
    const fmt = formatTime(t);
    const [h, m] = fmt.split(':').map(Number);
    return h * 60 + m;
  };
  const a0 = toMin(startA);
  const a1 = toMin(endA);
  const b0 = toMin(startB);
  const b1 = toMin(endB);
  if (a1 <= a0 || b1 <= b0) return false;
  return a0 < b1 && b0 < a1;
}

export function formatDuration(debut: string, fin: string): string {
  if (!fin) return '0h00';
  const [hDebut, mDebut] = debut.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);
  const totalMinutes = (hFin * 60 + mFin) - (hDebut * 60 + mDebut);
  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${heures}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Display/storage HH:MM from Postgres `time`, optional seconds, or ISO fragments.
 * Does not apply timezone offsets — wall-clock time is kept as stored.
 */
export function formatTime(time: string): string {
  if (!time) return '07:30';
  const raw = String(time).trim();
  const iso = raw.match(/T(\d{1,2}):(\d{2})/);
  if (iso) {
    return `${String(Number(iso[1])).padStart(2, '0')}:${iso[2]}`;
  }
  const plain = raw.match(/^(\d{1,2}):(\d{2})/);
  if (plain) {
    return `${String(Number(plain[1])).padStart(2, '0')}:${plain[2]}`;
  }
  return '07:30';
}

/** Postgres `time` column: HH:MM:SS without timezone. */
export function toDbTimeString(time: string): string {
  const { hour, minute } = parseTimeValue(time);
  return `${hour}:${minute}:00`;
}

export function parseTimeValue(value?: string): { hour: string; minute: string } {
  const formatted = formatTime(value || '07:30');
  const [hourPart, minutePart] = formatted.split(':');
  const hour = String(Math.min(23, Math.max(0, Number(hourPart) || 0))).padStart(2, '0');
  const minute = String(Math.min(59, Math.max(0, Number(minutePart) || 0))).padStart(2, '0');
  return { hour, minute };
}

export function composeTime(hour: string, minute: string): string {
  const h = String(Math.min(23, Math.max(0, Number(hour) || 0))).padStart(2, '0');
  const m = String(Math.min(59, Math.max(0, Number(minute) || 0))).padStart(2, '0');
  return `${h}:${m}`;
}

export function normalizeTimeInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2);
  return `${hour}:${minute}`;
}

export function isValidTimeValue(value: string): boolean {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** Current wall-clock time on the device (local timezone). */
export function getCurrentTimeString(): string {
  const now = new Date();
  return toDbTimeString(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  );
}