/**
 * Imp-10 Wave B1 Milestone 2 — writeEvent failure → enqueue JB-01.
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import {
  startJobs,
  stopJobs,
  enqueueJob,
  getJobsStatus,
  JOB_REALTIME_REDISPATCH_CATALOG,
  __test,
} from '../src/modules/jobs/index.js';
import {
  dispatchCatalogEvent,
  bindJobsEnqueueApi,
  unbindJobsEnqueueApi,
} from '../src/modules/realtime/dispatcher.js';
import * as dispatcher from '../src/modules/realtime/dispatcher.js';
import * as sseRegistry from '../src/modules/realtime/sseRegistry.js';
import { EVENT_TYPES } from '../src/modules/realtime/eventTypes.js';

function okRes() {
  return {
    write() {
      return true;
    },
    end() {},
    writableEnded: false,
  };
}

/** Causes real writeEvent to catch and return false (removeClient). */
function failRes() {
  return {
    write() {
      throw new Error('simulated sse write failure');
    },
    end() {},
    writableEnded: false,
  };
}

function addAdminClient(res = okRes()) {
  return sseRegistry.addClient(res, { id: `u-admin-${Math.random()}`, role: 'admin' }, null, null);
}

describe('Imp-10 Wave B1 Milestone 2 — failure→enqueue hook', () => {
  beforeEach(() => {
    env.jobsEnabled = true;
    stopJobs();
    __test.clearQueue();
    sseRegistry.clearClients();
    sseRegistry.resetEventIdForTests();
    startJobs();
    __test.stopRunner();
  });

  afterEach(() => {
    mock.restoreAll();
    env.jobsEnabled = true;
    stopJobs();
    __test.clearQueue();
    sseRegistry.clearClients();
  });

  it('writeEvent success → no enqueue', () => {
    addAdminClient(okRes());

    const { id } = dispatchCatalogEvent({
      type: EVENT_TYPES.QUEUE_CHANGED,
      chantierId: 'c-ok',
      source: 'test',
    });

    assert.equal(__test.hasReservedKey(`jobs.realtime.redispatch_catalog:${id}`), false);
    assert.equal(getJobsStatus().queue.pending, 0);
  });

  it('writeEvent failure → enqueue exactly once (multi-client)', () => {
    addAdminClient(failRes());
    addAdminClient(failRes());

    const { id, delivered } = dispatchCatalogEvent({
      type: EVENT_TYPES.DECLARATION_UPDATED,
      entityId: 'd-1',
      userId: 'u-1',
      chantierId: 'c-1',
      statut: 'soumise',
      actorId: 'a-1',
      action: 'update',
      source: 'domain',
    });

    assert.equal(delivered, 0);
    assert.equal(getJobsStatus().queue.pending, 1);
    assert.equal(__test.hasReservedKey(`jobs.realtime.redispatch_catalog:${id}`), true);
  });

  it('enqueue payload correctness', async () => {
    addAdminClient(failRes());

    const { id } = dispatchCatalogEvent({
      type: EVENT_TYPES.DASHBOARD_CHANGED,
      entityId: 'e-9',
      userId: 'u-9',
      chantierId: 'c-9',
      statut: 'validee',
      actorId: 'act',
      action: 'approve',
      source: 'imp07',
    });

    assert.equal(getJobsStatus().queue.pending, 1);
    const key = `jobs.realtime.redispatch_catalog:${id}`;
    let captured = null;

    __test.clearRegistry();
    __test.registerJob(JOB_REALTIME_REDISPATCH_CATALOG, {
      handler: async ({ job }) => {
        captured = job.payload;
      },
    });
    bindJobsEnqueueApi({
      enqueueJob,
      JOB_REALTIME_REDISPATCH_CATALOG,
    });
    __test.startRunner();
    await __test.drain();

    assert.ok(captured?.catalogEvent);
    assert.equal(captured.catalogEvent.type, EVENT_TYPES.DASHBOARD_CHANGED);
    assert.equal(captured.catalogEvent.entityId, 'e-9');
    assert.equal(captured.catalogEvent.userId, 'u-9');
    assert.equal(captured.catalogEvent.chantierId, 'c-9');
    assert.equal(captured.catalogEvent.statut, 'validee');
    assert.equal(captured.catalogEvent.actorId, 'act');
    assert.equal(captured.catalogEvent.action, 'approve');
    assert.equal(captured.catalogEvent.source, 'imp07');
    assert.equal(captured.catalogEvent._skipRedispatchEnqueue, true);
    assert.equal(__test.hasCompletedKey(key), true);
  });

  it('runner executes JB-01; handler calls dispatchCatalogEvent once', async () => {
    addAdminClient(failRes());

    const { id } = dispatchCatalogEvent({
      type: EVENT_TYPES.QUEUE_CHANGED,
      chantierId: 'c-run',
      source: 'test',
    });
    assert.equal(getJobsStatus().queue.pending, 1);

    let dispatchCalls = 0;
    __test.clearRegistry();
    __test.registerJob(JOB_REALTIME_REDISPATCH_CATALOG, {
      handler: async ({ job }) => {
        const catalogEvent = job?.payload?.catalogEvent;
        dispatchCalls += 1;
        assert.equal(catalogEvent._skipRedispatchEnqueue, true);
        return dispatcher.dispatchCatalogEvent(catalogEvent);
      },
    });
    bindJobsEnqueueApi({
      enqueueJob,
      JOB_REALTIME_REDISPATCH_CATALOG,
    });

    addAdminClient(okRes());
    __test.startRunner();
    await __test.drain();

    assert.equal(dispatchCalls, 1);
    assert.equal(__test.hasCompletedKey(`jobs.realtime.redispatch_catalog:${id}`), true);
  });

  it('duplicate enqueue prevented by idempotencyKey', () => {
    addAdminClient(failRes());
    addAdminClient(failRes());

    const { id } = dispatchCatalogEvent({
      type: EVENT_TYPES.PERIOD_UPDATED,
      chantierId: 'c-dup',
    });
    const key = `jobs.realtime.redispatch_catalog:${id}`;
    assert.equal(__test.hasReservedKey(key), true);
    assert.equal(getJobsStatus().queue.pending, 1);

    const second = enqueueJob({
      type: JOB_REALTIME_REDISPATCH_CATALOG,
      idempotencyKey: key,
      payload: {
        catalogEvent: {
          type: EVENT_TYPES.PERIOD_UPDATED,
          _skipRedispatchEnqueue: true,
        },
      },
    });
    assert.equal(second.duplicate, true);
    assert.equal(getJobsStatus().queue.pending, 1);
  });

  it('_skipRedispatchEnqueue prevents re-enqueue storm on JB-01 path', () => {
    addAdminClient(failRes());

    const { id } = dispatchCatalogEvent({
      type: EVENT_TYPES.QUEUE_CHANGED,
      chantierId: 'c-skip',
      _skipRedispatchEnqueue: true,
    });

    assert.equal(getJobsStatus().queue.pending, 0);
    assert.equal(__test.hasReservedKey(`jobs.realtime.redispatch_catalog:${id}`), false);
  });

  it('unbind leaves failure path quiet (no jobs API)', () => {
    unbindJobsEnqueueApi();
    addAdminClient(failRes());

    dispatchCatalogEvent({
      type: EVENT_TYPES.QUEUE_CHANGED,
      chantierId: 'c-unbound',
    });
    assert.equal(getJobsStatus().queue.pending, 0);
  });
});
