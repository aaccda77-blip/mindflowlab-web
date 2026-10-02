# MyungSim Concept Router v3 Architecture Specification
**버전:** v3.0-Production  
**상태:** Active (Default Mode: `shadow`)  
**원칙:** NO-AI Canonical Retrieval Engine & Zero-Key Compliance  

---

## 1. 개요 및 설계 철학

명심코칭의 **Concept Router v3**는 사용자의 구어체 및 일상적 검색 표현을 분석기가 아닌 **검색 정규화 레이어(Retrieval Normalization Layer)**를 통해 **Canonical Concept**로 치환하고, **Content Knowledge Graph**의 1-Hop 인접 관계를 거쳐 가장 적절한 명심카드로 안정적으로 안내하는 로컬 인메모리 검색 엔진입니다.

### 핵심 5대 철칙
1. **RETRIEVAL NORMALIZATION ONLY (비진단·비분석)**  
   - 사용자의 숨은 심리적 원인(애착유형, 결핍, 트라우마 등)을 추론하지 않습니다.
   - 오직 사용자가 직접 표현한 어휘를 기반으로 정규 개념(Canonical Concept)을 식별하여 카드를 매칭합니다.
2. **SAFETY FIRST (위기 최우선)**  
   - 모든 검색 파이프라인의 제0단계는 Safety Router입니다.
   - 자해, 타해, 신체 폭력, 스토킹, 심각한 재무 파산 위기 징후 발견 시 지식 그래프 탐색을 즉시 중단하고 109 긴급 구호 흐름으로 전환합니다.
3. **RULE ROUTER PRESERVATION (100% 무소음 폴백)**  
   - 기존의 `RuleBasedRouter`를 절대 제거하거나 대체하지 않습니다.
   - Concept Router는 Rule Router의 후보와 앙상블되거나, 예외 상황 발생 시 100% 무소음으로 Rule Router 단독 실행으로 폴백됩니다.
4. **NO-AI PRODUCTION MODE (Zero-Key)**  
   - 외부 LLM, Semantic Search API, 임베딩 API, Vector DB를 전면 배제합니다.
   - 모든 매핑과 그래프 탐색은 로컬 브라우저/서버 메모리에서 10ms 이내에 즉각 수행됩니다 (`EXTERNAL AI CALLS: 0`).
5. **PRIVACY SAFE (Zero-Log)**  
   - 사용자가 입력한 사연 원문(`rawQuery`) 및 정규화 문장(`normalizedQuery`)을 절대 영구 저장하거나 원격 전송하지 않습니다.

---

## 2. 파이프라인 상세 아키텍처

```
[사용자 입력 사연]
       │
       ▼
[0. Safety Router 평가] ──── (위기 감지 시) ───► [긴급 구호(109) 안내]
       │ (안전 확인)
       ▼
[1. Korean Normalizer] (구두점, ㅋㅋ/ㅠㅠ, 흔한 오타, 조사 분리)
       │
       ▼
[2. Search Vocabulary Mapper] (일상어 사전 매핑: 읽씹 -> message_no_reply)
       │
       ▼
[3. Canonical Concept Mapper] (detectedConcepts 추출, 부정문 완화)
       │
       ▼
[4. Context Detector] (발화 주체 기반 맥락 식별: romantic, family, work 등)
       │
       ▼
[5. Knowledge Graph 1-Hop Expansion] (retrievalConcepts: Direct + 1-Hop 한정)
       │
       ▼
[6. Concept Card Retrieval] + [7. Legacy Rule Retrieval]
       │
       ▼
[8. Candidate Merger & Provenance Tagging] (DIRECT, 1HOP, RULE, MULTIPLE)
       │
       ▼
[9. 3대 Guard 필터링] (ContextGuard, NegativeGuard, RealityGuard)
       │
       ▼
[10. Concept Reranker] (설명 가능한 공식 기반 가중치 재계산)
       │
       ▼
[11. Result Diversifier] (Top 2~3 다양성 확보, 억지 채우기 금지)
       │
       ▼
[12. Prewritten WHY 빌더] (실제 감지 신호 기반 1~2문장 비진단 이유 생성)
       │
       ▼
[최종 추천 결과 반환]
```

---

## 3. 운용 모드 (Feature Modes)

- **`off`**: Concept Router 비활성화. 기존 `RuleBasedRouter` 단독 동작.
- **`shadow` (기본값)**: 실제 사용자에게는 `RuleBasedRouter` 결과를 그대로 제공하면서, 내부적으로 Concept 파이프라인을 병렬 실행하여 로깅 및 비교 메트릭을 수집.
- **`assist`**: Concept Router 결과를 사용자에게 직접 제공하며, Rule Router 결과와 상호 보완. 결과 공백 시 즉각 Rule 결과로 폴백.
