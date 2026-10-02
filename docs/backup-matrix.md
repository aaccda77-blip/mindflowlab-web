# 📊 명심코칭 백업 및 복구 매트릭스 (Backup Matrix)

## 1. 데이터별 Source of Truth, RPO, RTO 매트릭스

| 데이터 항목 | Source of Truth | 백업 여부 | 백업 주기 | 보존 기간 | 암호화 | 복구 방법 | RPO | RTO |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Canonical Cards (200종)** | Git Repository / Canonical DB | YES | 릴리즈 시마다 | 영구 (버전별) | AES-256 | Snapshot Restore | 0 | < 15분 |
| **Router Configuration** | Versioned Config File | YES | 변경 시마다 | 영구 | 표준 암호화 | Config Rollback | 0 | < 10분 |
| **Safety Guardrails & Copy** | Versioned Safety File | YES | 변경 시마다 | 영구 | 표준 암호화 | Safety Rollback | 0 | < 5분 |
| **Private SCAN & History** | Browser LocalStorage / DB | YES | 매일 1회 | 30일 | At-rest / 격리 | Deletion Replay 복원 | < 24시간 | < 1시간 |
| **Behavior Experiments** | Browser LocalStorage / DB | YES | 매일 1회 | 30일 | At-rest / 격리 | Deletion Replay 복원 | < 24시간 | < 1시간 |
| **Personal Working Map** | Derived from Private Records | OPTIONAL | 주 1회 | 30일 | At-rest / 격리 | Source로부터 Rebuild | < 7일 | < 30분 |
| **30-Day Journey Records** | Browser LocalStorage / DB | YES | 매일 1회 | 60일 | At-rest / 격리 | Deletion Replay 복원 | < 24시간 | < 1시간 |
| **Aggregated Metrics** | Metric Store (Anonymous) | YES | 주 1회 | 1년 | 표준 암호화 | Event Re-aggregate | < 7일 | < 24시간 |
| **Search / In-Memory Index** | Canonical Cards | NO (Rebuild) | N/A | N/A | N/A | Auto Re-index | 0 | < 5분 |
| **Secrets & Credentials** | Secret Manager / Vercel Env | NO (Plaintext 금지)| 분기 1회 회전 | N/A | Secret Store 암호화| Secret Rotation | 0 | < 30분 |

---

## 2. 현실적인 RPO / RTO 보증 기준
- **RPO (Recovery Point Objective)**:
  - Canonical 제품 지식 데이터: **RPO 0** (Git 커밋 및 배포 아티팩트와 완전 일치).
  - 사용자 사적 데이터: **RPO 24시간** (일일 스토리지 백업 주기 기준).
- **RTO (Recovery Time Objective)**:
  - 공개 사이트 및 라우터 핵심 코어: **RTO < 15분** (정적 롤백 및 캐시 무효화).
  - 개인 사용자 데이터 복원 및 Deletion Replay 검증: **RTO < 1시간**.
