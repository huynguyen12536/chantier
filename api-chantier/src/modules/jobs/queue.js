import { randomUUID } from 'node:crypto';
import { normalizeIdempotencyKey } from './policies.js';

/** @type {object[]} */
let pending = [];
/** @type {Set<string>} */
const completedKeys = new Set();
/** @type {Set<string>} */
const pendingKeys = new Set();
/** @type {object[]} */
const dead = [];
/** @type {string|null} */
let inFlightId = null;

export function enqueue(jobInput) {
  const idempotencyKey = normalizeIdempotencyKey(jobInput?.idempotencyKey);
  if (!idempotencyKey) {
    const err = new Error('idempotencyKey required');
    err.code = 'JOBS_IDEMPOTENCY_REQUIRED';
    throw err;
  }

  if (completedKeys.has(idempotencyKey) || pendingKeys.has(idempotencyKey)) {
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
  };

  pending.push(job);
  pendingKeys.add(idempotencyKey);
  return { duplicate: false, job };
}

export function dequeue() {
  if (pending.length === 0) return null;
  const job = pending.shift();
  pendingKeys.delete(job.idempotencyKey);
  inFlightId = job.id;
  return job;
}

export function size() {
  return pending.length;
}

export function getByIdempotencyKey(key) {
  const k = normalizeIdempotencyKey(key);
  if (!k) return null;
  const inPending = pending.find((j) => j.idempotencyKey === k);
  if (inPending) return inPending;
  return null;
}

export function markCompleted(key) {
  const k = normalizeIdempotencyKey(key);
  if (k) completedKeys.add(k);
  inFlightId = null;
}

export function markDead(job) {
  dead.push({ ...job, diedAt: new Date().toISOString() });
  inFlightId = null;
}

/** Re-queue after failed attempt (tail). */
export function requeue(job) {
  pendingKeys.add(job.idempotencyKey);
  pending.push(job);
  inFlightId = null;
}

export function clear() {
  pending = [];
  completedKeys.clear();
  pendingKeys.clear();
  dead.length = 0;
  inFlightId = null;
}

export function snapshot() {
  return {
    pending: pending.length,
    completedKeys: completedKeys.size,
    dead: dead.length,
    inFlightId,
  };
}

export function getDead() {
  return [...dead];
}

export function hasCompletedKey(key) {
  return completedKeys.has(normalizeIdempotencyKey(key));
}
