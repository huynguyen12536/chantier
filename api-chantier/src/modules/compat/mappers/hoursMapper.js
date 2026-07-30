/**
 * DR-P13-008=A — FE heure_debut/heure_fin ↔ Unified matin frame fields (transport only).
 */

/** Map inbound FE body → Imp-04 chantier fields. */
export function fromFeChantierHours(body = {}) {
  const out = { ...body };
  delete out.company_id;
  if (Object.prototype.hasOwnProperty.call(out, 'heure_debut')) {
    if (out.heure_debut_matin == null) out.heure_debut_matin = out.heure_debut;
    delete out.heure_debut;
  }
  if (Object.prototype.hasOwnProperty.call(out, 'heure_fin')) {
    if (out.heure_fin_matin == null) out.heure_fin_matin = out.heure_fin;
    if (out.heure_fin_apres_midi == null) out.heure_fin_apres_midi = out.heure_fin;
    delete out.heure_fin;
  }
  return out;
}

/** Map outbound chantier row → FE shape (plus Unified fields). */
export function toFeChantierHours(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    heure_debut: row.heure_debut ?? row.heure_debut_matin ?? null,
    heure_fin: row.heure_fin ?? row.heure_fin_apres_midi ?? row.heure_fin_matin ?? null,
  };
}

export function mapChantierRows(rows) {
  if (Array.isArray(rows)) return rows.map(toFeChantierHours);
  return toFeChantierHours(rows);
}
