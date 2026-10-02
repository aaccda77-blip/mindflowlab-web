# MyungSim Concept Mapping Specification
**문서:** Search Vocabulary & Canonical Concept Mapping  
**버전:** v3.0  

---

## 1. 정규 개념(Canonical Concept) 매핑 원칙

1. **표현의 다양성을 소수의 안정적인 개념으로 수렴**  
   사용자가 “읽씹”, “안읽씹”, “카톡 안 봄”, “답장 안 와”, “연락 두절” 등 수많은 일상어로 질문하더라도, 엔진은 이를 온톨로지 정규 노드인 `TRIG_MESSAGE_NO_REPLY` (`message_no_reply`)로 정규화합니다.

2. **계층 분리 (Layered Ontological Boundaries)**  
   - **Trigger**: 외부/객관적 사건 (`message_no_reply`, `mother_request`)
   - **Story**: 주관적 해석/생각 (`relationship_is_ending`, `bad_child_self_judgment`)
   - **Body Signal**: 생리적 신체 반응 (`chest_drop`, `breath_shallow`, `muscle_tense`)
   - **Emotion**: 정서적 느낌 (`anxiety`, `fear`, `guilt`)
   - **Urge**: 충동 (`urge_to_check`, `urge_to_apologize`, `urge_to_quit`)
   - **Action**: 실제 행동 (`action_phone_check`, `action_quit_job`)

3. **detectedConcepts vs retrievalConcepts 분리**  
   - `detectedConcepts`: 사용자의 발화에서 명시적으로 확인된 개념 목록. WHY 문구 및 설명에만 투명하게 사용됩니다.
   - `retrievalConcepts`: Knowledge Graph를 통해 1-Hop 확장된 탐색용 개념 목록. 오직 후보 카드 점수 산출에만 사용되며 사용자 상태로 확정되지 않습니다.

---

## 2. 주요 매핑 테이블 (대표 20선)

| 사용자 일상 검색어 | 온톨로지 정규 노드 ID | Canonical Key | 소속 계층 | 신뢰도 (Confidence) |
| :--- | :--- | :--- | :--- | :--- |
| 읽씹 / 안읽씹 | `TRIG_MESSAGE_NO_REPLY` | `message_no_reply` | Layer 2: Trigger | 0.95 |
| 답장 안 와 / 연락 두절 | `TRIG_MESSAGE_NO_REPLY` | `message_no_reply` | Layer 2: Trigger | 0.95 |
| 마음 식었나 / 끝난 건가 | `STORY_RELATIONSHIP_ENDING` | `relationship_is_ending` | Layer 3: Story | 0.95 |
| 가슴 철렁 / 심장 쿵 | `BODY_CHEST_DROP` | `chest_drop` | Layer 4: Body Signal | 0.98 |
| 숨막혀 / 숨이 얕아짐 | `BODY_BREATH_SHALLOW` | `breath_shallow` | Layer 4: Body Signal | 0.92 |
| 불안해 / 초조해 | `EMO_ANXIETY` | `anxiety` | Layer 4: Emotion | 0.98 |
| 무서워 / 겁나 | `EMO_FEAR` | `fear` | Layer 4: Emotion | 0.98 |
| 죄책감 / 미안함 | `EMO_GUILT` | `guilt` | Layer 4: Emotion | 0.95 |
| 확인하고 싶어 / 확인 충동 | `URGE_CHECK` | `urge_to_check` | Layer 5: Urge | 0.98 |
| 퇴사하고 싶어 / 때려치고 싶다 | `URGE_QUIT` | `urge_to_quit` | Layer 5: Urge | 0.98 |
| 도망치고 싶어 | `URGE_ESCAPE` | `urge_to_escape` | Layer 5: Urge | 0.95 |
| 폰 뒤적 / 계속 카톡 봄 | `ACT_PHONE_CHECK` | `action_phone_check` | Layer 6: Action | 0.98 |
| 실제 퇴사했어 / 사표 냈어 | `ACT_QUIT_JOB` | `action_quit_job` | Layer 6: Action | 0.98 |
| 나쁜 딸 / 불효자 | `STORY_BAD_CHILD` | `bad_child_self_judgment` | Layer 3: Story | 0.98 |
| 엄마 부탁 | `TRIG_MOTHER_REQUEST` | `mother_request` | Layer 2: Trigger | 0.98 |
| 삼재 / 사주 불길 | `TRIG_FORTUNE_WARNING` | `fortune_warning_heard` | Layer 2: Trigger | 0.98 |
| 계약 취소 | `FACT_CONTRACT_CANCELLED` | `contract_cancelled` | Layer 3: Fact | 0.98 |
| 원래 실패자 | `STORY_GLOBAL_FAILURE` | `global_failure_story` | Layer 3: Story | 0.98 |

---

## 3. 부정문 및 완화 처리 규칙

사용자가 다음과 같이 부정 문맥을 사용할 경우, 해당 개념을 `detectedConcepts`에서 안전하게 제외합니다:
- *"확인하고 싶은 건 아닌데..."* &rarr; `urge_to_check` 매핑 억제
- *"불안한 건 아니에요"* &rarr; `anxiety` 매핑 억제
- *"퇴사하고 싶은 건 절대 아니지만"* &rarr; `urge_to_quit` 매핑 억제
