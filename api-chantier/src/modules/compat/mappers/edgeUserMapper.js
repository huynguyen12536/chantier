/**
 * Edge create/delete-user request/response mapping only (no business rules).
 */
export function fromCreateRequest(body = {}) {
  return {
    email: body.email,
    password: body.password,
    nom: body.nom,
    prenom: body.prenom,
    phone: body.phone,
    role: body.role,
    matricule: body.matricule,
  };
}

export function fromDeleteRequest(body = {}) {
  return { userId: body.user_id };
}

export function toCreateResponse(user) {
  return {
    status: 201,
    body: {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        matricule: user.matricule,
        role: user.role,
      },
    },
  };
}

export function toDeleteResponse() {
  return {
    status: 200,
    body: { success: true },
  };
}

/** Edge FE expects flat `{ error: string }`. */
export function toErrorResponse(err) {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return {
    status,
    body: { error: err?.message || 'Internal server error' },
  };
}
