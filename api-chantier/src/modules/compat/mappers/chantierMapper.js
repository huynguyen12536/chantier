/**
 * delete_chantier_cascade RPC request/response mapping only.
 */
export function fromCascadeRequest(body = {}) {
  return { chantierId: body.p_chantier_id };
}

/** CVL RPC returns void; FE checks error only. */
export function toCascadeResponse() {
  return {
    status: 200,
    body: null,
  };
}

export function toErrorResponse(err) {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return {
    status,
    body: { error: err?.message || 'Internal server error' },
  };
}
