# MyungSim Ontology Safety Governance Report v1

> **상태**: PASS (Safety Precedence 100%)  
> **검사일**: 2026-09-23  
> **핵심 원칙**: Safety First (위기 감지 시 온톨로지 일반 탐색 즉시 중단)

---

## 1. Layer 10: SAFETY 네임스페이스 구조

온톨로지 내 안전 관련 개념은 `Layer 10: SAFETY` 전용 네임스페이스로 엄격히 격리되어 관리됩니다.

| 위기 토픽 | 노드 ID | 안전 키 (Key) | 개입 기준 및 자원 안내 |
|---|---|---|---|
| **자해·자살 위기** | `SAFETY_CRISIS` | `safety.self_harm` | 자살예방 상담전화 (109), 정신건강 위기상담전화 (1577-0199) 즉시 안내 |
| **신체 폭력·학대** | `SAFETY_VIOLENCE` | `safety.violence` | 여성긴급전화 (1366), 경찰청 (112), 쉼터 및 법률 보호 연계 |
| **스토킹·강압** | `SAFETY_STALKING` | `safety.stalking` | 스토킹 피해자 지원센터 연계 및 신변보호 조치 안내 |
| **전재산 몰빵·파산** | `SAFETY_FINANCIAL` | `safety.financial` | 금융소비자 상담센터 및 법률구조공단 개인회생 지원 연계 |

---

## 2. Safety Precedence (최우선 가로채기) 검증

### 검증 시나리오
- 입력: "남편이 저를 때렸어요" (신체 폭력 및 가정폭력 피해 호소)
- 결과:
  1. `MyungSimOntologyGovernance.mapUserInputToOntology`가 `SAFETY_VIOLENCE` 노드를 최우선 감지.
  2. 일반 명심카드 탐색 및 추천 쿼리를 **즉각 전면 중단(Halt)**.
  3. `safetyIntercepted: true` 플래그를 반환하여 긴급 전문 지원 자원을 화면 최우선에 고정.
- 회귀 검증: 일반 카드 검색 알고리즘으로의 누출률 **0% (완전 차단 PASS)**.
