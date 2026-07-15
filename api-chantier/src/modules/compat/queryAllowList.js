/**
 * DR-P13-005=H — allow-list query params proven by Frontend Usage Audit.
 * Not a PostgREST clone: only simple filters services already understand (+ a few list aids).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function pickEq(query, key) {
  const v = query?.[key];
  if (v == null || v === '') return null;
  return String(v);
}

export function pickUuid(query, key) {
  const v = pickEq(query, key);
  if (!v) return null;
  return UUID_RE.test(v) ? v : null;
}

/** Comma-separated UUIDs → array (for optional client hints). */
export function pickUuidList(query, key) {
  const v = pickEq(query, key);
  if (!v) return null;
  const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
  const ok = parts.filter((p) => UUID_RE.test(p));
  return ok.length ? ok : null;
}

export function pickDate(query, key) {
  const v = pickEq(query, key);
  if (!v) return null;
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
}

/**
 * Apply remaining audit filters in-memory after scoped service list.
 * Supports: eq, neq, gte, lte, in, is.null, is.not.null, order, limit (client mirrors).
 */
export function applyClientStyleFilters(rows, filters = {}) {
  let out = Array.isArray(rows) ? [...rows] : [];

  for (const f of filters.eq || []) {
    out = out.filter((r) => String(r?.[f.col] ?? '') === String(f.val));
  }
  for (const f of filters.neq || []) {
    out = out.filter((r) => String(r?.[f.col] ?? '') !== String(f.val));
  }
  for (const f of filters.gte || []) {
    out = out.filter((r) => r?.[f.col] != null && String(r[f.col]) >= String(f.val));
  }
  for (const f of filters.lte || []) {
    out = out.filter((r) => r?.[f.col] != null && String(r[f.col]) <= String(f.val));
  }
  for (const f of filters.in || []) {
    const set = new Set((f.vals || []).map(String));
    out = out.filter((r) => set.has(String(r?.[f.col] ?? '')));
  }
  for (const f of filters.is || []) {
    if (f.nullish) {
      out = out.filter((r) => r?.[f.col] == null);
    } else {
      out = out.filter((r) => r?.[f.col] != null);
    }
  }
  if (filters.orDateFinActive && filters.orDateFinActive.today) {
    const today = filters.orDateFinActive.today;
    out = out.filter(
      (r) => r?.date_fin == null || String(r.date_fin) >= today,
    );
  }

  if (filters.order?.col) {
    const col = filters.order.col;
    const asc = filters.order.ascending !== false;
    out.sort((a, b) => {
      const av = a?.[col];
      const bv = b?.[col];
      if (av == null && bv == null) return 0;
      if (av == null) return asc ? 1 : -1;
      if (bv == null) return asc ? -1 : 1;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }

  if (Number.isInteger(filters.limit) && filters.limit >= 0) {
    out = out.slice(0, filters.limit);
  }

  return out;
}
