import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';
import * as registry from './registry.js';
import * as queue from './queue.js';
import {
  computeBackoffMs,
  getMaxAttempts,
  shouldRetry,
} from './policies.js';

let running = false;
let timer = null;
let stats = { startedAt: null, completed: 0, failed: 0, retries: 0 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollMs() {
  const n = Number(env.jobsPollMs);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 50;
}

async function execute(job) {
  const def = registry.getJob(job.type);
  if (!def) {
    const err = new Error(`Unknown job type: ${job.type}`);
    err.nonRetryable = true;
    throw err;
  }

  const maxAttempts = def.maxAttempts ?? getMaxAttempts();
  const started = Date.now();

  logger.info('jobs.start', {
    correlationId: job.correlationId,
    jobId: job.id,
    type: job.type,
    attempt: job.attempt,
    idempotencyKey: job.idempotencyKey,
  });

  try {
    await def.handler({
      payload: job.payload,
      job,
      correlationId: job.correlationId,
    });
    queue.markCompleted(job.idempotencyKey);
    stats.completed += 1;
    logger.info('jobs.completed', {
      correlationId: job.correlationId,
      jobId: job.id,
      type: job.type,
      attempt: job.attempt,
      idempotencyKey: job.idempotencyKey,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    if (shouldRetry(err, job.attempt, maxAttempts)) {
      const nextAttempt = job.attempt + 1;
      const delay = computeBackoffMs(nextAttempt);
      stats.retries += 1;
      logger.warn('jobs.retry', {
        correlationId: job.correlationId,
        jobId: job.id,
        type: job.type,
        attempt: job.attempt,
        nextAttempt,
        nextDelayMs: delay,
        idempotencyKey: job.idempotencyKey,
        error: err?.message || String(err),
      });
      await sleep(delay);
      queue.requeue({ ...job, attempt: nextAttempt });
      return;
    }

    queue.markDead(job);
    stats.failed += 1;
    logger.error('jobs.failed', {
      correlationId: job.correlationId,
      jobId: job.id,
      type: job.type,
      attempt: job.attempt,
      idempotencyKey: job.idempotencyKey,
      error: err?.message || String(err),
    });
  }
}

async function tick() {
  if (!running) return;
  const job = queue.dequeue();
  if (job) {
    await execute(job);
  }
  if (!running) return;
  timer = setTimeout(() => {
    tick().catch((err) => {
      logger.error('jobs.runner.tick_error', { error: err?.message || String(err) });
    });
  }, job ? 0 : pollMs());
}

export function isRunning() {
  return running;
}

export function getRunnerStats() {
  return {
    running,
    ...stats,
    queue: queue.snapshot(),
  };
}

/** Test helper: process one queued job (or no-op if empty). */
export async function runOnce() {
  const job = queue.dequeue();
  if (!job) return null;
  await execute(job);
  return job.id;
}

/** Drain until queue empty (bounded for tests). */
export async function drain(maxTicks = 100) {
  for (let i = 0; i < maxTicks; i += 1) {
    if (queue.size() === 0 && !queue.snapshot().inFlightId) return;
    await runOnce();
  }
}

export function startRunner() {
  if (running) return;
  running = true;
  stats = { startedAt: new Date().toISOString(), completed: 0, failed: 0, retries: 0 };
  logger.info('jobs.runner.started', { pollMs: pollMs() });
  timer = setTimeout(() => {
    tick().catch((err) => {
      logger.error('jobs.runner.tick_error', { error: err?.message || String(err) });
    });
  }, 0);
}

export function stopRunner() {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info('jobs.runner.stopped', {});
}
