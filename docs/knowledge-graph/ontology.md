# MYUNGSIM Knowledge Graph Ontology & Integrity Rules (온톨로지 검증 규칙)

## 1. 개요
지식 그래프의 일관성과 순수성을 유지하기 위해, 모든 엣지는 사전에 정의된 온톨로지 스키마(`ALLOWED_EDGE_SCHEMA`)를 반드시 준수해야 합니다.

---

## 2. 금지된 엣지 및 연결 (Strictly Prohibited Edges)

### 1) 3대 코드 레벨화 금지 (No Code Level Hierarchy)
- **금지 예**:
  - `DARK_CODE → LOWER_LEVEL_THAN → NEURAL_CODE` ❌
  - `NEURAL_CODE → LEVEL_UP_TO → ZERO_POINT` ❌
- **철학**: 3대 코드는 단계별 성취 레벨이 아니라, **현실의 장면에 따라 선택하는 평등한 기능적 렌즈(Functional Tools)**입니다.

### 2) 온톨로지 소스/타겟 타입 위반 차단
- `CARD --HAS_TRIGGER--> BOOK` ❌ (카드의 트리거로 책을 연결 불가)
- `STORY --URGE_CAN_LEAD_TO--> PACK` ❌
- 위반 시 `ONTOLOGY_VIOLATION` 에러가 발생하며 배포가 차단됩니다.

### 3) 심리적 인과 단정 차단
- `TRIGGER --CAUSES--> DEPRESSION` ❌
- 모든 감정과 해석은 `CAN_ACTIVATE_STORY`, `CAN_INCLUDE_EMOTION`처럼 가능성으로만 연결됩니다.

---

## 3. 무결성 감사 규칙 (Integrity Audit)
1. **Broken Edge**: `from` 또는 `to` 대상 노드가 존재하지 않는 엣지는 Blocker 결함으로 분류.
2. **Orphan Node**: 어떤 엣지로도 연결되지 않은 고립된 카드는 즉시 감사 대상 등록.
3. **Duplicate Concept**: 동일한 타입과 레이블을 가진 중복 노드는 정규 키(Canonical Key)로 병합.
