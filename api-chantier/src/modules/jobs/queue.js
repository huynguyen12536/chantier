import { randomUUID } from 'node:crypto';
import { normalizeIdempotencyKey } from './policies.js';

/**
 * Ephemeral in-memory queue (DR-IMP10-002 = A).
 *
 * Jobs exist only in process memory. A process restart loses queued,
 * running, and completed-key state. Persistence / outbox is explicitly deferred.
 *
 * Idempotency reservation lifecycle:
 *   QUEUED  → key in `reservedKeys`
 *   RUNNING → key remains in `reservedKeys` (NOT released on dequeue)
 *   COMPLETED → key moves to `completedKeys` (duplicates rejected)
 *   FAILED (terminal) → key released from reservation (new enqueue allowed for recovery)
 */

/** @type {object[]} */
let pending = [];
/** Keys reserved while QUEUED or RUNNING */
const reservedKeys = new Set();
/** Keys that completed successfully — duplicates stay rejected */
const completedKeys = new Set();
/** @type {object[]} */
const dead = [];
/** @type {object|null} */
let inFlightJob = null;

export function enqueue(jobInput) {
  const idempotencyKey = normalizeIdempotencyKey(jobInput?.idempotencyKey);
  if (!idempotencyKey) {
    const err = new Error('idempotencyKey required');
    err.code = 'JOBS_IDEMPOTENCY_REQUIRED';
    throw err;
  }

  if (completedKeys.has(idempotencyKey) || reservedKeys.has(idempotencyKey)) {
    return {
      duplicate: true,
      job: getByIdempotencyKey(idempotencyKey),
    };
  }

  const job = {
    id: randomUUID(),
    type: jobInput.type,
    payload: jobInput.payload ?? {},
    idempotencyKey,
    attempt: Number(jobInput.attempt) || 0,
    correlationId: jobInput.correlationId,
    enqueuedAt: new Date().toISOString(),
    state: 'QUEUED',
  };

  pending.push(job);
  reservedKeys.add(idempotencyKey);
  return { duplicate: false, job };
}

export function dequeue() {
  if (pending.length === 0) return null;
  const job = pending.shift();
  // Keep idempotency key reserved while RUNNING
  job.state = 'RUNNING';
  inFlightJob = job;
  return job;
}

export function size() {
  return pending.length;
}

export function getByIdempotencyKey(key) {
  const k = normalizeIdempotencyKey(key);
  if (!k) return null;
  if (inFlightJob?.idempotencyKey === k) return inFlightJob;
  return pending.find((j) => j.idempotencyKey === k) ?? null;
}

export function markCompleted(key) {
  const k = normalizeIdempotencyKey(key);
  if (k) {
    reservedKeys.delete(k);
    completedKeys.add(k);
  }
  inFlightJob = null;
}

/**
 * Terminal permanent failure: release reservation so a later enqueue
 * with the same key can recover (documented Wave A policy).
 */
export function markDead(job) {
  const k = normalizeIdempotencyKey(job?.idempotencyKey);
  if (k) reservedKeys.delete(k);
  dead.push({ ...job, state: 'FAILED', diedAt: new Date().toISOString() });
  inFlightJob = null;
}

/** Re-queue after failed attempt (still RUNNING reservation held). */
export function requeue(job) {
  const next = { ...job, state: 'QUEUED' };
  pending.push(next);
  // reservedKeys already holds idempotencyKey from original enqueue
  if (!reservedKeys.has(next.idempotencyKey)) {
    reservedKeys.add(next.idempotencyKey);
  }
  inFlightJob = null;
}

export function clear() {
  pending = [];
  reservedKeys.clear();
  completedKeys.clear();
  dead.length = 0;
  inFlightJob = null;
}

export function snapshot() {
  return {
    pending: pending.length,
    reservedKeys: reservedKeys.size,
    completedKeys: completedKeys.size,
    dead: dead.length,
    inFlightId: inFlightJob?.id ?? null,
    inFlightKey: inFlightJob?.idempotencyKey ?? null,
  };
}

export function getDead() {
  return [...dead];
}

export function hasCompletedKey(key) {
  return completedKeys.has(normalizeIdempotencyKey(key));
}

export function hasReservedKey(key) {
  return reservedKeys.has(normalizeIdempotencyKey(key));
}

export function getInFlight() {
  return inFlightJob;
}
