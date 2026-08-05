import { useMemo } from 'react';
import { computeChantierHoursBreakdown } from '@/utils/time';

interface PeriodData {
  heure_debut: string;
  heure_fin: string | null;
  panier_repas?: boolean;
  deplacement?: boolean;
  chantier_heure_debut?: string | null;
  chantier_heure_fin?: string | null;
}

interface TimeCalculations {
  totalHeures: number;
  heuresNormales: number;
  heuresSupp: number;
  nbPaniers: number;
  nbDeplacements: number;
}

export function useTimeCalculations(periods: PeriodData[]): TimeCalculations {
  return useMemo(() => {
    let totalHeures = 0;
    let heuresNormales = 0;
    let heuresSupp = 0;
    let nbPaniers = 0;
    let nbDeplacements = 0;

    periods.forEach((period) => {
      if (!period.heure_debut || !period.heure_fin) return;

      const breakdown = computeChantierHoursBreakdown(
        period.heure_debut,
        period.heure_fin,
        period.chantier_heure_debut,
        period.chantier_heure_fin,
      );

      totalHeures += breakdown.totalHeures;
      heuresNormales += breakdown.heuresNormales;
      heuresSupp += breakdown.heuresSupplementaires;

      if (period.panier_repas) nbPaniers++;
      if (period.deplacement) nbDeplacements++;
    });

    return {
      totalHeures: Math.round(totalHeures * 100) / 100,
      heuresNormales: Math.round(heuresNormales * 100) / 100,
      heuresSupp: Math.round(heuresSupp * 100) / 100,
      nbPaniers,
      nbDeplacements,
    };
  }, [periods]);
}
