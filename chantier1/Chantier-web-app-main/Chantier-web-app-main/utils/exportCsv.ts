import { computeChantierHoursBreakdown } from '@/utils/time';

export type ExportHoursBreakdown = {
  heuresLam: number;
  heuresLamThem: number;
  tongGio: number;
};

/** @deprecated Préférer computeChantierHoursBreakdown depuis @/utils/time */
export function computeExportHoursBreakdown(
  workDebut: string,
  workFin: string,
  chantierDebut: string | null | undefined,
  chantierFin: string | null | undefined,
  fallbackNormal: number,
  fallbackSupp: number,
): ExportHoursBreakdown {
  const { heuresNormales, heuresSupplementaires, totalHeures } = computeChantierHoursBreakdown(
    workDebut,
    workFin,
    chantierDebut,
    chantierFin,
    fallbackNormal,
    fallbackSupp,
  );
  return {
    heuresLam: heuresNormales,
    heuresLamThem: heuresSupplementaires,
    tongGio: totalHeures,
  };
}

export { computeChantierHoursBreakdown } from '@/utils/time';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCsvNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
