# 07_DEFAULT_VALUE_AUDIT.md

**Compared at:** 2026-07-16T01:32:38.937Z

NULL ≠ '' ≠ false ≠ 0 ≠ generated default.

| table | id | column | source | dest | classification | reason | severity |
|---|---|---|---|---|---|---|---|
| profiles | 05fae8ca-461d-480a-9ee0-8ee80cc0e85f | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | 1200f3b8-b1d0-44ea-a75d-60f10993477b | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | 1d5ac48f-9eae-452a-a998-1b480f87ce18 | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | 47c68c11-eff5-4ba3-9368-252c38d30825 | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | 5609a530-0e12-4e78-8104-d810cae90075 | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | abcca969-52ff-40fc-902d-82de4743462f | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | aef70554-b535-4408-9407-946db41f772d | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | eb5d70b5-0e89-49df-8254-01eaaf25ad3e | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
| profiles | f7c50816-459c-4a6d-a782-fe498d1988e4 | actif |  | true | DEFAULTED | COALESCE(..., TRUE) — merged had no actif | LOW |
