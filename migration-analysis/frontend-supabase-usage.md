# Frontend Supabase Usage — Inventory đầy đủ

**Nguồn:** Frontend + Edge Functions.  
**App root:** `chantier1/Chantier-web-app-main/Chantier-web-app-main/`

Mỗi dòng: file · dòng · API · bảng/function · mục đích.

---

## services/

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `services/supabase.ts` | 8 | `createClient` | — | Singleton anon client |
| `services/auth.ts` | 6 | `auth.signInWithPassword` | — | AuthService (UI không gọi) |
| `services/auth.ts` | 14 | `auth.signOut` | — | AuthService |
| `services/auth.ts` | 20 | `from` select | `profiles` | getProfile |
| `services/auth.ts` | 31 | `from` update | `profiles` | updateProfile |
| `services/periods.ts` | 7 | `from` select | `periodes_travail` | getTodayPeriods |
| `services/periods.ts` | 26 | `from` insert | `periodes_travail` | startPeriod |
| `services/periods.ts` | 50 | `from` update | `periodes_travail` | endPeriod |
| `services/periods.ts` | 68 | `from` update | `periodes_travail` | validatePeriod |
| `services/periods.ts` | 81 | `from` update | `periodes_travail` | rejectPeriod |
| `services/worksites.ts` | 9 | `from` select | `affectations_chantiers` | getAssignedWorksites |
| `services/worksites.ts` | 26 | `from` insert | `affectations_chantiers` | assignWorker |
| `services/worksites.ts` | 42 | `from` update | `affectations_chantiers` | soft-remove (`date_fin`) |

---

## contexts/

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `contexts/AuthContext.tsx` | 29 | `auth.getSession` | — | Bootstrap session |
| `contexts/AuthContext.tsx` | 38 | `auth.onAuthStateChange` | — | Đồng bộ session |
| `contexts/AuthContext.tsx` | 56 | `from` select | `profiles` | Load profile |
| `contexts/AuthContext.tsx` | 77 | `auth.getSession` | — | refreshProfile |
| `contexts/AuthContext.tsx` | 96 | `from` select | `affectations_chantiers` | Chef: chantiers quản lý |
| `contexts/AuthContext.tsx` | 122 | `from` select | `affectations_chantiers` | Ouvrier: affectation trực tiếp |
| `contexts/AuthContext.tsx` | 139 | `from` select | `zones_ouvriers` | Ouvrier: chantier qua zone |
| `contexts/AuthContext.tsx` | 177 | `auth.signInWithPassword` | — | Login |
| `contexts/AuthContext.tsx` | 190 | `auth.signOut` | — | Logout local |

---

## utils/

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `utils/team.ts` | 42 | `from` select | `affectations_chantiers` | IDs chantier chef quản lý |
| `utils/team.ts` | 54 | `from` select | `chantiers` | Rows chantier chef |
| `utils/team.ts` | 70 | `from` select | `affectations_chantiers` | Team user IDs |
| `utils/team.ts` | 81 | `from` select | `zones_equipe` | Team qua zones |
| `utils/worksiteCode.ts` | 23 | `from` select | `chantiers` | Sinh mã chantier tiếp theo |
| `utils/ouvrierDeclaration.ts` | 41 | `from` select | `periodes_travail` | Habit / suggestion template |
| `utils/ouvrierDeclaration.ts` | 54 | `from` select | `declarations_heures` | Map statut habit |
| `utils/ouvrierDeclaration.ts` | 137 | `from` select | `periodes_travail` | Fallback habit |
| `utils/ouvrierDeclaration.ts` | 149 | `from` select | `declarations_heures` | Fallback statut |
| `utils/ouvrierDeclaration.ts` | 176 | `from` select | `chantiers` | Default chantier |
| `utils/ouvrierDeclaration.ts` | 250 | `rpc` *(commented)* | `auto_approve_week_suggestion_replication` | Đã tắt |
| `utils/ouvrierDeclaration.ts` | 388 | `from` select | `periodes_travail` | Quét tuần trước để replicate |
| `utils/ouvrierDeclaration.ts` | 398 | `from` select | `declarations_heures` | Statut tuần trước |
| `utils/ouvrierDeclaration.ts` | 483 | `from` select | `periodes_travail` | Overlap trước replicate |
| `utils/ouvrierDeclaration.ts` | 489 | `from` select | `declarations_heures` | Overlap statut |
| `utils/ouvrierDeclaration.ts` | 575 | `from` insert | `periodes_travail` | Replicate tuần trước |

---

## components/

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `components/ouvrier/ChooseDayCalendar.tsx` | 90 | `from` select | `periodes_travail` | Dot trạng thái lịch |
| `components/ouvrier/ChooseDayCalendar.tsx` | 96 | `from` select | `declarations_heures` | Statut ngày |

---

## app/ — khai báo giờ

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `app/declare-day.tsx` | 169 | `from` select | `chantiers` | Danh sách chantier form |
| `app/declare-day.tsx` | 288 | `from` select | `periodes_travail` | Overlap tuần |
| `app/declare-day.tsx` | 294 | `from` select | `declarations_heures` | Statut tuần |
| `app/declare-day.tsx` | 407 | `from` insert | `periodes_travail` | Lưu khai báo nhiều ngày |
| `app/declare-day-suggestion.tsx` | 222 | `from` select | `periodes_travail` | Overlap trước accept |
| `app/declare-day-suggestion.tsx` | 227 | `from` select | `declarations_heures` | Statut |
| `app/declare-day-suggestion.tsx` | 258 | `from` insert | `periodes_travail` | Accept suggestion |
| `app/declare-day-empty.tsx` | 167 | `from` select | `periodes_travail` | Periods ngày trống |
| `app/declare-day-empty.tsx` | 175 | `from` select | `declarations_heures` | Statut ngày |

---

## app/(tabs)/ — ouvrier / chef / validation / export

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `ouvrier-dashboard.tsx` | 135 | `from` select | `periodes_travail` | Dashboard tuần |
| `ouvrier-dashboard.tsx` | 143 | `from` select | `declarations_heures` | Statut tuần |
| `timesheet.tsx` | 144 | `from` select | `periodes_travail` | Load timesheet |
| `timesheet.tsx` | 152 | `from` select | `declarations_heures` | Load statut |
| `timesheet.tsx` | 242 | `channel` realtime | `periodes_travail`, `declarations_heures` | Live reload |
| `timesheet.tsx` | 325 | `from` select | `chantiers` | Chantiers cho lines |
| `timesheet.tsx` | 389 | `from` delete | `periodes_travail` | Xóa dòng |
| `timesheet.tsx` | 492 | `from` insert | `periodes_travail` | Tạo dòng |
| `timesheet.tsx` | 517 | `from` update | `periodes_travail` | Sửa dòng |
| `chef-dashboard.tsx` | 46 | `channel` realtime | `periodes_travail` | Pending team |
| `chef-dashboard.tsx` | 99–232 | `from` select | `zones_equipe`, `affectations_chantiers` | Scope team/chantier |
| `chef-dashboard.tsx` | 181, 250 | `from` select | `periodes_travail` | Giờ / pending |
| `chef-dashboard.tsx` | 267 | `from` update | `periodes_travail` | Validate period |
| `chef-dashboard.tsx` | 295 | `from` update | `periodes_travail` | Reject period |
| `validation.tsx` | 157 | `from` select | `declarations_heures` | Queue validate |
| `validation.tsx` | 195 | `from` select | `periodes_travail` | Chi tiết periods |
| `validation.tsx` | 294 | `channel` realtime | cả hai bảng | Live list |
| `validation.tsx` | 489 | `from` update | `periodes_travail` | Sync sau validate |
| `validation.tsx` | 508 | `from` update | `declarations_heures` | Validate/reject |
| `validation.tsx` | 548–597 | `from` select/update | `declarations_heures` | Cancel → `annulee` |
| `validation.tsx` | 732 | `from` delete | `periodes_travail` | Xóa periods khi cancel |
| `export.tsx` | 132, 187 | `from` select | `periodes_travail` | Export paie / stats |
| `user-payroll.tsx` | 67 | `from` select | `declarations_heures` | Chi tiết paie |

---

## app/(tabs)/ — management / admin / team / worksites

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `management.tsx` | 199 | `from` update | `profiles` | Promote → chef |
| `management.tsx` | 216 | `from` update | `affectations_chantiers` | Sync `chef_equipe_id` |
| `management.tsx` | 301 | `from` select | `profiles` | List users |
| `management.tsx` | 315 | `from` select | `zones_chantiers` | Zones trên chantier |
| `management.tsx` | 348 | `from` select | `chantiers` | List sites |
| `management.tsx` | 357 | `from` select | `affectations_chantiers` | Assignments |
| `management.tsx` | 367 | `from` select | `profiles` | Profiles cho UI assign |
| `management.tsx` | 453–456 | `auth` + `fetch` edge | `create-user` | Tạo user |
| `management.tsx` | 522–533 | `from` select | `affectations_chantiers`, `zones_equipe` | Chặn demotion |
| `management.tsx` | 550 | `from` update | `profiles` | Edit user/role |
| `management.tsx` | 578–580 | `auth` + `fetch` edge | `delete-user` | Xóa user |
| `management.tsx` | 610 | `from` select | `affectations_chantiers` | Assignees hiện tại |
| `management.tsx` | 699 | `from` update | `chantiers` | Sửa site |
| `management.tsx` | 724 | `from` upsert | `affectations_chantiers` | Gán |
| `management.tsx` | 731 | `from` update | `affectations_chantiers` | Soft-remove |
| `management.tsx` | 760 | `from` insert | `chantiers` | Tạo site |
| `management.tsx` | 784 | `from` insert | `affectations_chantiers` | Gán ban đầu |
| `management.tsx` | 811 | `rpc` | `delete_chantier_cascade` | Xóa site + deps |
| `admin-users.tsx` | 108 | `from` select | `profiles` | List |
| `admin-users.tsx` | 147–149 | edge | `delete-user` | Xóa |
| `admin-users.tsx` | 188 | `from` update | `profiles` | Edit |
| `admin-users.tsx` | 230–232 | edge | `create-user` | Tạo |
| `admin-worksites.tsx` | 112–279 | `from` / `rpc` | `chantiers`, `affectations_chantiers`, `profiles`, `delete_chantier_cascade` | CRUD sites + assign |
| `worksite-detail.tsx` | 91–185 | `from` | `chantiers`, `affectations_chantiers`, `profiles` | Chi tiết + assign |
| `team-management.tsx` | 107–341 | `from` | `zones_*`, `profiles` | CRUD zones équipe |

---

## hooks/

Không có gọi Supabase.

---

## scripts/

| File | Line | API | Function | Mục đích |
|------|------|-----|----------|----------|
| `scripts/create-test-users.ts` | 21 | `fetch` edge | `create-user` | Seed test (`VITE_SUPABASE_*`) |

---

## supabase/functions/ (Edge)

| File | Line | API | Bảng / Function | Mục đích |
|------|------|-----|-----------------|----------|
| `create-user/index.ts` | 43–104 | service role | `profiles`, `auth.admin.createUser` | Tạo user + profile; rollback nếu fail |
| `delete-user/index.ts` | 25–90 | service + anon | `profiles`, `zones_equipe`, `auth.admin.deleteUser` | Xóa user (admin only) |
| `seed-test-users/index.ts` | 26–59 | service | profiles + auth | Seed — **UI không gọi** |

---

## Tổng hợp API surface

| Category | Có? | Chi tiết |
|----------|-----|----------|
| `.from()` | Có | 8 bảng public |
| `.rpc()` | Có | `delete_chantier_cascade` (active); `auto_approve_week_suggestion_replication` (commented) |
| `.storage` | **Không** | — |
| `.auth` | Có | session, password login, signOut local |
| `.channel` / realtime | Có | timesheet, validation, chef-dashboard |
| `functions.invoke` | **Không** | Dùng raw `fetch` |
| Edge functions | Có | create-user, delete-user (+ seed) |

---

## Storage / channel / realtime — chi tiết

**Storage:** không dùng.

**Realtime channels:**

| Screen | Channel name pattern | Tables `postgres_changes` |
|--------|---------------------|---------------------------|
| `chef-dashboard.tsx` | `chef_dashboard_{profile.id}` | `periodes_travail` |
| `validation.tsx` | dynamic | `declarations_heures`, `periodes_travail` |
| `timesheet.tsx` | dynamic | `periodes_travail`, `declarations_heures` |

Bảng được add vào publication `supabase_realtime` trong migration `enable_validation_realtime`.
