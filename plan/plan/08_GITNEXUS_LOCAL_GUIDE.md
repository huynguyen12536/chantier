# GitNexus — Hướng dẫn dùng local (Chantier)

> **Chỉ chạy trên máy bạn.** Không commit/push `.gitnexus/`, không thêm `gitnexus` vào `package.json` của app.
> File này nằm trong `plan/` — dùng nội bộ.

## Workspace cần index

| Repo / folder | Path gợi ý | Mục đích |
|---|---|---|
| Backend | `api-chantier/` | Impact analysis Express modules |
| Frontend | `chantier1/Chantier-web-app-main/Chantier-web-app-main/` | Trace FE ↔ Supabase / API client mới |

> Index MCP hiện có thể vẫn trỏ repo **Hawk** cũ. Với Chantier: **analyze lại** các path trên.

## Lệnh thường dùng

### Sau khi sửa code

```powershell
cd C:\Users\Gigabyte\Downloads\DFM\chantier\api-chantier
gitnexus analyze --index-only

cd C:\Users\Gigabyte\Downloads\DFM\chantier\chantier1\Chantier-web-app-main\Chantier-web-app-main
gitnexus analyze --index-only
```

| Flag | Ý nghĩa |
|---|---|
| `--index-only` | Chỉ cập nhật `.gitnexus/` — không ghi `AGENTS.md` vào repo |
| `--force` | Rebuild khi index lỗi |

### Kiểm tra

```powershell
gitnexus list
cd api-chantier
gitnexus status
```

### Trong Cursor (MCP)

Ví dụ prompt:
- *"GitNexus impact nếu đổi `sync_declarations_from_periods` equivalent trong api-chantier"*
- *"Trace FE declare-day insert periodes_travail"*
- *"Query: luồng validation approve → periods"*

### Web UI (tuỳ chọn)

```powershell
gitnexus serve --host 127.0.0.1
```

Mở http://127.0.0.1:4747

## Workflow

```
Sửa code api-chantier/ hoặc FE
    ↓
gitnexus analyze --index-only
    ↓
Hỏi Cursor / Web UI nếu cần impact
    ↓
Commit (không gồm .gitnexus/)
```

## Không push

```
.gitnexus/
AGENTS.md   # nếu GitNexus tạo — dùng --index-only để tránh
```

Thêm vào `.git/info/exclude` hoặc `.gitignore` local.

## Lỗi thường gặp

| Triệu chứng | Xử lý |
|---|---|
| Agent chỉ thấy Hawk repos | `gitnexus analyze` trên `api-chantier` + FE Chantier |
| Index stale | `gitnexus status` → analyze lại |
| `127.0.0.1:4747` refused | `gitnexus serve --host 127.0.0.1` |

## Liên hệ plan/

- Dùng khi task Phase 7/9/10 cần impact (triggers → services, FE wire API).  
- Sau task lớn: analyze trước review tiếp.  
- SoT nghiệp vụ vẫn là `migration-analysis/` — GitNexus bổ sung graph code, không thay SoT.
