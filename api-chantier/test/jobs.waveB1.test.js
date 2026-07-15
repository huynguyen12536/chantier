/**
 * Imp-10 Wave B1 Milestone 1 — JB-01 handler + registry unit tests.
 * Does NOT cover dispatcher write-failure→enqueue (Milestone 2).
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import {
  startJobs,
  stopJobs,
  enqueueJob,
  getJobsStatus,
  JOB_REALTIME_REDISPATCH_CATALOG,
  JOB_PLATFORM_NOOP,
  __test,
} from '../src/modules/jobs/index.js';
import { handler as realtimeRedispatchHandler } from '../src/modules/jobs/handlers/realtimeRedispatch.js';
import { clearClients } from '../src/modules/realtime/sseRegistry.js';

describe('Imp-10 Wave B1 JB-01 realtime redispatch (Milestone 1)', () => {
  beforeEach(() => {
    env.jobsEnabled = true;
    stopJobs();
    __test.clearQueue();
    clearClients();
    startJobs();
  });

  afterEach(() => {
    env.jobsEnabled = true;
    stopJobs();
    __test.clearQueue();
    clearClients();
  });

  it('registers jobs.realtime.redispatch_catalog as builtin', () => {
    const types = getJobsStatus().types;
    assert.ok(types.includes(JOB_REALTIME_REDISPATCH_CATALOG));
    assert.ok(types.includes(JOB_PLATFORM_NOOP));
  });

  it('handler invokes Imp-09 dispatchCatalogEvent (no clients → delivered 0)', async () => {
    const result = await realtimeRedispatchHandler({
      correlationId: 'corr-m1',
      job: {
        id: 'j1',
        attempt: 1,
        idempotencyKey: 'key-1',
        payload: {
          catalogEvent: {
            type: 'declaration.updated',
            entityId: 'd-1',
            chantierId: 'c-1',
          },
        },
      },
    });

    assert.ok(result);
    assert.ok(result.id != null);
    assert.equal(result.delivered, 0);
  });

  it('handler rejects missing catalogEvent', async () => {
    await assert.rejects(
      () => realtimeRedispatchHandler({ job: { payload: {} } }),
      (err) => err.code === 'JOBS_INVALID_PAYLOAD',
    );
  });

  it('handler rejects catalogEvent without type', async () => {
    await assert.rejects(
      () =>
        realtimeRedispatchHandler({
          job: { payload: { catalogEvent: { entityId: 'x' } } },
        }),
      (err) => err.code === 'JOBS_INVALID_PAYLOAD',
    );
  });

  it('enqueues and completes JB-01 via in-process runner', async () => {
    const key = `redispatch-m1-${Date.now()}`;
    const res = enqueueJob({
      type: JOB_REALTIME_REDISPATCH_CATALOG,
      idempotencyKey: key,
      payload: {
        catalogEvent: {
          type: 'queue.changed',
          chantierId: 'c-m1',
          source: 'test',
        },
      },
    });
    assert.equal(res.accepted, true);
    assert.equal(res.duplicate, false);

    await __test.drain();
    assert.equal(__test.hasCompletedKey(key), true);
    assert.equal(__test.hasReservedKey(key), false);
  });

  it('duplicate JB-01 idempotencyKey after COMPLETED is rejected', async () => {
    const key = `redispatch-dup-${Date.now()}`;
    enqueueJob({
      type: JOB_REALTIME_REDISPATCH_CATALOG,
      idempotencyKey: key,
      payload: { catalogEvent: { type: 'dashboard.changed' } },
    });
    await __test.drain();

    const second = enqueueJob({
      type: JOB_REALTIME_REDISPATCH_CATALOG,
      idempotencyKey: key,
      payload: { catalogEvent: { type: 'dashboard.changed' } },
    });
    assert.equal(second.duplicate, true);
  });
});
