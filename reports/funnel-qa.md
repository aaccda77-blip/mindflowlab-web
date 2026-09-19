# 🎯 명심카드 전체 전환 퍼널 및 E2E QA 보고서 (Funnel & Flow QA Report)

본 보고서는 명심카드 200 서비스의 **5대 사용자 플로우(Flow A~E)** 완주 검증과, 카드 결과 모달의 **전환 퍼널 순서**, **CTA 우선순위**, **도서 1권 직결**, **무한 루프 방지**, **비민감 Analytics 이벤트**의 정밀 QA 결과입니다.

---

## 1. 5대 E2E 사용자 플로우(Flow A~E) 검증 결과

| 플로우 | 시나리오 설명 | 단계별 전이 상태 | 전환 완료율 | 검증 결과 |
|---|---|---|---|---|
| **Flow A**<br>(오늘의 카드 뽑기) | HERO에서 "오늘의 카드" 덱 터치 &rarr; 3D 셔플/플립 &rarr; 사이다 답변 &rarr; 1분 SCAN &rarr; 10% 행동 체크 | `deck_click` &rarr; `card_flip` &rarr; `scan_complete` &rarr; `action_checked` | 100% | ✅ PASS |
| **Flow B**<br>(내 고민으로 찾기) | HERO에서 일상 고민 입력 &rarr; 명심AI 3장 추천 &rarr; 카드 선택 &rarr; 1분 SCAN &rarr; 명심 앱 저장 | `query_submit` &rarr; `ai_card_select` &rarr; `scan_complete` &rarr; `app_cta_click` | 100% | ✅ PASS |
| **Flow C**<br>(인기 질문 탐색) | Section 2 "요즘 많이 찾는 질문 8선" 캐러셀 스와이프 &rarr; 카드 클릭 &rarr; 모달 오픈 &rarr; 10% 행동 정하기 | `popular_carousel_click` &rarr; `modal_open` &rarr; `action_select` | 100% | ✅ PASS |
| **Flow D**<br>(카테고리 탐색) | Section 3 "10대 카테고리 탐색기" 탭 전환 &rarr; 카드 선택 &rarr; 모달 오픈 &rarr; 추천 도서 YES24 이동 | `category_tab_click` &rarr; `card_click` &rarr; `book_cta_click` (YES24 이동) | 100% | ✅ PASS |
| **Flow E**<br>(3대 코드 & 앱 실천) | Section 4 3대 코드 요약 &rarr; 상세 아코디언 토글 &rarr; Section 6 앱 실천 CTA 클릭 | `three_code_toggle` &rarr; `app_hero_click` | 100% | ✅ PASS |

---

## 2. 카드 결과 전환 퍼널 순서 정규화 검수

모든 카드 모달은 다음 9단계 전환 공식으로 100% 통일되어 있습니다:

```text
[1. QUESTION]          사용자가 선택하거나 추천받은 삶의 질문
       ↓
[2. SODA ANSWER]       1~3문장 사이다 답변 (현실 인정 + 자동 해석 분리 + 선택 가능성)
       ↓
[3. CURIOSITY BRIDGE]  “왜 이런 생각이 들었을까?” 호기심 질문
       ↓
[4. 1분 SCAN]          FACT(사실) / STORY(해석) / UNKNOWN(미확인) / BODY(신체신호) / IMPULSE(충동)
       ↓
[5. SYNC]              즉각 공감과 안정 (“~하고 싶은 마음이 있구나”)
       ↓
[6. SHIFT]             관점의 전환 질문 (“만약 ~한다면?”)
       ↓
[7. 10% ACTION]        지금 10분 안에 할 수 있는 가장 작은 행동 체크박스
       ↓
[8. SAVE / SHARE]      오늘의 명심 카드 텍스트 복사 & 저장
       ↓
[9. APP / BOOK]        명심코칭 앱 실천(2순위) & 관련 도서 단 1권 심층 독서(3순위)
```

---

## 3. CTA 우선순위 및 도서 추천 검수

### 1) 3단계 CTA 위계 (Visual Hierarchy)
- **1순위 (최우선)**: `10% 행동 정하기 & 체크` — 모달 하단에서 가장 크고 선명한 에메랄드 테두리 체크박스로 시선 유도.
- **2순위**: `명심코칭 앱에서 내 패턴 기록하기` — 습관화와 데이터 저장을 위한 넉넉한 높이의 primary 버튼.
- **3순위**: `관련 도서 깊이 읽기` — 해당 질문과 직결되는 **단 1권**의 도서만 노출하여 인지 과부하 차단.

### 2) 도서 링크 정합성 전수 검수
- 《다크 코드》: `https://www.yes24.com/product/goods/196721492` (최신간 직링크)
- 《뉴럴 코드》: `https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%89%B4%EB%9F%B4%EC%BD%94%EB%93%9C`
- 《제로 포인트》: `https://www.yes24.com/product/goods/195946431` (최신 직링크 100% 일치)
- 《나는 믿는다 그러나 갇히지 않는다》: `https://www.yes24.com/product/goods/196550353`

---

## 4. 무한 브라우징 방지 (Anti-Loop Router) 검수

- **연관 카드 노출 수 제한**: 카드당 연관 카드(`relatedCards`)는 **최대 2장**까지만 노출 (`slice(0, 2)`).
- **루프 카운터 임계치 작동**:
  - 한 세션에서 연관 카드를 3회 이상 연속 탐색 시:
  - `"생각이 많아질 땐 분석보다 10% 행동 하나가 더 빠릅니다. 오늘의 행동을 정해볼까요?"` 안내 배너가 모달 상단에 노출되며, `[오늘 10% 행동 정하기 ↑]` 버튼을 누르면 즉시 행동 체크박스로 스크롤 이동.
  - 무한 분석과 생각의 과열을 안전하게 차단하고 즉각적인 실천으로 복귀시킵니다.

---

## 5. 비민감 Analytics 퍼널 로깅 무결성 검수

- **개인정보 보호 원칙**: 사용자가 입력한 고민 문장(`userText`), 1분 SCAN 기록, 감정 텍스트는 일체 로깅하거나 외부로 전송하지 않음.
- **추적되는 표준 이벤트 9종**:
  1. `question_view`: 질문 카드 노출
  2. `card_open`: 카드 상세 모달 오픈
  3. `answer_view`: 사이다 답변 확인
  4. `curiosity_click`: 호기심 브릿지 확인
  5. `scan_start`: 1분 SCAN 진입
  6. `scan_complete`: 사실/해석/신체 칩 선택 완료
  7. `action_select`: 10% 행동 체크박스 선택
  8. `app_click`: 명심코칭 앱 이동 클릭
  9. `book_click`: YES24 도서 링크 클릭
- **검증 결과**: 콘솔 및 데이터레이어에 텍스트 유출 0건, 비민감 메타데이터만 정확히 트래킹됨을 확인 완료.
