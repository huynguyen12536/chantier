/**
 * SSE wire format — text/event-stream.
 */

/** @param {{ id?: string|number, event?: string, data: unknown, retry?: number }} opts */
export function formatSseMessage({ id, event, data, retry }) {
  const lines = [];
  if (id !== undefined && id !== null) lines.push(`id: ${id}`);
  if (event) lines.push(`event: ${event}`);
  if (retry !== undefined && retry !== null) lines.push(`retry: ${retry}`);
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const part of String(payload).split('\n')) {
    lines.push(`data: ${part}`);
  }
  return `${lines.join('\n')}\n\n`;
}

export function formatHeartbeatComment(ts = Date.now()) {
  return `: heartbeat ${ts}\n\n`;
}
