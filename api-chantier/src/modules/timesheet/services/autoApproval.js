/**
 * AutoApprovalPolicyService — replaces auto_approve_if_matches_latest_validated_shift.
 * DR-IMP06-003: validated_by + validated_at required.
 *
 * Also auto-approves periods flagged from_suggestion (day/week habit accept)
 * so suggested shifts do not need chef/admin review.
 */
import * as repo from '../repository.js';
import { syncPeriodsFromDeclaration } from './periodPropagation.js';

function sameShift(a, b) {
  return (
    a.chantier_id === b.chantier_id &&
    String(a.heure_debut).slice(0, 5) === String(b.heure_debut).slice(0, 5) &&
    String(a.heure_fin).slice(0, 5) === String(b.heure_fin).slice(0, 5) &&
    Boolean(a.panier) === Boolean(b.panier) &&
    Boolean(a.deplacement) === Boolean(b.deplacement)
  );
}

async function approveAsSystem(client, declaration) {
  const actorId = repo.SYSTEM_AUTO_APPROVE_ID;
  const updated = await repo.updateDeclarationDecision(
    client,
    declaration.id,
    'validee',
    actorId,
  );
  await syncPeriodsFromDeclaration(client, updated, actorId);
  return updated;
}

/** Day/week suggestion accept: every active period is from_suggestion → auto-validate. */
export async function autoApproveIfFromSuggestion(client, declaration) {
  if (!declaration || declaration.statut !== 'soumise') return declaration;

  const periods = await repo.listPeriodsByKey(
    client,
    declaration.user_id,
    declaration.chantier_id,
    declaration.date,
  );
  const active = periods.filter((p) => p.statut !== 'rejetee' && p.heure_fin);
  if (active.length === 0) return declaration;
  if (!active.every((p) => p.from_suggestion)) return declaration;

  return approveAsSystem(client, declaration);
}

export async function autoApproveIfMatchesLatestValidatedShift(client, declaration) {
  if (!declaration || declaration.statut !== 'soumise') return declaration;

  const periods = await repo.listPeriodsByKey(
    client,
    declaration.user_id,
    declaration.chantier_id,
    declaration.date,
  );
  const active = periods.filter((p) => p.statut !== 'rejetee' && p.heure_fin);
  if (active.length !== 1) return declaration;

  const latest = await repo.findLatestValidatedPeriod(client, declaration.user_id);
  if (!latest || !sameShift(active[0], latest)) return declaration;

  return approveAsSystem(client, declaration);
}
