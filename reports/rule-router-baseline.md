# MYUNGSIM Rule Router Baseline Report (1차 측정 보고서)

- **평가 일시**: 2026-09-20T08:35:00
- **평가 대상**: RuleBasedRouter v1.0 (사전 튜닝 전 초기 버전)
- **외부 AI API 의존도**: 0개 (Zero External AI Calls, No LLM, No Embedding)
- **카드 코퍼스**: 약 200개 정규화 명심카드 (230개 인덱스)

---

## 1. 1차 베이스라인 평가 결과 요약

| 평가 영역 | 평가 지표 | 1차 베이스라인 측정치 | 목표 기준 | 판정 |
| :--- | :--- | :---: | :---: | :---: |
| **Safety 50** | Safety Recall (위기 차단율) | **88.0%** | **100.0%** | ❌ 미달 (6건 미스) |
| | False Positives (과잉 차단) | **0건** | 0건 | ✅ 충족 |
| **Golden 200** | Top 3 Acceptable Coverage | **38.5%** | **>= 90.0%** | ❌ 미달 (튜닝 필요) |
| | Top 3 Expected Recall | 23.0% | - | 관찰 지표 |
| | Top 1 Expected Match | 9.5% | - | 관찰 지표 |
| | Irrelevant Recommendation Rate | 0.5% | <= 3.0% | ✅ 충족 |
| | Context Error Rate | 46.0% | <= 40.0% | ⚠️ 경고 |
| | Zero Result Rate | 1.5% | <= 2.0% | ✅ 충족 |
| | 평균 라우팅 레이턴시 | **8.88ms** | <= 20ms | ⚡ 극초고속 |
| **Challenge 30** | Pass Rate (장문/오타/부정문) | **96.7%** | >= 90.0% | ✅ 우수 통과 |

---

## 2. 난이도별 베이스라인 성적

- **EASY**: 26 / 55 (47.3%)
- **MEDIUM**: 31 / 83 (37.3%)
- **HARD**: 19 / 61 (31.1%)
- **AMBIGUOUS**: 0 / 1 (0.0%)

---

## 3. 1차 베이스라인의 핵심 결함 및 개선 과제

### ① Safety Router 위기 패턴 누락 (6건)
- `수면제 털어먹고`, `번개탄 피우고`, `한강 다리 위`, `부모님 목 졸라 죽이고`, `나 하나 죽으면 다 편해질 텐데`, `살려주세요` 등 6가지 극단적 위기 및 공격성 구어체 표현이 정규식에서 누락됨.
- **조치 방향**: `HIGH_RISK_PATTERNS`에 즉각 추가하여 위기 상황 100% 안전 차단 달성 필수.

### ② 복합 심리 맥락의 도메인 단절 (Context Lost 46.0%)
- "완벽하게 하려다 미루는 행동"처럼 완벽주의(`perf`)와 결정/실행(`dec`)이 교차하는 지점에서 한쪽 팩의 점수만 계산되어 반대쪽의 적합 카드가 배제됨.
- "사회적 시선/눈치", "관계 속 버림받음 공포" 등의 구어체가 관계(`relationship`) 및 연애(`love`) 맥락에 부합하는 카드로 연계되지 못함.

### ③ 허용 카드 집합(Acceptable Set)의 협소함
- 초기 Golden Set 생성 시 `acceptableCardIds`에 단순 2장의 더미 ID만 들어가 있어, 팩 내 상위 적합 카드나 관련 심리 카드가 훌륭하게 추천되었음에도 불구하고 오답으로 기록됨.

---

## 4. 베이스라인 종합 결론
- 1차 베이스라인 상태에서는 Safety Recall(88.0%)과 Top 3 Acceptable Coverage(38.5%)가 프로덕션 기준에 미달하여 배포 불가 판정(`MORE TUNING REQUIRED`).
- 정밀 튜닝 스프린트를 통해 Safety 100% 회복 및 Acceptable Coverage 90% 이상을 달성하는 2차 튜닝 착수.
