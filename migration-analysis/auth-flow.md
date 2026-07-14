# Authentication Flow

**Nguồn:** Frontend `AuthContext`, Edge `create-user`/`delete-user`, migrations seed `auth.users`, schema `profiles`.

---

## 1. Thành phần identity

| Layer | Vai trò |
|-------|---------|
| `auth.users` (Supabase Auth) | Email/password, JWT session |
| `public.profiles` | Profile app + **role RBAC** (`id` = `auth.users.id`) |
| JWT | Standard Supabase access token; claim `sub` = user id |
| Custom claims | **Không** thấy app_metadata role enforcement phía FE; role lấy từ bảng `profiles` |

---

## 2. Login (Employee / Chef / Admin)

```
login.tsx
  → AuthContext.signIn(email, password)
  → supabase.auth.signInWithPassword
  → Session JWT persisted
  → onAuthStateChange / getSession
  → SELECT profiles WHERE id = user.id
  → Nếu ouvrier|chef: load affectations (+ zones_ouvriers)
  → getHomeRouteForRole(profile.role) → điều hướng tabs
```

**Nguồn:** `contexts/AuthContext.tsx`, `utils/role.ts`, `app/(auth)/login.tsx`.

Biometric/PIN: chỉ unlock local device sau khi đã từng login — không thay Auth Supabase.

Logout: `signOut({ scope: 'local' })` — xóa session client, không revoke server bắt buộc.

---

## 3. Tạo user (Admin / Administratif)

**Không** dùng `supabase.auth.signUp` từ client (tránh self-signup mở).

```
management / admin-users
  → getSession access_token
  → POST /functions/v1/create-user
  → Edge decode JWT sub
  → service role: kiểm tra profiles.role ∈ {admin, administratif}
  → auth.admin.createUser (email_confirm: true)
  → INSERT profiles (cùng id)
  → nếu profile fail → deleteUser rollback
```

**Không có** trigger `on_auth_user_created` trong migrations để auto-insert profile. Profile = bước 2 trong Edge (hoặc seed SQL test).

---

## 4. Xóa user

```
Admin only (Edge kiểm tra role === 'admin')
  → chặn self-delete
  → chặn nếu còn zones_equipe (RESTRICT FK)
  → auth.admin.deleteUser
  → CASCADE profiles + dữ liệu user (periods, declarations, affectations user_id…)
  → chef_equipe_id trên affectations → SET NULL
```

---

## 5. Trigger sau signup / tạo user

| Hook | Có trong repo? |
|------|----------------|
| Trigger AFTER INSERT `auth.users` → profiles | **Không** — Phase 2 dump: **0 triggers** trên `auth.users` (`hzppst`) |
| Trigger tạo company / admin | **Không** |
| Seed migrations insert thẳng `auth.users` + profiles | Có (test accounts only) |

`auth.users.is_super_admin` trong seed = cột Auth hệ thống, **không** phải role app Super Admin multi-company.

---

## 6. JWT / claims thực tế

- FE đọc `session.user.id`, không decode custom role từ JWT cho RBAC.
- Edge `create-user` decode payload base64 lấy `sub` (không verify signature riêng — dựa HTTPS + service checks).
- Không thấy `auth.jwt()` custom claim `company_id` / `role` trong RLS — RLS luôn `EXISTS (SELECT role FROM profiles WHERE id = auth.uid())` hoặc helpers tương đương.

---

## 7. Mapping brief Super Admin

Hệ thống **hiện tại không có** luồng:

`Super Admin signup → tạo Company → provision Company DB → tạo Admin`.

Chỉ có: Admin (trong DB company) tạo users nội bộ qua Edge.
