/**
 * Imp-09 domain event catalog (FE contract semantics — no invented business events).
 */

export const EVENT_TYPES = Object.freeze({
  PERIOD_CREATED: 'period.created',
  PERIOD_UPDATED: 'period.updated',
  PERIOD_DELETED: 'period.deleted',
  DECLARATION_SUBMITTED: 'declaration.submitted',
  DECLARATION_UPDATED: 'declaration.updated',
  DECLARATION_APPROVED: 'declaration.approved',
  DECLARATION_REJECTED: 'declaration.rejected',
  DECLARATION_CANCELLED: 'declaration.cancelled',
  QUEUE_CHANGED: 'queue.changed',
  DASHBOARD_CHANGED: 'dashboard.changed',
});

/** Imp-07 producer types (keep as emitted; mapped to catalog in dispatcher). */
export const REVIEW_HOOK_TYPES = Object.freeze({
  DECLARATION_REVIEWED: 'declaration.reviewed',
  DECLARATION_CANCELLED: 'declaration.cancelled',
  PERIOD_REVIEWED: 'period.reviewed',
});
