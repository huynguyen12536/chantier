/**
 * Imp-12 Wave B — thin auth compat → Imp-02 services only.
 * GoTrue-shaped field names; no JWT/refresh/RBAC logic here.
 */
import { ok, toErrorResponse } from '../http.js';

export function fromPasswordGrant(body = {}) {
  return {
    email: body.email ?? body.username,
    password: body.password,
  };
}

export function fromRefreshGrant(body = {}, query = {}) {
  return (
    body.refresh_token ??
    body.refreshToken ??
    query.refresh_token ??
    null
  );
}

/** Map Imp-02 login/refresh result → FE/supabase-like session payload. */
export function toSessionResponse(session) {
  return ok({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    token_type: (session.tokenType || 'bearer').toLowerCase(),
    expires_in: session.expiresIn,
    user: session.user,
  });
}

export function toUserResponse(user) {
  return ok({ user });
}

export function toLogoutResponse() {
  return ok({ ok: true });
}

export { toErrorResponse };
