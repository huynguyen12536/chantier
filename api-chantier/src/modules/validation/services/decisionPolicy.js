/**
 * DecisionPolicy — allowed transitions and review roles (application layer).
 * CVL: Flow E + SUMMARY #8/#11/#15. Return maps to rejetee (no distinct statut).
 */

export const REVIEWER_ROLES = Object.freeze(['admin', 'administratif', 'chef_equipe']);

/** action → { to, fromAllowed, auditAction, propagate, deletePeriods } */
export const DECLARATION_ACTIONS = Object.freeze({
  approve: {
    to: 'validee',
    fromAllowed: ['soumise'],
    auditAction: 'approve',
    propagate: true,
    deletePeriods: false,
  },
  reject: {
    to: 'rejetee',
    fromAllowed: ['soumise'],
    auditAction: 'reject',
    propagate: true,
    deletePeriods: false,
  },
  return: {
    to: 'rejetee',
    fromAllowed: ['soumise'],
    auditAction: 'return',
    propagate: true,
    deletePeriods: false,
  },
  cancel: {
    to: 'annulee',
    fromAllowed: ['soumise', 'validee'],
    auditAction: 'cancel',
    propagate: false,
    deletePeriods: true,
  },
});

export const PERIOD_DECISION_STATUTS = Object.freeze(['validee', 'rejetee']);
export const PERIOD_DECIDABLE_FROM = Object.freeze(['terminee', 'en_cours']);

export function isReviewerRole(role) {
  return REVIEWER_ROLES.includes(role);
}

export function getDeclarationAction(action) {
  return DECLARATION_ACTIONS[action] ?? null;
}

export function canPeriodDecideFrom(statut) {
  return PERIOD_DECIDABLE_FROM.includes(statut);
}
