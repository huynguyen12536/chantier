# 🔐 Tạo tài khoản Auth trong Supabase

## 📋 **Danh sách tài khoản cần tạo**

Vào **Supabase Dashboard** → **Authentication** → **Users** → **Add user**

### **1. Admin**
- **Email**: `admin@gmail.com`
- **Password**: `123456`
- **User ID**: `11111111-1111-1111-1111-111111111111`
- ✅ **Auto Confirm User** (quan trọng!)

### **2. Chef d'équipe**
- **Email**: `chef@gmail.com`
- **Password**: `123456`
- **User ID**: `22222222-2222-2222-2222-222222222222`
- ✅ **Auto Confirm User**

### **3. Ouvrier 1**
- **Email**: `ouvrier@gmail.com`
- **Password**: `123456`
- **User ID**: `33333333-3333-3333-3333-333333333333`
- ✅ **Auto Confirm User**

### **4. Administratif (Paie)**
- **Email**: `admin-paie@gmail.com`
- **Password**: `123456`
- **User ID**: `44444444-4444-4444-4444-444444444444`
- ✅ **Auto Confirm User**

### **5. Ouvrier 2**
- **Email**: `ouvrier2@gmail.com`
- **Password**: `123456`
- **User ID**: `55555555-5555-5555-5555-555555555555`
- ✅ **Auto Confirm User**

---

## 🚀 **Sau khi tạo Auth Users**

1. **Chạy Migration**: Copy nội dung `supabase/migrations/add_user_accounts.sql` vào SQL Editor
2. **Execute** để tạo profiles và affectations
3. **Test login** với các tài khoản trên

---

## ✅ **Tài khoản test**

| Email | Password | Role | Quyền |
|-------|----------|------|-------|
| admin@gmail.com | 123456 | Admin | Toàn quyền |
| chef@gmail.com | 123456 | Chef d'équipe | Quản lý nhóm |
| ouvrier@gmail.com | 123456 | Ouvrier | Khai báo giờ |
| admin-paie@gmail.com | 123456 | Administratif | Export dữ liệu |
| ouvrier2@gmail.com | 123456 | Ouvrier | Khai báo giờ |

---

## 🔧 **Lưu ý quan trọng**

- **PHẢI** sử dụng đúng User ID như trên
- **PHẢI** check "Auto Confirm User"
- Chạy migration AFTER tạo Auth users
- Test login sau khi setup xong