/**
 * Scoped delivery — reuse Imp-05/06/07 ownership semantics.
 * Worker: self only · Chef: chantier scope · Admin/administratif: all.
 */

/**
 * @param {{ id: string, role: string }} user
 * @param {string[] | null} chantierIds
 * @param {{ userId?: string|null, chantierId?: string|null }} event
 */
export function clientMayReceive(user, chantierIds, event) {
  if (!user?.id || !user?.role) return false;

  if (['admin', 'administratif'].includes(user.role)) {
    return true;
  }

  if (user.role === 'ouvrier') {
    return Boolean(event.userId) && event.userId === user.id;
  }

  if (user.role === 'chef_equipe') {
    if (!Array.isArray(chantierIds) || chantierIds.length === 0) return false;
    if (!event.chantierId) return false;
    return chantierIds.includes(event.chantierId);
  }

  return false;
}
