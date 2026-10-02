# 🎯 Router 인시던트 대응 표준 런북 (Router Incident Runbook)

## 1. 개요 및 장애 유형
- **P1 (Critical)**: `RuleBasedRouter` 실행 중단으로 사용자 고민 입력 시 카드가 전혀 추천되지 않거나 스크립트 에러가 발생하는 경우.
- **P2 (Major)**: 특정 핵심 키워드군에서 0건 결과(Zero Match) 또는 연관성 없는 카드가 반복적으로 매칭되는 경우.
- **P3 (Minor)**: 동의어 누락으로 인한 약한 매칭(Weak Match).

---

## 2. 대응 절차

### 1단계: Fallback 및 상태 확인
- `js/myeongsim-ai-router.js`의 Fallback 카드 풀(각 카테고리별 대표 5대 카드)이 정상적으로 표출되고 있는지 확인.
- 사용자에게 빈 화면이나 자바스크립트 오류가 노출되지 않도록 방어 뷰가 작동하는지 점검.

### 2단계: 사전 및 인덱스 정합성 검사
- 최근 카드 데이터(`data/cards.json` 등) 발행 후 형태소 사전 인덱스가 재생성되었는지 확인 (`contentVersion` 및 `routerVersion` 일치 여부).
- 불완전한 정규표현식이나 ReDoS 유발 패턴이 삽입되었는지 점검 (500자 컷오프 유효성 확인).

### 3단계: 골든셋 회귀 테스트 실행
- 로컬 CLI에서 라우터 골든셋 평가 스크립트 실행:
  `python scripts/evaluate-golden-router.py` (또는 해당 JS 러너)
- 정확도 및 Top 3 매칭 성공률 90% 이상 복원 확인.

### 4단계: 배포 및 운영센터 확인
- 수정 사항 배포 후 [/admin/operations.html](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/operations.html)의 Router Health 상태가 `HEALTHY`로 복귀하는지 확인.
