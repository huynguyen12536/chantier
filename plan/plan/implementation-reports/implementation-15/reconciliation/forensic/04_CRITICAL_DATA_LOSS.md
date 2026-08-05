# 04_CRITICAL_DATA_LOSS.md

**Compared at:** 2026-07-16T01:21:43.040Z

Findings with BUSINESS information removed or unrecoverable (not mere capability).

| severity | table | id | field | status | source | evidence | recovery |
|---|---|---|---|---|---|---|---|
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | matricule | LOST/MERGE_DISCARD | "USR750160" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="" discarded="USR750160" | Re-merge with field-level policy or restore from hzppst dump |
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | nom | LOST/MERGE_DISCARD | "Arson" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="Asron" discarded="Arson" | Re-merge with field-level policy or restore from hzppst dump |
| CRITICAL | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | phone | LOST/MERGE_DISCARD | "+33234234234" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="+33342342354" discarded="+33234234234" | Re-merge with field-level policy or restore from hzppst dump |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | created_at | LOST/MERGE_DISCARD | "2026-06-25T06:25:50.653Z" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="2026-06-18T08:38:27.151Z" discarded="2026-06-25T06:25:50.653Z" | Re-merge with field-level policy or restore from hzppst dump |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | id | LOST/MERGE_DISCARD | "00ff4c88-626c-44a3-93b2-e6964af2ad73" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="1200f3b8-b1d0-44ea-a75d-60f10993477b" discarded="00ff4c88-626c-44a3-93b2-e6964af2ad73" | Re-merge with field-level policy or restore from hzppst dump |
| MEDIUM | profiles | 00ff4c88-626c-44a3-93b2-e6964af2ad73 | updated_at | LOST/MERGE_DISCARD | "2026-06-25T06:25:50.653Z" | email collision policy: keep afgveikz profile, discard hzppst profile row; kept="2026-06-18T08:38:27.151Z" discarded="2026-06-25T06:25:50.653Z" | Re-merge with field-level policy or restore from hzppst dump |

## Auth (always critical when lost)

LOST AUTHENTICATION count: **9**  
See `08_AUTHENTICATION_PARITY.md`.
