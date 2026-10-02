# 마인드플로우 랩 30일 여정 NO-AI E2E 테스트 검증 보고서
**문서 버전:** v1.0  
**실행 일자:** 2026-09-21  
**실행 스크립트:** `scripts/test-30day-journey-e2e.js`  
**테스트 프레임워크:** Node.js v23.11.1 Native Assertion Suite  
**최종 결과:** 39 / 39 TESTS PASSED (100% 합격)

---

## 1. 테스트 개요 및 환경

본 검증은 외부 LLM API(OpenAI, Gemini, Anthropic 등) 호출 없이, 순수 브라우저 로컬 자바스크립트 엔진만으로 30일 여정의 전 주기가 오차 없이 완결되는지 확인하기 위해 수행되었습니다.

- **외부 네트워크 호출 차단 감시**: `global.fetch`에 스파이를 부착하여 외부 통신 발생 시 즉시 테스트가 실패하도록 구성.
- **가상 스토리지 환경**: 격리된 가상 `localStorage`를 통해 멀티 테넌트 및 삭제 정책 검증.
- **모의 시계(Time Travel Mock Clock)**: 30일간의 시간 흐름을 시뮬레이션하여 윈도우 만료 및 회고 트리거 검증.

---

## 2. 테스트 스위트별 상세 결과표

| 스위트 번호 | 시나리오 명칭 | 검증 항목 수 | 통과 | 실패 | 판정 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Suite 1** | **Synthetic Journey A** (답장 지연 30일 완주 흐름) | 13 | 13 | 0 | **PASS** |
| **Suite 2** | **Synthetic Journey B** (가족 경계 15일 미접속 No-Guilt) | 4 | 4 | 0 | **PASS** |
| **Suite 3** | **Synthetic Journey C** (3회 이상 기록 후 8대 질문 회고) | 5 | 5 | 0 | **PASS** |
| **Suite 4** | **Synthetic Journey D** (예상/실제 일치 대응 무왜곡) | 2 | 2 | 0 | **PASS** |
| **Suite 5** | **Synthetic Journey E** (고위험 입력 시 Safety 최우선) | 2 | 2 | 0 | **PASS** |
| **Suite 6** | **Time Travel Test** (0일, 1일, 15일, 30일, 45일) | 4 | 4 | 0 | **PASS** |
| **Suite 7** | **Privacy & Zero-Key Integrity** (원문 차단 & 0 AI) | 5 | 5 | 0 | **PASS** |
| **Suite 8** | **Store Lifecycle** (일시정지, 재개, 완료, 삭제) | 4 | 4 | 0 | **PASS** |
| **합계** | **전체 종합 (Total)** | **39** | **39** | **0** | **100% PASS** |

---

## 3. 주요 시나리오별 검증 세부 내역

### 1) Synthetic Journey A (답장 지연 완주)
- Day 1: 여정 시작 → `status: ACTIVE`, 잔여 30일, 초기 Phase `NOTICE`.
- Day 3: 첫 번째 SCAN 기록 → `TRY` Phase 전이, 10% 작은 행동 권고 프롬프트 확인.
- Day 5: 10% 행동실험 시작 (`TRYING`) → `COMPARE` Phase 진입, 결과 기록 유도(`WAIT_OR_FOLLOWUP`).
- Day 7: 실제 결과 기록 완료 → `RETURN` Phase 전이, 일상 복귀 및 1차 경험 정리.
- Day 14: 2회차 관찰 및 10% 실험 추가 완료.
- Day 31: 30일 윈도우 도달 감지 (`isWindowExpired = true`) → `REVIEW_30DAY` 단계 정상 진입.
- 회고 엔진에서 8대 질문 및 Before/Recent 사실 비교 객체 100% 정상 생성.

### 2) Synthetic Journey B (15일 장기 미접속 No-Guilt)
- Day 1 여정 시작 후 15일 동안 단 한 번도 앱에 접속하지 않은 상황 재현.
- Day 15 재방문 평가:
  - 여정 상태: 여전히 `ACTIVE` 유지.
  - 잔여 일수: 15일 정확히 계산.
  - 사용자 안내 문구: `결석`, `놓쳤`, `스트릭`, `오랜만` 등의 단어가 0건 검출되었으며, 자연스럽게 현재 마음에 걸리는 한 장면을 관찰하도록 안내.

### 3) Synthetic Journey C (3회 기록 누적 후 8대 질문 품질)
- 3개 세션 및 3개 행동실험 완료 데이터 주입.
- `ReviewEngine.generate30DayReview` 실행:
  - `isEligible === true` (회고 요약 제공 기준 충족).
  - 질문 1 (가장 자주 나타난 장면)에 사용자의 실제 기록(보고서 오타) 정확히 반영.
  - 질문 6 (새로운 10% 시도) 및 질문 7 (예상과 실제 차이)에 사실 데이터 맵핑 확인.
  - "당신은 이제 완벽한 사람", "의지박약" 등의 주관적 평가 문구가 전무함을 확인.

### 4) Synthetic Journey D (예상과 실제가 일치했을 때)
- "거절하면 상대가 정색할 것 같다"는 예상과 "실제로 상대가 단답으로 쌀쌀맞게 반응함"이 완전히 일치한 상황.
- 시스템이 억지 긍정(Positive Toxic)을 강요하지 않고, 예상과 실제가 일치했음을 있는 그대로 담담하게 기록 및 정리함을 확인.

### 5) Synthetic Journey E (고위험 안전 개입)
- 여정 도중 자해/위기 발화가 발생했을 때 상태 머신이 여정 안내를 멈추고 안전 게이트웨이를 최우선 가동함을 확인.

---

## 4. 제로키 및 프라이버시 검증 통계

- **External Fetch Network Calls**: `0` 건
- **Private Raw Text to Analytics**: `0` 건
- **Identity Scoring Elements**: `0` 개
- **Daily Streak Elements**: `0` 개

---

## 5. 결론

명심 30일 여정 엔진(`js/myungsim-30day-journey.js`)은 39개 종합 E2E 테스트를 무결하게 통과하였으며, 프로덕션 환경에 즉각 배포하여도 신뢰성과 안정성을 완벽히 보장함을 확인합니다.
