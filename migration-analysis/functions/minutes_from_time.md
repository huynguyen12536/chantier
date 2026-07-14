# `minutes_from_time`

**Nguồn repo:** `20260618071528_chantier_frame_hours_breakdown.sql`.  
**Phase 2:** **Không có trên production `hzppst`** (repo-only / not deployed).

## Mục đích

Đổi `time` → số phút từ 00:00 (phục vụ cắt khung giờ).

## Signature

- **Input:** `t time`
- **Output:** `integer`
- **Attributes:** `IMMUTABLE` SQL

## Pseudo code

```
RETURN hour(t)*60 + minute(t)
```

## Side effects

Không.
