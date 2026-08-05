# 10 — Business Preservation Score

## Formula

```
score = 100 * Σ(weight_i * score_i) / Σ(weight_i); structural checks weight=0
```

Structural checks (row counts, UUID equality, FK integrity, checksums) have **weight 0** and are excluded from the sum.

## Dimensions

| Dimension | Weight | Score (0–1) | Points (w×s) | Rationale |
|-----------|--------|-------------|--------------|-----------|
| Person identity (nom, prenom, matricule, phone, role) | 15 | 0.25 | 3.75 | Email-collision discarded profile field diffs=5. Kept profile wins; conflicting identity attributes from hzppst are not reconstructible from local. |
| Chantier core (code, nom, adresse, dates, actif) | 10 | 1.00 | 10.00 | Observed MATCH on core chantier business columns for all 6 merged sites. |
| Schedule / work-window semantics | 10 | 0.35 | 3.50 | CAPABILITY_LOSS: single window forced into matin/apres_midi. Clock times numerically present but afternoon start invented as NULL and fin duplicated — model not faithful. |
| Affectations (who works where) | 10 | 1.00 | 10.00 | Affectation links preserved. |
| Work period core (user, chantier, date, hours, statut, flags) | 15 | 0.95 | 14.25 | Core period fields MATCH after panier_repas→panier rename (TRANSFORMED). Minor risk from GPS/comment capability elsewhere. |
| GPS history (start AND end) | 10 | 0.40 | 4.00 | Start preserved as TRANSFORMED (59/59). End distinct losses=0. End==start rows=59 still CAPABILITY_LOSS. |
| Comments (periodes + declarations) | 8 | 0.25 | 2.00 | Non-empty lost: periodes=0 decls=0. Schema has no commentaire columns → CAPABILITY_LOSS. |
| Declaration hours & counts | 12 | 0.90 | 10.80 | Numeric hour fields and statut observed MATCH; commentaire capability lost separately. |
| Authentication (original credentials) | 20 | 0.00 | 0.00 | LOST_AUTHENTICATION: auth.users never dumped; all business users received GENERATED bcrypt hashes for a temporary password. No user can authenticate with original Supabase credentials. |
| Historical auth sessions & action replay fidelity | 5 | 0.30 | 1.50 | Business rows largely present for replay of timesheet numbers; auth sessions, original passwords, discarded identity attributes, GPS end, and comments model prevent full action replay. |

## Result

- **Weighted sum:** 59.80
- **Total weight:** 115
- **Score:** **52 / 100**
- **Classification:** **MATERIALLY_DEGRADED**

## Why the score is not inflated

Matching UUIDs and row counts were ignored. Authentication alone (weight 20, score 0) and capability losses on GPS, comments, and schedule prevent a high score even though many numeric timesheet fields MATCH.
