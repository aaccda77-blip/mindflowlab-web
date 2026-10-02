# MYUNGSIM Knowledge Graph & Router Integration Guide (라우터 통합 지침)

## 1. 개요 및 파이프라인
Knowledge Graph는 기존의 검증된 `RuleBasedRouter`를 대체하는 것이 아니라, **구조적 재현율(Recall)과 설명 가능성을 보조하는 파트너**로 동작합니다.

```mermaid
flowchart TD
    IN["사용자 입력 (Query)"] --> SAF{"Safety Router<br/>(최우선 검사)"}
    SAF -- "위기 감지" --> EMER["비의료 응급 모달 발화<br/>(Graph 탐색 즉시 중단)"]
    SAF -- "안전 확인" --> ROUTER["RuleBasedRouter (태그/키워드)"]
    ROUTER --> KG["Knowledge Graph 1-hop 확장<br/>(Trigger/Scene/Context 연계)"]
    KG --> GUARD{"Context Guard 검사<br/>(연애 질문에 가족/업무 차단)"}
    GUARD --> SCORING["가중치 종합 및 중복 배제"]
    SCORING --> TOP3["최종 Top 3 명심카드"]
```

---

## 2. 핵심 통합 규칙

### 1) 1-Hop 탐색 원칙 (No Infinite Graph Drift)
- 사용자 입력에서 발견된 개념을 바탕으로 지식 그래프를 탐색할 때, **최대 1-hop(필요시 제한적 2-hop)**까지만 확장합니다.
- 예: `답장 없음 → 불안 → 관계 → 어린 시절 → 애착 → 트라우마`와 같은 끝없는 의미 표류(Graph Drift)는 원천 차단됩니다.

### 2) Context Guard (맥락 보호)
- 감정이 유사하더라도(`anxiety`), 질문의 맥락이 `romantic`(연애)인 경우 `family`(가족)나 `work`(직장) 카드가 상위에 오르지 않도록 보호합니다.

### 3) 100% Rule Router Fallback
- 지식 그래프 서브시스템에 장애가 발생하거나 OFF될 경우, 시스템은 에러 없이 **기존 RuleBasedRouter 단독으로 100% 정상 작동**합니다.
