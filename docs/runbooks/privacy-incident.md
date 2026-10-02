# 🔒 Privacy 인시던트 대응 표준 런북 (Privacy Incident Runbook)

## 1. 개요 및 P0 규정 상황
다음 상황 중 하나라도 발생하면 즉시 **P0 긴급 인시던트**로 지정하고 대응팀을 소집합니다.
1. 사용자 A의 개인 고민 원문이나 작성 기록이 사용자 B에게 노출된 경우 (Cross-user Leak).
2. Analytics, Sentry, 또는 외부 로깅 시스템으로 사용자가 작성한 고민 텍스트가 전송된 경우 (Raw Text Ingestion).
3. 소셜 공유(Kakao/OG/URL) 링크에 사용자의 사적인 텍스트나 식별자가 포함된 경우.
4. 개인 사용자의 `/my/` 페이지나 기록이 검색 엔진에 인덱싱(Public Indexing)된 경우.

---

## 2. 긴급 조치 5단계 절차

### 1단계: IMMEDIATE MITIGATION (서킷 브레이커 가동)
- 운영센터([/admin/operations.html](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/operations.html))의 비상 서킷 브레이커에서 문제가 발생한 채널을 즉각 차단:
  - Analytics 유출 시: 이벤트 디스패처 즉각 중단.
  - 공유 링크 유출 시: `SHARE` 토글을 `OFF`로 전환하여 공유 UI 숨김.
  - 교차 노출 시: 브라우저 캐시 및 공용 세션 강제 만료(Wipe) 플래그 배포.

### 2단계: INVESTIGATE & CONTAIN (원인 규명 및 격리)
- `js/myungsim-privacy-manager.js` 또는 `js/myeongsim-ai-router.js`의 페이로드 직렬화 파이프라인 분석.
- 화이트리스트 필터링(`cardId`, `packId`, `timestamp`만 허용)이 누락된 경로 파악.

### 3단계: PURGE & SCRUB (외부 수집 데이터 소거)
- 외부 분석 툴이나 로그 저장소에 유입된 레코드가 있다면 즉시 영구 삭제 요청(Data Scrubbing).
- 유출 범위 및 영향도 평가 (개인 식별 가능 여부 확인).

### 4단계: AUTOMATED REGRESSION TEST (방어 테스트 추가)
- `scripts/test-master-production-e2e.js` 내에 동일한 데이터 형태 주입 시 원문 유출 건수가 0건인지 단언(Assert)하는 자동화 테스트 추가.

### 5단계: REVIEW & AUDIT LOG (감사 기록)
- 변경 내역을 운영 감사 로그에 기록.
- 재발 방지 대책 수립 후 인시던트 종결.
