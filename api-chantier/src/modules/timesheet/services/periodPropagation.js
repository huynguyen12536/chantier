/**
 * PeriodPropagationService — replaces sync_periods_from_declaration.
 */
import * as repo from '../repository.js';

export async function syncPeriodsFromDeclaration(client, declaration, actorId) {
  if (!['validee', 'rejetee'].includes(declaration.statut)) {
    return [];
  }
  return repo.propagatePeriodsStatut(
    client,
    declaration.user_id,
    declaration.chantier_id,
    declaration.date,
    declaration.statut,
    actorId,
  );
}
