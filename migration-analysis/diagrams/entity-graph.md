# Entity graph (Mermaid)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : cascade
  PROFILES ||--o{ AFFECTATIONS_CHANTIERS : assigned_as_user
  PROFILES ||--o{ AFFECTATIONS_CHANTIERS : assigned_as_chef
  CHANTIERS ||--o{ AFFECTATIONS_CHANTIERS : on_site
  PROFILES ||--o{ PERIODES_TRAVAIL : works
  CHANTIERS ||--o{ PERIODES_TRAVAIL : on_site
  PROFILES ||--o{ DECLARATIONS_HEURES : daily_summary
  CHANTIERS ||--o{ DECLARATIONS_HEURES : on_site
  PROFILES ||--o{ ZONES_EQUIPE : owns
  ZONES_EQUIPE ||--o{ ZONES_CHANTIERS : includes
  CHANTIERS ||--o{ ZONES_CHANTIERS : included
  ZONES_EQUIPE ||--o{ ZONES_OUVRIERS : members
  PROFILES ||--o{ ZONES_OUVRIERS : member
```
