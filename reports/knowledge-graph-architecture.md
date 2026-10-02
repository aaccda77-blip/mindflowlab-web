# MYUNGSIM Knowledge Graph Architecture Report

## 1. 개요 (Architecture Overview)
- **버전**: `myungsim-kg-v1.0`
- **목적**: 200+장의 명심카드를 유기적인 콘텐츠 지식체계로 관리하고, 중복 방지와 라우터 설명 가능성을 극대화함.
- **성공 정의**: 노드 수가 많거나 시각화가 화려한 것이 아니라, **"카드가 왜 연결되는지 알 수 있고, 중복을 찾기 쉬워지며, 책 개념과의 연결이 명확하고, 개인 데이터를 쓰지 않는 것"**입니다.

---

## 2. 노드 및 엣지 구성 요약
- **Node Types**: 22개 표준 타입 (`CARD`, `PACK`, `CATEGORY`, `SCENE`, `TRIGGER`, `STORY`, `BODY_SIGNAL`, `EMOTION`, `URGE`, `ACTION`, `TEN_PERCENT_ACTION`, `BOOK`, `BOOK_CONCEPT`, `CODE_CONCEPT` 등)
- **Edge Types**: 22개 표준 타입 (`BELONGS_TO_PACK`, `HAS_TRIGGER`, `CAN_ACTIVATE_STORY`, `CAN_CREATE_URGE`, `URGE_CAN_LEAD_TO`, `CAN_TRY_ACTION`, `GROUNDED_IN_BOOK` 등)
- **저장 방식**: Neo4j 등의 과설계를 지양하고, 브라우저/Node.js에서 초고속으로 작동하는 인메모리 인접 맵(In-memory Adjacency Map) 사용.

---

## 3. 프라이버시 및 Safety 가드레일 상태
- **개인 심리 프로파일링**: `DISABLED` (사용자 성향/결핍 단정 금지)
- **개인 원문 데이터 유입**: `0건` (Strict Zero-PII)
- **Safety 최우선 원칙**: `ENFORCED` (위기 감지 시 그래프 탐색 즉시 중단)
