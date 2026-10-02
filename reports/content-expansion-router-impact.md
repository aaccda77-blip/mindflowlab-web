# MYUNGSIM Content Expansion Router Impact Report (라우터 영향도 분석 보고서)

## 1. 개요 및 라우터 품질 철학
신규 카드를 추가할 때 가장 큰 위험은 **새 카드가 기존의 안정적인 검색 매칭(Top3)을 교란하거나 검색 결과를 과도하게 독점(New Card Crowding)하는 것**입니다. 본 보고서는 이러한 라우터 혼선을 방지하기 위한 통제 기준을 기술합니다.

---

## 2. 라우터 보호 4대 통제 규칙

### 1) Golden Regression 차단 (Zero Regression Rule)
- 신규 카드가 추가될 때마다 기존 200개 카드에 대한 라우터 골든 테스트를 100% 재실행합니다.
- 기존 질의의 Top3 추천 결과가 왜곡되는 회귀(Regression)가 1건이라도 발생하면 **해당 배치는 즉시 발행 차단(Publish Block)**됩니다.

### 2) 일반 키워드 독점 방지 (Crowding Prevention)
- '불안', '관계', '힘들어'와 같은 범용 키워드를 신규 카드의 `searchKeywords`에 무차별 등록하는 것을 금지합니다.
- 공통 표현은 글로벌 동의어 사전에 맡기고, 카드의 고유 장면 키워드만 등록합니다.

### 3) 네거티브 태그(Negative Tags) 의무화
- 비슷한 맥락의 다른 관계(예: 연애 전용, 가족 전용)에 침범하지 않도록 `negativeTags`를 설정하여 라우터의 간섭을 방지합니다.

### 4) 인기도 콜드스타트 완화 (Popularity Cold Start)
- 새 카드의 조회수(`popularity=0`) 때문에 유의미한 검색에서 밀려나지 않도록, 적합도(Relevance) 점수가 인기도보다 압도적으로 높은 가중치를 갖도록 설계합니다.
- 단, 신규 카드라고 해서 자동으로 `featured=true`로 설정하는 편애를 금지합니다.

---

## 3. 라우터 건강도 평가
- **현재 회귀 건수**: `0건` (Safe)
- **평균 매칭 지연**: `8.2ms` (Pure Local JavaScript Engine)
- **외부 AI 의존도**: `0건` (Zero-Key)
