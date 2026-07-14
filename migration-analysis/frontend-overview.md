# Frontend Overview

**Nguồn:** Frontend Expo (`chantier1/Chantier-web-app-main/Chantier-web-app-main/`).  
**Không sửa code** — chỉ đọc.

---

## 1. Công nghệ

| Thành phần | Chi tiết |
|------------|----------|
| Framework | Expo / React Native (file-based routing `expo-router`) |
| UI | NativeWind / màn hình theo role |
| Backend client | `@supabase/supabase-js` |
| i18n | `fr` / `en` (`LanguageContext`) |

App root: `chantier1/Chantier-web-app-main/Chantier-web-app-main/`

---

## 2. Nơi Frontend kết nối Supabase

| Mục | Đường dẫn | Ghi chú |
|-----|-----------|---------|
| **Client duy nhất** | `services/supabase.ts` | `createClient(supabaseUrl, supabaseAnonKey)` |
| **URL / Anon key (hardcode Bolt)** | `app.config.js` | Inject vào `expo.extra` |
| **Env example** | `.env.example` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **EAS** | `eas.json` | Override env preview/production → cùng project `afgveikz…` |
| **Ghi chú local** | file `env` (không phải `.env`) | Có 2 block URL (afgveikz + hzppst); **không** được Expo load trừ khi copy sang `.env` |

Thứ tự resolve URL/key trong `services/supabase.ts`:

1. `process.env.EXPO_PUBLIC_SUPABASE_*`
2. Fallback `Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_*`

**Không có** dual client / switch project theo role.

**Phase 1 (2026-07-14):** Singleton confirmed; live surface vs dead services — xem `plan/plan/phases/phase_01_architecture_validation/CONFIRMATION_MATRIX.md`.

---

## 3. Auth

| File | Trách nhiệm |
|------|-------------|
| `contexts/AuthContext.tsx` | Session, profile, worksites đã gán, `signIn` / `signOut`, `onAuthStateChange` |
| `services/auth.ts` | Class `AuthService` (signIn/signOut/getProfile/updateProfile) — **export nhưng màn hình không dùng** |
| `app/(auth)/login.tsx` | Form login (gọi `useAuth().signIn`) |
| `app/(tabs)/profile.tsx` | Logout |
| `app/_layout.tsx` | Bao `AuthProvider`, điều hướng theo session/role |
| `utils/role.ts` | RBAC phía UI (tab, quyền validate/export/manage) |
| `services/biometricAuth.ts` | PIN / biometric local — **không** gọi Supabase Auth |

Auth mechanism: `supabase.auth.signInWithPassword` + JWT session persisted trên client. Không custom JWT claims trong Frontend.

---

## 4. Environment

| Biến | Mục đích |
|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Base URL project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `EXPO_FORCE_WEBCONTAINER_ENV` | Flag Bolt/webcontainer |

Giá trị runtime đã commit trỏ tới project **`afgveikzneaablcuzwdb`**.

---

## 5. Services layer

| File | Class / export | Dùng bởi UI? |
|------|----------------|--------------|
| `services/supabase.ts` | `supabase`, `supabaseUrl`, `supabaseAnonKey` | **Có** (hầu hết màn hình) |
| `services/auth.ts` | `AuthService` | **Không** (dead alternate) |
| `services/periods.ts` | `PeriodsService` | **Không** |
| `services/worksites.ts` | `WorksitesService` | **Không** |
| `services/index.ts` | Re-export | — |
| `services/biometricAuth.ts` | Local device auth | Có (login phụ) |

**Pattern thực tế:** màn hình gọi thẳng `supabase.from(...)` / `rpc` / `fetch` Edge Function. Không có Repository pattern.

---

## 6. Hooks

| File | Supabase? |
|------|-----------|
| `hooks/useTimeCalculations.ts` | Không |
| `hooks/useLocation.ts` | Không (GPS device) |
| `hooks/useTabBarInset.ts` | Không |
| `hooks/useFrameworkReady.ts` | Không |

Data fetching nằm trong screens + `AuthContext` + utils (`team.ts`, `ouvrierDeclaration.ts`).

---

## 7. API wrapper / Edge

Không có axios layer. Edge Functions được gọi bằng `fetch`:

```
POST ${supabaseUrl}/functions/v1/create-user
POST ${supabaseUrl}/functions/v1/delete-user
```

Header: `Authorization: Bearer <session access_token>`, `apikey: anon key`.

Định nghĩa Edge: `supabase/functions/create-user`, `delete-user`, `seed-test-users`.

---

## 8. Cấu trúc màn hình theo nghiệp vụ

```
app/
  (auth)/login.tsx
  (tabs)/
    ouvrier-dashboard.tsx      # Employee
    timesheet.tsx
    calendar.tsx / choose-day*
    chef-dashboard.tsx         # Supervisor
    validation.tsx
    team-management.tsx        # Zones équipe
    management.tsx             # Admin + chef: users/sites
    admin-users.tsx / admin-worksites.tsx
    worksite-detail.tsx
    export.tsx / user-payroll.tsx
    profile.tsx
  declare-day*.tsx             # Khai báo giờ
```

---

## 9. Types domain

`types/index.ts`: `UserRole`, `Profile`, `Chantier`, `AffectationChantier`, `PeriodeTravail`, `DeclarationHeures`.

Role string: `'ouvrier' | 'chef_equipe' | 'administratif' | 'admin'`.

---

## 10. Kết luận kiến trúc FE

1. Một Supabase project runtime.  
2. Auth + RBAC dựa `profiles.role` (DB) + helpers UI.  
3. Business I/O: PostgREST trực tiếp + 2 Edge Functions admin.  
4. Service classes gần như dead code — migrate backend nên **không** dựa vào chúng làm contract.  
5. Không có module Super Admin / multi-company trong Frontend này.
