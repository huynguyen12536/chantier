/**
 * Imp-10 Wave A — job platform (unit / module tests; no server wiring yet).
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  startJobs,
  stopJobs,
  enqueueJob,
  getJobsStatus,
  JOB_PLATFORM_NOOP,
  __test,
} from '../src/modules/jobs/index.js';

describe('Imp-10 Wave A jobs platform', () => {
  beforeEach(() => {
    stopJobs();
    __test.clearQueue();
    startJobs();
  });

  afterEach(() => {
    stopJobs();
    __test.clearQueue();
  });

  it('enqueues and completes platform_noop', async () => {
    const key = `noop-${Date.now()}`;
    const res = enqueueJob({
      type: JOB_PLATFORM_NOOP,
      idempotencyKey: key,
      payload: {},
    });
    assert.equal(res.accepted, true);
    assert.equal(res.duplicate, false);
    assert.ok(res.jobId);

    await __test.drain();
    assert.equal(__test.hasCompletedKey(key), true);
    assert.equal(getJobsStatus().queue.pending, 0);
  });

  it('idempotent duplicate enqueue does not run twice', async () => {
    const key = `dup-${Date.now()}`;
    const first = enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    await __test.drain();
    assert.equal(__test.hasCompletedKey(key), true);

    const second = enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    assert.equal(second.duplicate, true);
    assert.equal(second.accepted, true);
    assert.equal(getJobsStatus().queue.pending, 0);
  });

  it('retries then succeeds', async () => {
    const key = `retry-${Date.now()}`;
    let calls = 0;
    __test.registerJob('jobs.test_flaky', {
      handler: async () => {
        calls += 1;
        if (calls < 2) {
          throw new Error('transient');
        }
      },
      maxAttempts: 3,
    });

    enqueueJob({ type: 'jobs.test_flaky', idempotencyKey: key });
    await __test.drain(20);
    assert.equal(calls, 2);
    assert.equal(__test.hasCompletedKey(key), true);
  });

  it('exhausts retries then marks dead', async () => {
    const key = `dead-${Date.now()}`;
    __test.registerJob('jobs.test_always_fail', {
      handler: async () => {
        throw new Error('permanent-for-test');
      },
      maxAttempts: 2,
    });

    enqueueJob({ type: 'jobs.test_always_fail', idempotencyKey: key });
    await __test.drain(20);
    assert.equal(__test.hasCompletedKey(key), false);
    const dead = __test.getDead();
    assert.ok(dead.some((j) => j.idempotencyKey === key));
  });

  it('rejects unknown job type', () => {
    assert.throws(
      () => enqueueJob({ type: 'jobs.unknown', idempotencyKey: 'x' }),
      (err) => err.code === 'JOBS_UNKNOWN_TYPE',
    );
  });

  it('rejects empty idempotency key', () => {
    assert.throws(
      () => enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: '  ' }),
      (err) => err.code === 'JOBS_IDEMPOTENCY_REQUIRED',
    );
  });

  it('stopJobs stops the runner loop', async () => {
    stopJobs();
    assert.equal(getJobsStatus().runner.running, false);
    const key = `stopped-${Date.now()}`;
    startJobs();
    enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    stopJobs();
    // After stop, drain via runOnce still works for pending (no timer)
    await __test.drain();
    assert.equal(__test.hasCompletedKey(key), true);
  });
});
