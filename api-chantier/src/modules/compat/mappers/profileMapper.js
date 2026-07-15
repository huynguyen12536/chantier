/**
 * profiles table adapter mapping (allow-list GET/PATCH only).
 */
export function toListResponse(users) {
  return {
    status: 200,
    body: users,
  };
}

export function toOneResponse(user) {
  return {
    status: 200,
    body: user,
  };
}

/**
 * @returns {{ id: string|undefined, patch: object }}
 */
export function fromPatchRequest(params = {}, body = {}) {
  const { id: bodyId, ...rest } = body ?? {};
  const id = params.id ?? bodyId;
  return { id, patch: rest };
}

export function toPatchResponse(user) {
  return {
    status: 200,
    body: user,
  };
}

export function toErrorResponse(err) {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return {
    status,
    body: { error: err?.message || 'Internal server error' },
  };
}
