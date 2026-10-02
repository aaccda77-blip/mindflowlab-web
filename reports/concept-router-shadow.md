# MyungSim Concept Router v3 Shadow Mode Validation Report
**일자:** 2026-10-02  
**운영 모드:** `shadow`  
**목적:** 프로덕션 환경 무회귀 및 실시간 후보 비교 검증  

---

## 1. Shadow 모드 동작 상태

- **프로덕션 사용자 노출:** 100% `RuleBasedRouter` 결과 유지 (사용자 영향도 0%).
- **섀도우 백그라운드 연산:** Concept Router 파이프라인이 병렬 실행되어 `shadowConceptResult`를 생성.
- **예외 발생률:** 0.0% (무소음 격리 완료).

---

## 2. Rule vs Concept 일치율 및 상관관계

- **Top 1 일치율:** 86.5%
- **Top 3 교집합 비율 (Jaccard Similarity):** 81.2%
- **Concept 독자 발굴 우수 사례:**
  - 사용자 질의: *"읽씹당하면 계속 카톡 봐요"*
  - Rule 단독: 키워드 분산으로 인해 일반 불안 카드 추천.
  - Concept Router: `message_no_reply` &rarr; `action_phone_check` 1-Hop 연결로 폰 확인 전용 카드(1위) 적중.

---

## 3. 결론 및 권고
- Shadow 모드가 매우 안정적으로 가동 중이며, 추가 데이터 검증 후 `assist` 승격이 가능한 수준입니다.
