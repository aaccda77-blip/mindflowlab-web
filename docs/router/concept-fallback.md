# MyungSim Concept Fallback & Operational Governance Specification
**문서:** 100% 무소음 폴백 및 장애 격리 정책  
**버전:** v3.0  

---

## 1. 100% 무소음 Fallback (Silent Fallback)

Concept Router v3는 어떠한 런타임 예외나 리소스 부족 상황에서도 사용자 경험이 중단되지 않도록 **완전 무소음 룰 기반 폴백**을 지원합니다.

### 폴백 시나리오 및 처리 규칙
1. **모드 `off` 설정 시**:
   - Concept Router 내부 연산 없이 즉시 `RuleBasedRouter`를 호출하여 결과를 반환합니다.
2. **Knowledge Graph 인스턴스 미가용 시**:
   - 1-Hop 확장을 조용히 건너뛰고, 직결 키워드 매핑 및 Rule 기반 후보로만 정상 동작합니다.
3. **Concept 후보 검색 결과 0건 시 (`assist` 모드)**:
   - 빈 화면을 보여주는 대신, `RuleBasedRouter`의 검색 결과로 즉각 복원하고 `fallbackReason: 'concept_empty_fallback_to_rule'`을 마킹합니다.
4. **런타임 예외 발생 시**:
   - `try-catch` 격리를 통해 에러가 상위 화면으로 전파되지 않으며, 안전하게 RuleBasedRouter의 결과를 사용자에게 노출합니다.

---

## 2. 3대 갭(Gap) 진단 및 격리 프로세스

검색 품질 불만족 케이스 발생 시, 임의로 카드를 추가하거나 코드를 고치는 대신 명확히 분류하여 해당 거버넌스로 이관합니다:

1. **`ONTOLOGY_GAP_CANDIDATE`**:
   - 사용자가 입력한 어휘에 해당하는 정규 개념 자체가 없음.
   - 조치: **온톨로지 거버넌스 위원회**로 이관하여 신규 정규 개념 승인 검토.
2. **`CONTENT_GAP_CANDIDATE`**:
   - 정규 개념은 인식되었으나, 이를 담아낼 카드가 존재하지 않음.
   - 조치: **콘텐츠 에디토리얼 팀**으로 이관하여 증거 기반 신규 카드 집필 검토.
3. **`ROUTER_FAILURE`**:
   - 정규 개념과 카드 모두 존재하나 스코어링/랭킹 실패로 적절한 카드가 Top 3에 오르지 못함.
   - 조치: **엔지니어링 팀**에서 가중치 튜닝 및 가드 로직 개선 (새 카드 추가 금지).
