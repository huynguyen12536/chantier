# Diagrams

Các sơ đồ Mermaid phục vụ reverse-engineer. Mở bằng viewer Markdown hỗ trợ Mermaid.

---

## 1. Entity graph (hiện trạng)

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "id cascade"
  PROFILES ||--o{ AFFECTATIONS_CHANTIERS : user_id
  PROFILES ||--o{ AFFECTATIONS_CHANTIERS : chef_equipe_id
  CHANTIERS ||--o{ AFFECTATIONS_CHANTIERS : chantier_id
  PROFILES ||--o{ PERIODES_TRAVAIL : user_id
  CHANTIERS ||--o{ PERIODES_TRAVAIL : chantier_id
  PROFILES ||--o{ DECLARATIONS_HEURES : user_id
  CHANTIERS ||--o{ DECLARATIONS_HEURES : chantier_id
  PROFILES ||--o{ ZONES_EQUIPE : chef_equipe_id
  ZONES_EQUIPE ||--o{ ZONES_CHANTIERS : zone_id
  CHANTIERS ||--o{ ZONES_CHANTIERS : chantier_id
  ZONES_EQUIPE ||--o{ ZONES_OUVRIERS : zone_id
  PROFILES ||--o{ ZONES_OUVRIERS : user_id
  PERIODES_TRAVAIL ||--o| DECLARATIONS_HEURES : "sync trigger by day"
```

File tách: [entity-graph.md](./entity-graph.md)

---

## 2. Sequence — Khai báo giờ → Validate

```mermaid
sequenceDiagram
  participant O as Ouvrier FE
  participant SB as Supabase API
  participant T1 as trigger_sync_declarations
  participant T2 as auto_approve trigger
  participant T3 as sync_periods trigger
  participant C as Chef FE

  O->>SB: INSERT periodes_travail
  SB->>T1: AFTER insert
  T1->>SB: UPSERT declarations_heures (soumise)
  SB->>T2: AFTER insert/update statut
  alt khớp ca đã validee
    T2->>SB: UPDATE declaration → validee
    SB->>T3: propagate periods
  else chờ duyệt
    C->>SB: UPDATE declaration validee/rejetee
    SB->>T3: UPDATE periods
  end
```

---

## 3. Sequence — Tạo user

```mermaid
sequenceDiagram
  participant A as Admin FE
  participant E as Edge create-user
  participant Auth as auth.users
  participant P as profiles

  A->>E: POST + JWT
  E->>P: check caller role admin|administratif
  E->>Auth: admin.createUser
  E->>P: INSERT profile
  alt profile fail
    E->>Auth: deleteUser rollback
  end
  E-->>A: 201 user
```

---

## 4. Flowchart — Ai thấy Site nào (Ouvrier)

```mermaid
flowchart TD
  L[Login ouvrier] --> P[Load profile]
  P --> A[SELECT affectations active]
  P --> Z[SELECT zones_ouvriers active]
  Z --> ZC[zones_chantiers → chantiers]
  A --> M[Merge unique chantiers actifs]
  ZC --> M
  M --> UI[assignedWorksites / declare]
```

---

## 5. State — `declarations_heures.statut`

```mermaid
stateDiagram-v2
  [*] --> brouillon: sync (periods en_cours)
  [*] --> soumise: sync (periods terminées)
  brouillon --> soumise: periods hoàn tất
  soumise --> validee: chef/admin OR auto-approve
  soumise --> rejetee: chef/admin
  soumise --> annulee: cancel / hết periods
  rejetee --> [*]: user có thể xóa & khai báo lại
  validee --> [*]
  annulee --> [*]
```

---

## 6. State — `periodes_travail.statut`

```mermaid
stateDiagram-v2
  [*] --> en_cours
  en_cours --> terminee: set heure_fin
  terminee --> validee: chef/admin/trigger
  terminee --> rejetee: chef/admin
  rejetee --> terminee: ouvrier resubmit (RLS)
  en_cours --> [*]: delete
  terminee --> [*]: delete before validate
```

---

## 7. Target architecture (brief — chưa có trong code)

```mermaid
flowchart TB
  FE[Frontend dùng chung]
  DB_A[(DB A Super Admin)]
  DB_B1[(DB B Company 1)]
  DB_B2[(DB B Company N)]
  FE -->|super admin ops| DB_A
  FE -->|company ops| DB_B1
  FE -->|company ops| DB_B2
  DB_A -.->|logical provision| DB_B1
  DB_A -.->|logical provision| DB_B2
```

Hiện repo chỉ có khối tương đương **một** `DB_B`.
