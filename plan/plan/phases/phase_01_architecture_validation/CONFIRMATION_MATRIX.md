# Phase 1 — Confirmation Matrix (Runtime Architecture)

**Date:** 2026-07-14  
**Type:** Validation evidence  
**SoT cited:** `00-IMPORTANT-FINDINGS.md`, `frontend-overview.md`, `frontend-supabase-usage.md`  
**Code roots:** `chantier1/Chantier-web-app-main/Chantier-web-app-main/`

> Không paste JWT/secret đầy đủ trong tài liệu này. Chỉ ghi project ref + JWT `role` claim quan sát được.

---

## 1. Supabase project refs

| Ref | Host | Nơi xuất hiện trong repo | Vai trò đã xác nhận |
|---|---|---|---|
| `afgveikzneaablcuzwdb` | `https://afgveikzneaablcuzwdb.supabase.co` | `app.config.js` (hardcode), `.env.example`, `eas.json` preview+production, block 1 file `env` | **Runtime mặc định** của app Expo / EAS builds |
| `hzppsttpzzeuslnpcdkv` (CLI name **CHANTIER**) | `https://hzppsttpzzeuslnpcdkv.supabase.co` | `supabase/.temp/linked-project.json`; **cũng** block 2 trong file `env` | **Không** có `createClient` thứ 2 trong FE. Là CLI-linked / alternate local notes — **không** dual-DB SuperAdmin |

### Quyết định chốt (Phase 1)

| Câu hỏi | Kết luận | Evidence |
|---|---|---|
| Runtime URL/key chính thức trong code committed? | **`afgveikzneaablcuzwdb` + anon key** trong `app.config.js` / `eas.json` | `app.config.js` L9–11; `eas.json` preview+production env |
| Có dual-client FE (2 `createClient` project khác nhau)? | **Không** | Chỉ 1 export `supabase` trong `services/supabase.ts`; grep FE không có client #2 |
| `hzppst…` có phải Super Admin DB? | **Không** — không company/super-admin app layer | `00-IMPORTANT-FINDINGS.md`; không `companies`/`company_id` trong app types/screens |
| File `env` vs `.env`? | Có file tên **`env`** (không phải `.env`). **Không** có `.env` trong workspace. Expo không load `env` tự động trừ khi copy thủ công sang `.env` | Glob `.env*` chỉ thấy `.env.example` |

### Resolve order URL/key (`services/supabase.ts`)

1. `process.env.EXPO_PUBLIC_SUPABASE_*`
2. Fallback `Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_*` ← từ `app.config.js` → **afgveikz + anon**

---

## 2. Key / secret hygiene (quan sát)

| Nguồn | Project | JWT `role` claim (payload) | Ghi chú |
|---|---|---|---|
| `app.config.js` / `eas.json` | afgveikz | `anon` | Đúng pattern public client; **hardcode trong repo** (R-08) |
| `.env.example` | afgveikz | placeholder | An toàn làm template |
| File `env` block 1 | afgveikz | `service_role` | Biến tên `EXPO_PUBLIC_SUPABASE_ANON_KEY` nhưng claim **không** phải anon — nguy hiểm nếu copy thành `.env` |
| File `env` block 2 | hzppst | `service_role` | Cùng rủi ro; nếu dotenv lấy key trùng tên, **block sau thắng** → local có thể trỏ hzppst |

**Không** mở rộng scope sang rotate key trong Phase 1 — ghi Risk R-08 / R-13; xử lý secret management ở phase FE/ops sau.

---

## 3. FE client singleton

| Check | Result | Evidence |
|---|---|---|
| Singleton `createClient` app runtime | **PASS** | `services/supabase.ts` L8 — một instance export |
| Edge Functions tạo client riêng (server Deno) | Expected | `create-user` / `delete-user` / `seed-test-users` — không phải dual FE client |
| Script tooling | Non-UI | `scripts/create-test-users.ts` dùng `VITE_SUPABASE_*` + fetch Edge — không import vào screens |

---

## 4. Live FE surface (screens / utils gọi Supabase)

Import live: `import { supabase } from '@/services/supabase'` (hoặc + `supabaseUrl`/`supabaseAnonKey`).

| Surface | Live? | API chính |
|---|---|---|
| `contexts/AuthContext.tsx` | Yes | auth session + `profiles` + affectations/zones cho worksites |
| `app/(auth)/login.tsx` | Indirect | `useAuth().signIn` (+ biometric local) |
| `app/declare-day*.tsx` | Yes | `periodes_travail` / `declarations_heures` / `chantiers` |
| `app/(tabs)/ouvrier-dashboard.tsx` | Yes | periods + declarations |
| `app/(tabs)/timesheet.tsx` | Yes | CRUD periods + **realtime** |
| `app/(tabs)/chef-dashboard.tsx` | Yes | team scope + validate/reject + **realtime** |
| `app/(tabs)/validation.tsx` | Yes | declarations + periods + cancel + **realtime** |
| `app/(tabs)/export.tsx` / `user-payroll.tsx` | Yes | select periods/declarations |
| `app/(tabs)/management.tsx` | Yes | profiles/chantiers/affectations + **Edge create/delete-user** + RPC cascade |
| `app/(tabs)/admin-users.tsx` | Yes | profiles + **Edge create/delete-user** |
| `app/(tabs)/admin-worksites.tsx` / `worksite-detail.tsx` | Yes | chantiers/affectations + RPC cascade |
| `app/(tabs)/team-management.tsx` | Yes | `zones_*` |
| `utils/team.ts`, `worksiteCode.ts`, `ouvrierDeclaration.ts` | Yes | select/insert (RPC week auto-approve **commented**) |
| `components/ouvrier/ChooseDayCalendar.tsx` | Yes | periods + declarations |

Chi tiết dòng: `migration-analysis/frontend-supabase-usage.md` — Phase 1 xác nhận pattern vẫn đúng (screens → supabase trực tiếp).

---

## 5. Dead services (không phải contract migrate)

| File | Class | UI import? | Kết luận |
|---|---|---|---|
| `services/auth.ts` | `AuthService` | **Không** (login dùng AuthContext) | Dead alternate |
| `services/periods.ts` | `PeriodsService` | **Không** | Dead |
| `services/worksites.ts` | `WorksitesService` | **Không** | Dead |
| `services/index.ts` | re-export | Không có screen import barrel cho class trên | Không dùng làm API contract |
| `services/biometricAuth.ts` | local PIN/biometric | Có (`login.tsx`) | Live nhưng **không** gọi Supabase |

---

## 6. Edge Functions surface

| Edge | Called from UI? | Callers | Ghi chú |
|---|---|---|---|
| `create-user` | **Yes** | `management.tsx`, `admin-users.tsx` (+ script tooling) | Live admin path |
| `delete-user` | **Yes** | `management.tsx`, `admin-users.tsx` | Live admin path |
| `seed-test-users` | **No** | Không có `functions/v1/seed-test-users` trong app | Tooling only — Keep/Drop ở Phase 5 |

Gọi bằng raw `fetch(`${supabaseUrl}/functions/v1/...`)` + session bearer — không `supabase.functions.invoke`.

---

## 7. Realtime surface

| Screen | Channel | Tables |
|---|---|---|
| `timesheet.tsx` | dynamic | `periodes_travail`, `declarations_heures` |
| `validation.tsx` | dynamic | `declarations_heures`, `periodes_travail` |
| `chef-dashboard.tsx` | `chef_dashboard_{profile.id}` | `periodes_travail` |

**Storage:** không dùng (SoT xác nhận lại — không có `.storage` trong app).

---

## 8. Super Admin / multi-company

| Brief kỳ vọng | Runtime code |
|---|---|
| 2 Supabase projects SuperAdmin + Company | 1 singleton client |
| Entity Company / Super Admin app | **Không** — roles app: `admin` \| `administratif` \| `chef_equipe` \| `ouvrier` |
| `auth.users.is_super_admin` trong seed migrations | Cột hệ thống Supabase Auth khi seed test users — **không** phải app Super Admin module |

→ Scope migrate mặc định = **single-tenant company DB**. Flow H / multi-company = greenfield (đã decision_log; P1_T03 xác nhận lại).

---

## 9. SoT delta (cập nhật Phase 1)

| Mục | SoT trước | Bổ sung Phase 1 |
|---|---|---|
| `hzppst…` | Chỉ CLI `linked-project.json` | + xuất hiện block 2 file `env` (notes local; không auto-load) |
| Secrets | Hardcode anon afgveikz | + file `env` chứa JWT claim `service_role` gán nhầm tên ANON_KEY |

Không có mâu thuẫn Master Plan ↔ SoT về dual-client / Super Admin — kết luận SoT **đúng**, bổ sung chi tiết `env`.

---

## 10. Acceptance map (Phase 1 Master Plan)

| Acceptance Criterion | Status | Proof |
|---|---|---|
| Chốt runtime URL/key | **PASS** | afgveikz + anon (`app.config.js` / `eas.json`) |
| Xác nhận không dual-client | **PASS** | Một `createClient` FE |
| Liệt kê Edge create-user / delete-user | **PASS** | §6 |
| Liệt kê realtime screens | **PASS** | §7 |
| Decision log Super Admin vs single-tenant | **PASS** | `tracking/decision_log.md` + P1_T03 |
