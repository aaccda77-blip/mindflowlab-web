# 📖 마인드플로우랩 명심코칭 종합 운영 런북 (Operations Runbook)

## 1. 목적 및 운영 철학
명심코칭의 운영은 "사용자의 사적인 이야기를 읽고 개입하는 CRM"이 아니라, **"서비스의 기술적 건전성, 안전성(Safety), 프라이버시(Privacy), 검색 품질을 모니터링하고 가드레일을 유지하는 시스템 운영"**입니다.
운영자는 매일 아침 2~5분 안에 운영센터([/admin/operations.html](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/operations.html))를 통해 당장 조치할 문제가 있는지 확인하고, 문제가 없다면 불필요한 제품 수정을 하지 않습니다.

---

## 2. 일일 5분 아침 점검 순서 (Daily 5-Minute Check)

1. **NEEDS ATTENTION 확인**:
   - P0/P1 긴급 인시던트가 존재하는가?
   - *"오늘 즉시 조치가 필요한 문제는 없습니다"* 문구가 보인다면 안심하고 대기.
2. **Safety Health (최우선 순위)**:
   - 4대 고위험(자해/자살 위기, 현실 폭력, 금융 고위험, 의료 고위험) 라우팅 상태 정상 여부 확인.
   - 오탐(False Positive) / 미탐(False Negative) 발생 여부 체크.
3. **Privacy Health**:
   - Analytics 및 에러 로그 내 사생활 원문 전송 건수가 정확히 `0건`인지 확인.
   - 공용 PC 교차 사용자 데이터 유출이 `0건`인지 확인.
4. **Service & Core Flow**:
   - 퍼널(START → SCAN → ACTION) 간 급격한 이탈(Anomaly)이 없는지 확인.
5. **Router & Search Quality**:
   - Zero Match(0건 매칭) 증가 여부 및 검색 갭(Content Gap) 확인.

---

## 3. 우선순위 체계 (Severity Levels)

| 등급 | 정의 | 대응 기준 | 예시 |
| :--- | :--- | :--- | :--- |
| **P0** | Safety / Privacy / Cross-user Data | **즉시 대응 (1시간 이내 격리)** | 위기 발화 미탐지, 원문 텍스트 분석 로그 유출, 사용자간 기록 노출 |
| **P1** | Core Flow Unavailable / Data Loss | **24시간 이내 수정** | 라우터 전면 중단, 1분 SCAN 완료 후 저장 실패 |
| **P2** | Major Feature Broken | **스프린트 내 조치** | Personal Home 작동지도 렌더링 오류, 30일 여정 타임라인 꼬임 |
| **P3** | Limited UX / Content Issue | **통상 업무 처리** | 도서 연결 링크 오류, 오탈자, 경미한 CSS 정렬 불일치 |

---

## 4. 비상 서킷 브레이커 (Emergency Circuit Breaker)
문제가 발생했을 때 전체 서비스를 다운시키는 '킬 스위치' 대신, 영향받는 서브시스템만 부분적으로 비활성화합니다.

- **JOURNEY 비활성화**: 30일 여정 관련 버그 발생 시 메뉴 숨김 처리.
- **WORKING_MAP 비활성화**: 작동지도 합성 로직 이상 시 비활성화.
- **SHARE 비활성화**: 카카오/OG 공유 페이로드 이상 시 공유 버튼 숨김 처리.
- **EXPERIMENT 비활성화**: 10% 행동실험 모달 이상 시 기본 안내로 Fallback.
- ⚠️ **주의**: `SAFETY` 및 `RULE_ROUTER` 코어는 어떠한 경우에도 비활성화할 수 없습니다.

---

## 5. 롤백 절차 (Rollback Procedure)
배포 직후 P0/P1 문제가 발견될 경우:
1. 운영센터에서 관련 서브시스템 긴급 비활성화.
2. Vercel 대시보드 또는 CLI(`vercel rollback`)를 통해 이전 배포 버전(`v1.0.0-rc-final`)으로 1초 즉시 복구.
3. 로컬 재현 테스트 케이스 작성 → 수정 → 전수 E2E 검증 통과 후 재배포.
