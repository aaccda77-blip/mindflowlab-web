# MYUNGSIM Knowledge Graph 22대 Node Types 명세서

## 1. 개요
지식 그래프는 아래 22대 표준 노드 타입으로만 구성되며, 모든 노드는 고유 식별자(`id`), 타입(`type`), 정규 키(`key`), 사용자 레이블(`label`)을 가집니다.

---

## 2. 노드 분류 및 상세 명세

| 분류 | Node Type | 의미 및 역할 | 예시 |
|---|---|---|---|
| **콘텐츠 구조** | `CARD` | 정식 발행된 명심카드 단위 | `CARD_rel-001` (답장 대기 모드) |
| | `PACK` | 10개 묶음 카테고리 팩 | `PACK_relationship-anxiety-01` |
| | `CATEGORY` | 최상위 대분류 | `관계·심리`, `업무·직장` |
| **맥락과 장면** | `CONTEXT` | 장면이 일어나는 일상 영역 | `romantic`, `family`, `work` |
| | `SCENE` | 일상에서 발생 가능한 구체적 장면 | `reply_delayed`, `mistake_found` |
| | `TRIGGER` | 반응을 촉발하는 외적 자극/사건 | `message_no_reply`, `criticism` |
| **인지 및 신체** | `STORY` | 마음이 붙이는 자동적 해석 구조 | `relationship_is_ending` |
| | `UNKNOWN` | 아직 확인되지 않은 사실/정확성의 공간 | `reason_for_no_reply_unknown` |
| | `BODY_SIGNAL` | 신체에서 먼저 나타나는 감각 반응 | `chest_drop`, `breathing_shallow` |
| | `EMOTION` | 활성화된 원초적 정서 (점수화 금지) | `anxiety`, `guilt`, `shame` |
| **충동 및 행동** | `URGE` | 즉각적으로 올라오는 충동 | `check`, `apologize`, `withdraw` |
| | `ACTION` | 반복되어 온 방어적 행동 | `phone_check`, `over_explain` |
| | `ACTION_TYPE` | 행동의 일반화된 도구적 층위 | `DELAY`, `CHECK_FACT`, `BOUNDARY` |
| | `RESULT` | 행동 뒤 따라오는 일시적 결과 | `temporary_relief`, `work_delayed` |
| **기능과 강점** | `PROTECTION_FUNCTION` | 반응 뒤에 숨겨진 무의식적 보호 기능 | `avoid_conflict`, `avoid_rejection` |
| | `STRENGTH` | 과출력되기 전 원래의 건강한 자원 | `care`, `responsibility`, `caution` |
| | `TEN_PERCENT_ACTION` | 오늘 시도 가능한 10%의 작은 대안 행동 | `wait_10_minutes`, `write_one_fact` |
| **도서 및 철학** | `BOOK` | 명심코칭 4대 출간/원고 도서 | `BOOK_DARK_CODE`, `BOOK_NEURAL_CODE` |
| | `BOOK_CONCEPT` | 도서 원고에 명시된 핵심 저작 개념 | `FACT_STORY_UNKNOWN`, `EXPECTED_VS_ACTUAL` |
| | `CODE_CONCEPT` | 3대 코드 기능적 렌즈 (Dark/Neural/Zero) | `CODE_DARK`, `CODE_NEURAL`, `CODE_ZERO` |
| **안전 및 라우팅** | `SAFETY_TOPIC` | 응급 프로토콜로 이관될 고위험 주제 | `SAFETY_CRISIS`, `SAFETY_VIOLENCE` |
| | `ROUTE_TAG` | 규칙 기반 라우터 검색 태그 | `답장`, `연락`, `불안` |
| | `SEARCH_CONCEPT` | 검색어 동의어 그룹의 정규 개념 | `search_late_reply` |
