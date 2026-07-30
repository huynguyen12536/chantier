/**
 * DeclarationSyncService — replaces trigger_sync_declarations / sync_declarations_from_periods.
 * DR-IMP06-001 Soft Annulee · DR-IMP06-003 omit nb_deplacements write.
 */
import { AppError } from '../../../shared/errors/AppError.js';
import { synthesizeDay } from '../domain/calculation.js';
import * as repo from '../repository.js';

const NB_PANIERS_MIN = 0;
const NB_PANIERS_MAX = 2;

function assertNbPaniersInRange(nbPaniers) {
  if (nbPaniers < NB_PANIERS_MIN || nbPaniers > NB_PANIERS_MAX) {
    throw new AppError(
      `nb_paniers must be between ${NB_PANIERS_MIN} and ${NB_PANIERS_MAX}`,
      400,
      {
        code: 'VALIDATION_ERROR',
        details: { nb_paniers: nbPaniers, min: NB_PANIERS_MIN, max: NB_PANIERS_MAX },
      },
    );
  }
}

export async function syncDeclarationsFromPeriods(client, userId, chantierId, date, actorId) {
  const periods = await repo.listPeriodsByKey(client, userId, chantierId, date);
  const active = periods.filter((p) => p.statut !== 'rejetee');

  if (active.length === 0) {
    return repo.softAnnuleeDeclaration(client, userId, chantierId, date, actorId);
  }

  const chantier = await repo.getChantier(client, chantierId);
  const synth = synthesizeDay(active, chantier);
  assertNbPaniersInRange(synth.nb_paniers);
  return repo.upsertDeclarationSoumise(client, {
    user_id: userId,
    chantier_id: chantierId,
    date,
    company_id: chantier.company_id,
    ...synth,
  });
}
