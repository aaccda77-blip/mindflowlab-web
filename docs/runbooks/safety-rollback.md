# 🛡️ Safety 가드레일 긴급 롤백 런북 (Safety Rollback Runbook)

## 1. 개요 및 발동 상황 (P0 긴급 상황)
- 안전 규칙 배포 후 자해/위기/폭력 발화가 정상적으로 감지되지 않고 일반 카드로 진입하는 치명적 회귀(False Negative)가 발생한 경우.
- 일상적 대화가 과도하게 차단되는 심각한 오탐(False Positive)이 발생한 경우.

---

## 2. 긴급 조치 절차

1. **Safety 설정 스냅샷 복구**:
   - `getSafetySnapshot()`을 통해 검증 완료된 직전 버전(`v2.1.0`)으로 즉시 원복.
2. **Safety 회귀 테스트 즉각 실행**:
   - `node scripts/test-master-production-e2e.js` 내 Safety Part 실행 (위기/폭력/금융/의료 4대 경로 100% 차단 확인).
3. **P0 인시던트 연동 및 감사 기록**:
   - 운영센터에 인시던트 번호 발의 및 조치 내역 기록.
