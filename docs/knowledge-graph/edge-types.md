# MYUNGSIM Knowledge Graph 22대 Edge Types 명세서

## 1. 개요 및 표현 원칙 (Probabilistic Formulation)
- 지식 그래프의 관계는 **심리적 인과를 과도하게 단정(`CAUSES`, `ALWAYS_CAUSES`)하지 않습니다.**
- 대신 **`CAN_ACTIVATE_STORY`, `CAN_CREATE_URGE` 등 가능성과 촉발의 관점**으로 표현합니다.

---

## 2. 22대 Edge Types 상세 목록

1. `BELONGS_TO_PACK`: 카드가 특정 팩에 소속됨 (`CARD → PACK`)
2. `BELONGS_TO_CATEGORY`: 카드 또는 팩이 대분류에 소속됨 (`CARD/PACK → CATEGORY`)
3. `OCCURS_IN_CONTEXT`: 특정 일상 맥락에서 발생함 (`SCENE/TRIGGER/CARD → CONTEXT`)
4. `HAS_SCENE`: 카드가 다루는 핵심 장면 (`CARD → SCENE`)
5. `HAS_TRIGGER`: 카드 또는 장면의 시작 자극 (`CARD/SCENE → TRIGGER`)
6. `CAN_ACTIVATE_STORY`: 자극이 촉발할 수 있는 자동 해석 (`TRIGGER/SCENE → STORY`)
7. `CAN_INCLUDE_UNKNOWN`: 해석 과정에서 확인되지 않은 영역 (`CARD/STORY → UNKNOWN`)
8. `CAN_HAVE_BODY_SIGNAL`: 동반될 수 있는 신체 감각 (`CARD/STORY/EMOTION → BODY_SIGNAL`)
9. `CAN_INCLUDE_EMOTION`: 활성화될 수 있는 원초 정서 (`CARD/STORY → EMOTION`)
10. `CAN_CREATE_URGE`: 해석이나 감정이 유발하는 즉각적 충동 (`STORY/EMOTION → URGE`)
11. `URGE_CAN_LEAD_TO`: 충동이 이어질 수 있는 방어 행동 (`URGE → ACTION`)
12. `ACTION_CAN_PRODUCE`: 행동 뒤에 나타나는 단기적 결과 (`ACTION → RESULT`)
13. `CAN_PROTECT`: 행동이 의도하는 무의식적 보호 기능 (`URGE/ACTION → PROTECTION_FUNCTION`)
14. `CAN_OVERUSE_STRENGTH`: 강점이 과출력되어 나타난 양상 (`STRENGTH → STORY/URGE`)
15. `CAN_TRY_ACTION`: 시도해 볼 수 있는 10%의 작은 대안 행동 (`CARD/ACTION → TEN_PERCENT_ACTION`)
16. `GROUNDED_IN_BOOK`: 카드가 직접 근거하고 있는 4대 도서 (`CARD → BOOK`)
17. `GROUNDED_IN_CONCEPT`: 카드가 연결된 핵심 도서/코드 저작 개념 (`CARD → BOOK_CONCEPT/CODE_CONCEPT`)
18. `RELATED_TO_CARD`: 동일 맥락/기제의 연관 질문 카드 (`CARD → CARD`)
19. `CONTRASTS_WITH`: 다른 렌즈나 대조적인 관점을 제시하는 연결 (`CARD/CONCEPT → CARD/CONCEPT`)
20. `SAFETY_ESCALATES_TO`: 고위험 감지 시 안전 프로토콜로 에스컬레이션 (`CARD/TRIGGER → SAFETY_TOPIC`)
21. `ROUTED_BY`: 라우터 검색 태그와의 연결 (`CARD → ROUTE_TAG`)
22. `SEARCH_SYNONYM_OF`: 검색어 정규 개념과 자극/맥락 연결 (`SEARCH_CONCEPT → TRIGGER/CONTEXT`)
