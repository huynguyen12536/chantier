# Cách thêm task mới vào Agentic Flow — Chantier

## Câu hỏi thường gặp

### Agent có tự sinh plan rồi làm không?

**Không tự implement** ngoài task. Folder `plan/` = khung + Master Plan phases.  
Bạn tạo (hoặc duyệt) task file → agent execute đúng In Scope.

Nhờ agent **soạn task** từ mô tả là OK — cần duyệt trước khi Implementation.

SoT hành vi legacy: **`migration-analysis/`**, không đoán.

---

## Ví dụ: task Phase 1 — Validate Supabase client / env

### Bước 1 — Scope

- **Làm gì:** Xác nhận singleton client, URL `afgveikz…` vs CLI `hzppst…`, liệt kê Edge live
- **Không làm gì:** Không đổi code FE/BE, không dump DB
- **Repo:** Documentation trong `plan/` + có thể ghi note SoT nếu cần
- **Task Type:** Validation / Documentation
- **Review:** Software Architect

### Bước 2 — Phase folder (khuyến nghị theo Master Plan)

```
plan/plan/phases/phase_01_architecture_validation/
├── PHASE.md
└── tasks/
    └── P1_T01_validate_supabase_runtime.md
```

Copy `templates/PHASE_TEMPLATE.md` → điền Goal khớp Phase 1 trong `00_README_EXECUTION.md`.

### Bước 3 — Task file

Copy `templates/TASK_TEMPLATE.md`.

ID: `P1_T01_validate_supabase_runtime`

Điền:
- Task Type
- In Scope / Out of Scope
- Inputs: `00-IMPORTANT-FINDINGS.md`, `frontend-overview.md`, `frontend-supabase-usage.md`
- Implementation Root (có thể chỉ `plan/plan/` nếu Documentation)
- Acceptance Criteria đo được

### Bước 4 — Status board

Thêm dòng Todo trong `tracking/status_board.md`.

### Bước 5 — Prompt

Dùng `06_PROMPT_CHEATSHEET.md` section 1 hoặc:

```
Execute task P1_T01_validate_supabase_runtime per 02_PRP_AI_Execution_Playbook.md.
Task file: plan/plan/phases/phase_01_architecture_validation/tasks/P1_T01_validate_supabase_runtime.md
Read SoT listed in Inputs. Update status_board.
```

---

## Ví dụ Implementation (sau khi Phase 4–7 sẵn sàng)

| Field | Ví dụ |
|---|---|
| ID | `P9_T05_timesheet_sync_declarations` |
| Type | Implementation |
| Root | `api-chantier/` |
| SoT | `triggers/trigger_sync_declarations.md`, `functions/sync_declarations_from_periods.md` |
| Reviews | Senior Developer, Security Engineer, Database Optimizer |

---

## Checklist trước khi chạy agent

- [ ] Align phase trong `00_README_EXECUTION.md`
- [ ] Task Type rõ
- [ ] In Scope / Out of Scope rõ
- [ ] SoT paths trong Inputs
- [ ] Acceptance criteria checkbox đo được
- [ ] Primary Agent + Required Reviews (`03_AGENT_ROUTING.md`)
- [ ] Dòng status_board (Todo)
- [ ] Implementation root đúng (`api-chantier/` / FE / `plan/plan/`)

---

## `phases/_example/`

Chỉ minh họa format. **Không** phải backlog thật.
