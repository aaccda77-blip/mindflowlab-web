# 🚨 전사 재해 복구 종합 12단계 런북 (Disaster Recovery Runbook)

## 1. 개요 및 복구 원칙
- **철칙**: "복구는 단순히 과거 백업을 덮어쓰는 작업이 아니라, **올바른 데이터만 올바른 사용자에게 다시 연결하고, 삭제된 데이터가 재등장하지 않도록 보장하는 작업**이다."

---

## 2. 12단계 표준 복구 절차 (End-to-End Recovery Flow)

```text
1. INCIDENT DECLARATION (재해 선포 및 P0/P1 분류)
   ↓
2. WRITE FREEZE (쓰기 동결 / READ_ONLY 모드 전환)
   ↓
3. BACKUP VERIFY (백업 파일 체크섬 및 무결성 검증)
   ↓
4. TARGET RESTORE POINT SELECT (복원 시점 선정)
   ↓
5. RESTORE (격리 환경 복원 수행)
   ↓
6. MIGRATION & SCHEMA VERIFY (스키마 정합성 검증)
   ↓
7. DELETION REPLAY (삭제 원장 재적용 - 과거 삭제분 소거)
   ↓
8. INDEX REBUILD (형태소 사전 및 라우터 인덱스 재생성)
   ↓
9. SAFETY & PRIVACY VERIFY (안전망 및 교차 격리 검증)
   ↓
10. CORE E2E TEST (합성 사용자로 1분 코칭 플로우 검증)
   ↓
11. TRAFFIC RESTORE (운영 모드 NORMAL 복귀 및 트래픽 재개)
   ↓
12. POSTMORTEM (원인 분석 및 제품 학습 아카이브 등록)
```

### 단계별 상세 행동 수칙
- **Step 2 (Write Freeze)**: 운영센터에서 `READ_ONLY`로 전환하여 복구 진행 중 데이터 꼬임 방지.
- **Step 7 (Deletion Replay)**: 구형 백업 복원 시 삭제 원장(Tombstone)을 대조하여, 과거 사용자가 삭제한 기록을 100% 필터링 소거.
- **Step 9 (Safety/Privacy)**: 복구 직후 User A의 데이터가 User B에게 노출되지 않는지(`Cross-User Exposure: 0`), 고위험 키워드가 정상 차단되는지 필수 확인.
- **Step 11 (Traffic Restore)**: 운영자 최종 승인 후 대시보드에서 `NORMAL` 모드로 스위칭.
