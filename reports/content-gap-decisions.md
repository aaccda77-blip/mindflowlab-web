# MYUNGSIM Content Gap Decisions Report (콘텐츠 갭 의사결정 대장)

## 1. 개요 및 의사결정 분류 체계
모든 발견된 Content Gap 신호는 아래 6대 트랙 중 하나로 최종 판정되어야 하며, 새 카드를 생성하는 것(`CREATE`)은 오직 모든 대안이 소진된 `VERIFIED` 상태에서만 허용됩니다.

| 의사결정 트랙 | 의미 및 조치 | 신규 카드 생성 여부 |
|---|---|---|
| **ROUTER_FIX** | 기존 카드가 이미 존재하지만 동의어 누락 또는 가중치 문제로 미매칭된 경우 | **0장** (Router 규칙/동의어 수정) |
| **EXISTING_CARD_COVERS** | 기존 카드의 본문 및 질문이 해당 맥락을 충분히 포괄하는 경우 | **0장** (검색 키워드 태깅만 보강) |
| **POLISH_EXISTING** | 카드는 적합하나 질문이 너무 추상적이어서 공감대가 떨어지는 경우 | **0장** (기존 카드 질문/SODA 수정) |
| **MERGE_CANDIDATE** | 신규 제안이 기존 카드의 다른 표현일 뿐 동일 Trigger/Urge인 경우 | **0장** (기존 카드와 통합, 오히려 카드 수 감소 가능) |
| **OUT_OF_SCOPE** | 전문의 진단, 법률, 투자, 자해 등 고위험군인 경우 | **0장** (Safety 응급 프로토콜 연동) |
| **CREATE** | 독립적 Scene, SODA, 10% Action이 완벽히 입증된 Verified Gap인 경우 | **1장** (신규 Candidate 등록) |

---

## 2. 현재 상태 (Waiting for Evidence)
- **실제 30일 런칭 후 유효 Verified Gap**: 현재 프로덕션 런칭 직후 기준선으로 `0건` (조작된 가짜 데이터 생성 금지 원칙 준수).
- **상태 선언**: `CONTENT EXPANSION: WAITING FOR EVIDENCE`
- **의사결정 프로세스 가동 상태**: 100% 정상 대기 중.
