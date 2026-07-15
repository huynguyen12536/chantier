/**
 * Imp-10 Wave A — job platform tests (idempotency + lifecycle + disable/stop).
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
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
    env.jobsEnabled = true;
    stopJobs();
    __test.clearQueue();
    startJobs();
  });

  afterEach(() => {
    env.jobsEnabled = true;
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
    assert.equal(__test.hasReservedKey(key), false);
    assert.equal(getJobsStatus().queue.pending, 0);
  });

  it('duplicate enqueue while QUEUED is rejected', () => {
    stopJobs(); // pause runner so job stays queued
    __test.clearQueue();
    __test.clearRegistry();
    __test.registerBuiltinJobs();

    const key = `queued-${Date.now()}`;
    const first = enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    assert.equal(first.duplicate, false);
    assert.equal(__test.hasReservedKey(key), true);

    const second = enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    assert.equal(second.duplicate, true);
    assert.equal(getJobsStatus().queue.pending, 1);
  });

  it('duplicate enqueue while RUNNING is rejected', async () => {
    stopJobs();
    __test.clearQueue();
    __test.clearRegistry();

    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    let started = false;

    __test.registerJob('jobs.test_slow', {
      handler: async () => {
        started = true;
        await gate;
      },
    });

    const key = `running-${Date.now()}`;
    enqueueJob({ type: 'jobs.test_slow', idempotencyKey: key });

    const runPromise = __test.runOnce();
    // Wait until RUNNING
    for (let i = 0; i < 50 && !started; i += 1) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.equal(started, true);
    assert.equal(__test.hasReservedKey(key), true);
    assert.ok(__test.getInFlight());

    const dup = enqueueJob({ type: 'jobs.test_slow', idempotencyKey: key });
    assert.equal(dup.duplicate, true);

    release();
    await runPromise;
    assert.equal(__test.hasCompletedKey(key), true);
    assert.equal(__test.hasReservedKey(key), false);
  });

  it('duplicate enqueue after COMPLETED is rejected', async () => {
    const key = `done-${Date.now()}`;
    enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    await __test.drain();
    assert.equal(__test.hasCompletedKey(key), true);

    const second = enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: key });
    assert.equal(second.duplicate, true);
    assert.equal(getJobsStatus().queue.pending, 0);
  });

  it('duplicate enqueue after permanent FAILED allows recovery enqueue', async () => {
    stopJobs();
    __test.clearQueue();
    __test.clearRegistry();
    __test.registerJob('jobs.test_always_fail', {
      handler: async () => {
        throw new Error('permanent-for-test');
      },
      maxAttempts: 1,
    });

    const key = `fail-${Date.now()}`;
    enqueueJob({ type: 'jobs.test_always_fail', idempotencyKey: key });
    await __test.drain(10);
    assert.ok(__test.getDead().some((j) => j.idempotencyKey === key));
    assert.equal(__test.hasReservedKey(key), false);
    assert.equal(__test.hasCompletedKey(key), false);

    // Documented policy: after terminal FAILED, key is released for recovery
    __test.registerJob('jobs.test_always_fail', {
      handler: async () => {},
      maxAttempts: 1,
    });
    const again = enqueueJob({ type: 'jobs.test_always_fail', idempotencyKey: key });
    assert.equal(again.duplicate, false);
    await __test.drain(10);
    assert.equal(__test.hasCompletedKey(key), true);
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
    assert.ok(__test.getDead().some((j) => j.idempotencyKey === key));
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

  it('JOBS_ENABLED=false: runner never starts; enqueue disabled', () => {
    stopJobs();
    __test.clearQueue();
    env.jobsEnabled = false;
    startJobs();
    assert.equal(__test.isRunning(), false);
    assert.throws(
      () => enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: 'disabled' }),
      (err) => err.code === 'JOBS_DISABLED',
    );
    assert.equal(getJobsStatus().enabled, false);
    env.jobsEnabled = true;
  });

  it('JOBS_ENABLED=false does not break createApp HTTP boot', async () => {
    const { createApp } = await import('../src/app.js');
    env.jobsEnabled = false;
    stopJobs();
    startJobs();
    const app = createApp();
    const server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    try {
      const { port } = server.address();
      const res = await fetch(`http://127.0.0.1:${port}/health/live`);
      assert.equal(res.status, 200);
      assert.equal(__test.isRunning(), false);
    } finally {
      await new Promise((r, j) => server.close((e) => (e ? j(e) : r())));
      env.jobsEnabled = true;
    }
  });

  it('stopJobs: no new jobs via runner; in-flight finishes', async () => {
    stopJobs();
    __test.clearQueue();
    __test.clearRegistry();

    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    let finished = false;

    __test.registerJob('jobs.test_slow_stop', {
      handler: async () => {
        await gate;
        finished = true;
      },
    });
    __test.registerJob(JOB_PLATFORM_NOOP, {
      handler: async () => {
        throw new Error('should-not-run-via-runner-after-stop');
      },
    });

    const keySlow = `slow-stop-${Date.now()}`;
    const keyNext = `next-stop-${Date.now()}`;
    enqueueJob({ type: 'jobs.test_slow_stop', idempotencyKey: keySlow });

    __test.startRunner();
    for (let i = 0; i < 100 && !__test.getInFlight(); i += 1) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.ok(__test.getInFlight(), 'expected in-flight job');

    stopJobs();
    assert.equal(__test.isRunning(), false);

    enqueueJob({ type: JOB_PLATFORM_NOOP, idempotencyKey: keyNext });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(__test.hasCompletedKey(keyNext), false);
    assert.ok(getJobsStatus().queue.pending >= 1);

    release();
    for (let i = 0; i < 100 && !finished; i += 1) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.equal(finished, true);
    assert.equal(__test.hasCompletedKey(keySlow), true);
    assert.equal(__test.hasCompletedKey(keyNext), false);
  });
});
