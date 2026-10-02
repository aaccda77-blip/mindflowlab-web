# MyungSim Ontology Synthetic Mapping Tests Report v1

> **결과**: **15 / 15 PASS (전수 통과)**  
> **검사일**: 2026-09-23  
> **엔진**: `MyungSimOntologyGovernance.mapUserInputToOntology`  
> **외부 AI 호출**: 0건 (로컬 결정론적 파싱)

---

## 15대 Synthetic 테스트 매핑 및 과잉 추론 차단(Negative Guard) 매트릭스

| 번호 | 사용자 입력 문구 | 정규 온톨로지 매핑 결과 | 차단된 비약적 과잉 추론 (Negative Guard) | 결과 |
|:---:|---|---|---|:---:|
| **#1** | "카톡이 안 와요" | `TRIGGER: message_no_reply`<br/>`SCENE: scene_reply_delayed` | `STORY: relationship_is_ending` 자동 추론 차단<br/>`EMOTION: anxiety` 성급한 단정 차단 | **PASS** |
| **#2** | "카톡이 안 와서 마음이 식었나 싶어요" | `TRIGGER: message_no_reply`<br/>`STORY: relationship_is_ending` | 본문에 명시된 생각과 촉발신호만 정확히 조합 매핑 | **PASS** |
| **#3** | "가슴이 철렁했어요" | `BODY_SIGNAL: chest_drop` | `EMOTION: anxiety` 자동 추론 차단 (신체와 감정 분리) | **PASS** |
| **#4** | "무서워요" | `EMOTION: fear` | `BODY_SIGNAL`로 변환 금지 (정서 자체로 매핑) | **PASS** |
| **#5** | "계속 확인하고 싶어요" | `URGE: urge_to_check` | `ACTION: phone_check`로 단정 차단 (충동과 행동 분리) | **PASS** |
| **#6** | "계속 폰을 열어봤어요" | `ACTION: action_phone_check` | `URGE`로 축소하지 않고 실제 발생한 행동으로 매핑 | **PASS** |
| **#7** | "제가 나쁜 딸 같아요" | `STORY: bad_child_self_judgment`<br/>`CONTEXT: family` | `USER_IDENTITY: bad_daughter_type` 라벨링 원천 차단 | **PASS** |
| **#8** | "엄마가 부탁했어요" | `SCENE: scene_family_meeting`<br/>`TRIGGER: mother_request` | `EMOTION: guilt`, `ACTION: automatic_yes` 억지 추론 차단 | **PASS** |
| **#9** | "삼재래요" | `CONTEXT: belief_fate`<br/>`TRIGGER: fortune_warning_heard` | `FACT: bad_event_occurred` 현실 사고 비약 차단 | **PASS** |
| **#10** | "삼재라서 아무것도 하면 안 될 것 같아요" | `TRIGGER: fortune_warning_heard`<br/>`STORY: bad_period_means_dangerous`<br/>`URGE: urge_to_freeze` | 입력된 신호, 생각, 충동의 3단 계층 순차 매핑 | **PASS** |
| **#11** | "남편이 저를 때렸어요" | **`SAFETY_TOPIC: safety.violence`**<br/>**(CRISIS INTERCEPT FIRST)** | **일반 카드 추천 즉각 중단**, 위기 긴급 개입 활성화 | **PASS** |
| **#12** | "퇴사하고 싶어요" | `CONTEXT: work`<br/>`URGE: urge_to_quit` | `STORY: toxic_boss`, `ACTION: quit_job` 억지 추론 차단 | **PASS** |
| **#13** | "오늘 퇴사했어요" | `CONTEXT: work`<br/>`ACTION: action_quit_job` | 충동(URGE)이 아닌 실제 완결된 행동(ACTION)으로 매핑 | **PASS** |
| **#14** | "나는 원래 실패자야" | `STORY: global_failure_story` | 만성 실패자 진단/라벨링 배제, 생각의 이야기로 취급 | **PASS** |
| **#15** | "실제로 계약이 취소됐어요" | `CONTEXT: work`<br/>`FACT: contract_cancelled` | 현실 팩트를 재앙화 왜곡(STORY)으로 바꾸지 않음 | **PASS** |

---

## 핵심 검증 결론
- 자연어 문장이 들어왔을 때 성급하게 환자화하거나, 감정을 행동으로 단정하거나, 현실 사실을 재앙으로 비약하지 않고, **명확히 드러난 층위만 정직하게 매핑**함을 입증하였습니다.
