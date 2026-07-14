/**
 * Unit tests — Imp-07 DecisionPolicy (no DB).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDeclarationAction,
  isReviewerRole,
  canPeriodDecideFrom,
  DECLARATION_ACTIONS,
} from '../src/modules/validation/services/decisionPolicy.js';
import { subscribe, clearSubscribers, emitReviewEvent } from '../src/modules/validation/services/notificationHooks.js';

describe('Imp-07 DecisionPolicy units', () => {
  it('maps approve/reject/return/cancel transitions', () => {
    assert.equal(getDeclarationAction('approve').to, 'validee');
    assert.equal(getDeclarationAction('reject').to, 'rejetee');
    assert.equal(getDeclarationAction('return').to, 'rejetee');
    assert.equal(getDeclarationAction('return').auditAction, 'return');
    assert.equal(getDeclarationAction('cancel').to, 'annulee');
    assert.deepEqual(getDeclarationAction('cancel').fromAllowed, ['soumise', 'validee']);
    assert.equal(getDeclarationAction('cancel').deletePeriods, true);
    assert.equal(DECLARATION_ACTIONS.approve.propagate, true);
  });

  it('reviewer roles and period decidable from', () => {
    assert.equal(isReviewerRole('chef_equipe'), true);
    assert.equal(isReviewerRole('ouvrier'), false);
    assert.equal(canPeriodDecideFrom('terminee'), true);
    assert.equal(canPeriodDecideFrom('validee'), false);
  });

  it('notification hooks fire subscribers without throw', () => {
    clearSubscribers();
    const seen = [];
    subscribe((e) => seen.push(e.type));
    subscribe(() => {
      throw new Error('handler boom');
    });
    emitReviewEvent({ type: 'declaration.reviewed', entityId: 'x', statut: 'validee', actorId: 'a' });
    assert.deepEqual(seen, ['declaration.reviewed']);
    clearSubscribers();
  });
});
