export type LineStatut = 'draft' | 'attente' | 'validee' | 'rejetee' | 'annulee';

export function declarationLookupKey(chantierId: string, date: string): string {
  return `${chantierId}__${date}`;
}

/** Same resolution as dashboard / timesheet. */
export function resolveLineStatut(
  periodStatut: string,
  chantierId: string,
  date: string,
  declByKey: Map<string, string>,
): LineStatut {
  const decl = declByKey.get(declarationLookupKey(chantierId, date));

  if (decl === 'annulee') return 'annulee';
  if (periodStatut === 'validee' || decl === 'validee') return 'validee';
  if (periodStatut === 'rejetee' || decl === 'rejetee') return 'rejetee';
  if (periodStatut === 'terminee') return 'attente';

  return 'draft';
}

export function getStatusLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    soumise: 'En attente',
    validee: 'Validée',
    rejetee: 'Non approuvée',
    annulee: 'Annulée',
    en_cours: 'En cours',
    terminee: 'Terminée',
  };
  return labels[statut] || statut;
}

export function getStatusStyle(statut: string) {
  const styles: Record<string, any> = {
    brouillon: { backgroundColor: '#E5E5E5' },
    soumise: { backgroundColor: '#FFA726' },
    validee: { backgroundColor: '#66BB6A' },
    rejetee: { backgroundColor: '#EF5350' },
    annulee: { backgroundColor: '#94A3B8' },
    en_cours: { backgroundColor: '#42A5F5' },
    terminee: { backgroundColor: '#FF6B35' },
  };
  return styles[statut] || {};
}