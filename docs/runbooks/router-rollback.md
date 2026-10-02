# 🎯 라우터 설정 롤백 런북 (Router Rollback Runbook)

## 1. 개요 및 발동 상황
- 라우터 가중치 수정이나 새 동의어 사전 배포 후 0건 매칭(Zero Match) 또는 엉뚱한 카드 매칭(Weak Match)이 급증하는 경우.

---

## 2. 롤백 절차

1. **라우터 설정 스냅샷 확인**:
   - `getRouterSnapshot()`을 통해 이전 안정 버전(`v1.7.0` 등) 확인.
2. **이전 가중치 및 동의어 사전 복구**:
   - `js/myeongsim-rule-router.js`의 TF-IDF 파라미터 및 동의어 사전 이전 커밋으로 되돌림.
3. **골든셋 스모크 테스트 실행**:
   - 대표 10개 핵심 질문에 대해 기대 카드 Top 3가 정확히 매칭되는지 CLI에서 검증.
4. **운영센터 확인**:
   - `/admin/operations.html`에서 Router Health가 `HEALTHY`로 전환되었는지 확인.
