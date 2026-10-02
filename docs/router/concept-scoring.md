# MyungSim Concept Scoring & Reranking Specification
**문서:** 점수 산출 공식 및 가드 시스템  
**버전:** v3.0  

---

## 1. 종합 점수 산출 공식 (Scoring Formula)

Concept Router v3는 블랙박스 인공지능 대신 100% 설명 가능한 수학적 선형 결합 공식을 채택합니다:

$$\text{FinalScore} = \max(0, (\text{RuleScore} \times 0.45) + (\text{ConceptScore} \times 0.55) + \text{GuardAdjustment} + \text{MultiEvidenceBoost})$$

### 세부 구성요소:
1. **`RuleScore`**: 기존 `RuleBasedRouter`의 키워드 빈도 및 TF-IDF 가중 점수.
2. **`ConceptScore`**:
   - `DIRECT 매칭 (Hop 0)`: $3.0 \times \text{Confidence}$
   - `1-HOP 매칭 (Hop 1)`: $1.5 \times \text{Confidence}$
3. **`MultiEvidenceBoost`**:
   - `MULTIPLE` (Rule과 Concept 양쪽 모두에서 독립적으로 후보 지지 시): $+2.0$ 가산.
4. **`GuardAdjustment`**:
   - Context 불일치 패널티: $-20.0$
   - NegativeTag 트리거 패널티: $-15.0$
   - RealityGuard 보호 보정: $+10.0$

---

## 2. 3대 가드 시스템 (3-Guard Engine)

### 1) Context Guard (맥락 보호)
- 발화 주체에서 추출된 맥락(가족 vs 연애 등)과 카드의 전용 맥락 태그가 정면 충돌할 때 강한 감점 부여:
  - 예: 사용자가 '엄마', '부모'를 언급했으나, 카드가 `romantic_only`인 경우 &rarr; $-20.0$ 감점.

### 2) Negative Guard (부정어 방어)
- 카드의 `negativeTags` 목록에 등록된 단어가 사용자 입력에 직접 포함된 경우:
  - 예: '성적', '시험' 관련 질문에 '연애 전용' 카드가 반응하지 않도록 $-15.0$ 감점.

### 3) Reality Guard (현실 사건 보존)
- '폭행', '맞았', '부채', '빚', '압류', '계약 취소', '임금', '해고', '퇴사' 등 물리적/현실적 사건이 포함된 경우:
  - 심리적 완곡함보다 실제 사건과 관련된 팩트 카드가 우선 노출되도록 $+10.0$ 가산.

---

## 3. 동점 처리 (Tie-Break) 및 다양성 (Diversification)

1. **Tie-Break 규칙**:
   - $\text{FinalScore}$가 동일한 경우, 일관된 정렬을 위해 카드 ID의 사전순(`cardId.localeCompare`)으로 정렬합니다.
2. **Result Diversifier**:
   - 1위 카드와 동일한 `pack` 및 `category`를 가진 카드는 원칙적으로 중복 노출을 피합니다.
   - 단, 후보 점수가 압도적으로 높거나(5.0 초과), 대안 후보가 부족할 경우 수용합니다.
   - **억지 3개 채우기 금지**: 유의미한 점수(1.0 이상)를 받은 카드가 2개뿐인 경우 무리하게 3개를 채우지 않고 **Top 2**를 확정 반환합니다.
