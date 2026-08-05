# 10_BUSINESS_PRESERVATION_SCORE.md

**Compared at:** 2026-07-16T01:32:38.937Z

## Formula

```
BPS = 100 × Σ(points) / Σ(weights)

For each scored business fact with weight W:
  MATCH | TRANSFORMED     → points = W
  CAPABILITY_LOSS         → points = 0.25 × W
  LOST | LOST_AUTHENTICATION | MODIFIED | GENERATED | DEFAULTED | UNKNOWN → points = 0

Structural equality (row count, UUID set, FK, checksum) → weight = 0 (excluded).
Auth: each business user original_login has weight 20.
```

## Result

| Metric | Value |
|---|---:|
| Σ weights | 8016.00 |
| Σ points | 5720.50 |
| **BPS** | **71.36 / 100** |

## Points by classification

| status | facts | weight | points |
|---|---:|---:|---:|
| LOST_AUTHENTICATION | 18 | 180.00 | 0.00 |
| DEFAULTED | 9 | 9.00 | 0.00 |
| MATCH | 1357 | 4445.00 | 4445.00 |
| GENERATED | 15 | 15.00 | 0.00 |
| TRANSFORMED | 190 | 587.00 | 587.00 |
| CAPABILITY_LOSS | 299 | 2754.00 | 688.50 |
| LOST | 5 | 26.00 | 0.00 |

## Interpretation

| BPS range | Typical verdict band |
|---|---|
| ≥ 99.5 | COMPLETE BUSINESS PARITY |
| 95–99.5 | BUSINESS EQUIVALENT (metadata only) |
| 70–95 | PARTIAL BUSINESS PARITY |
| < 70 or any CRITICAL auth/identity LOST | BUSINESS DATA LOSS |

Current BPS **71.36** with CRITICAL auth/identity losses → see 11.
