# 🚀 Release & Deployment Guide

Pipeline chỉ được kích hoạt khi tạo **Git Tag** theo đúng format:

```bash
v1.0.0
v1.0.1
v2.0.0
```

---

## Cách tạo Tag trên GitHub UI

### Bước 1

Truy cập:

```text
Repository → Releases
```

### Bước 2

Chọn:

```text
Draft a new release
```

### Bước 3

Nhập tag mới, ví dụ:

```text
v1.0.5
```

### Bước 4

Chọn **Publish Release**

Sau khi Release được publish, GitHub Actions sẽ tự động kích hoạt pipeline deployment.

---

## Kiểm tra Pipeline

Sau khi pipeline chạy:

```text
Repository → Actions → Pipeline
```

Kiểm tra các bước:

* Lint
* Syntax Check
* Build
* Deploy

Nếu phát hiện lỗi, vui lòng sửa source code và tạo release mới để chạy lại pipeline.

---

## Lưu ý

⚠️ Mọi thay đổi liên quan đến:

* `.env`
* Port
* Infrastructure Configuration

Vui lòng liên hệ team **DevOps** trước khi thực hiện.

---

## Environment

Web URL:

```text
https://chantier.vm.dfm-europe.com/
```

---

Cảm ơn mọi người ❤️
