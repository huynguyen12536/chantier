/**
 * DeclarationSyncService — replaces trigger_sync_declarations / sync_declarations_from_periods.
 * DR-IMP06-001 Soft Annulee · DR-IMP06-003 omit nb_deplacements write.
 */
import { synthesizeDay } from '../domain/calculation.js';
import * as repo from '../repository.js';

export async function syncDeclarationsFromPeriods(client, userId, chantierId, date, actorId) {
  const periods = await repo.listPeriodsByKey(client, userId, chantierId, date);
  const active = periods.filter((p) => p.statut !== 'rejetee');

  if (active.length === 0) {
    return repo.softAnnuleeDeclaration(client, userId, chantierId, date, actorId);
  }

  const chantier = await repo.getChantier(client, chantierId);
  const synth = synthesizeDay(active, chantier);
  return repo.upsertDeclarationSoumise(client, {
    user_id: userId,
    chantier_id: chantierId,
    date,
    ...synth,
  });
}
