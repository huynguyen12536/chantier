# `calculer_heures_cadre_chantier`

**Phase 2:** **Không có trên production `hzppst`** (repo-only).  
**Nguồn repo:** `20260522120000` / `20260618071528`.

## Mục đích

Tách giờ làm thành **heures_normales** vs **heures_supplementaires** theo khung (`heure_debut`/`heure_fin` của chantier).

## Signature

- **Input:** `travail_debut`, `travail_fin`, `cadre_debut`, `cadre_fin` (time)
- **Output:** TABLE `(heures_normales, heures_supplementaires, total_heures decimal(6,2))`
- **Attributes:** `IMMUTABLE`

## Pseudo code

```
IF fin null OR fin <= debut → all 0
total = fin - debut (hours)
IF cadre missing OR invalid:
  normales = min(total, 7)
  supplémentaires = max(total - 7, 0)
ELSE:
  normales = intersection(worker, [cadre_debut, cadre_fin])
  supplémentaires = portion of work after cadre_fin
  (portion before cadre_debut NOT counted as HS in this function)
```

## Business Rule

- Không có khung → fallback hard-coded **7h** normale.
- Có khung → normale = giao; HS = phần **sau** `cadre_fin`.

## Side effects

Không. Được gọi bởi VIEW `synthese_heures_journalieres`.
