# 마인드플로우 랩 명심 30일 여정 아키텍처 보고서 (Architecture Report)
**문서 버전:** v1.0  
**작성 일자:** 2026-09-21  
**상태:** READY (프로덕션 배포 준비 완료)  
**환경:** NO-AI Production Mode (외부 LLM API 호출 0건, 브라우저 로컬 결정론적 상태 엔진)

---

## 1. 아키텍처 개요 및 핵심 철학

「MyungSim 30-Day Journey v1」은 연속 출석(Streak)이나 일일 미션을 강요하는 전형적인 습관 형성 앱의 한계를 완전히 극복한 **비선형 Guided Journey 시스템**입니다.

### 🌟 4대 핵심 설계 철학
1. **No-Streak & No-Score (죄책감 없는 자율 속도)**:
   - 연속 며칠 달성, 결석일, 12/30일차 같은 출석 압박 수치를 일체 사용하지 않습니다.
   - 10일 만에 다시 접속해도 “놓친 기록이 있습니다”가 아니라 “필요한 순간에 다시 돌아오셨군요”라는 환대 문구로 자연스럽게 이어집니다.
2. **No-Identity-Labeling (정체성 낙인 배제)**:
   - “당신은 회피형입니다”, “의지력이 70점입니다” 같은 평가적 낙인을 전면 차단합니다.
   - 오직 사용자가 기록한 이전 선택(Before)과 최근 새로운 10% 시도(Recent)의 **객관적 사실(Fact)**만 나란히 보여줍니다.
3. **5 Phase Circular Flow (비선형 자유 순환)**:
   - `NOTICE(장면 자각)` → `TRY(10% 시도)` → `COMPARE(예상/실제 비교)` → `MAP(작동지도 확인)` → `RETURN(삶으로 복귀)`
   - 1단계부터 5단계까지 순서대로 레벨업하는 선형 방식이 아니라, 일상 속에서 언제든 순환하는 루프형 라이프사이클입니다.
4. **Session End (일상 복귀 유도)**:
   - 앱에 오래 머물며 과몰입하도록 만드는 것이 아니라, “오늘은 여기까지면 충분합니다 [끝내기]” 버튼을 통해 사용자가 삶의 현장으로 즉시 복귀할 수 있도록 지원합니다.

---

## 2. 코어 컴포넌트 구조

```mermaid
flowchart TD
    subgraph UI_Layer [사용자 인터페이스 계층]
        HomeWidget["Personal Home v2 배너/위젯\n(#sec-30day-journey-home)"]
        JourneyPage["30일 여정 전용 화면\n(/my/journey.html)"]
        AdminView["관리자 관제 센터\n(/admin/journey.html)"]
    end

    subgraph Engine_Layer [코어 자바스크립트 엔진 (js/myungsim-30day-journey.js)]
        Store["JourneyStore\n(사용자별 격리 스토리지)"]
        StateMachine["JourneyStateMachine\n(결정론적 상태 평가 및 5 Phase 전이)"]
        ReviewEngine["JourneyReviewEngine\n(8대 질문 기반 회고 및 Before/Recent 비교)"]
        Tracker["trackSafeJourneyEvent\n(개인 원문 차단 익명 메트릭 송신)"]
    end

    subgraph Data_Storage [브라우저 로컬 저장소]
        LocalStore["localStorage\n(myungsim_30day_journey_{userId})"]
        Sessions["myeongsim_personal_sessions_{userId}\n(SCAN 기록)"]
        Experiments["myungsim_behavior_experiments_{userId}\n(10% 행동실험 기록)"]
    end

    HomeWidget --> Engine_Layer
    JourneyPage --> Engine_Layer
    Engine_Layer --> Data_Storage
    Tracker -.-> AdminView
```

### 1) `JourneyStore` (로컬 격리 저장소 관리자)
- **네임스페이스 격리**: 사용자 식별자(`userId`)별로 독립된 키(`myungsim_30day_journey_{userId}`)를 사용하여 공용 기기에서도 데이터 혼선 방지.
- **라이프사이클 제어**: `startJourney()`, `pauseJourney()`, `resumeJourney()`, `completeJourney()`, `deleteJourney(includePersonalRecords)`.
- **보존 정책**: 여정 그룹핑만 삭제할 경우에도 사용자의 소중한 SCAN 및 행동실험 기록은 삭제되지 않고 안전하게 보존됨.

### 2) `JourneyStateMachine` (순수 결정론적 상태 머신)
- 외부 AI 판단 없이, 브라우저 로컬의 세션 수와 행동실험 상태(TRYING, DONE, PLANNED 등)만을 기반으로 규칙 기반 분기 수행.
- 현재 날짜와 종료일(`windowEndAt`)을 비교하여 잔여 일수 계산 및 30일 도달 여부 판정.
- **Time Travel API 지원**: 모의 날짜(`testMockDate`)를 주입하여 1일차, 15일차, 30일차, 45일차 상태를 즉시 재현 및 검증 가능.

### 3) `JourneyReviewEngine` (8대 질문 기반 팩트 회고 엔진)
- 성적표나 점수 그래프, AI의 주관적 추론을 전면 배제.
- 사용자가 직접 입력한 기록을 바탕으로 8대 표준 질문에 대한 요약을 사실 그대로 추출:
  1. 가장 자주 나타난 장면
  2. 자주 스쳐간 생각 (STORY)
  3. 몸에서 먼저 나타난 신호 (BODY)
  4. 올라왔던 충동 (URGE)
  5. 평소 주로 했던 반응 (Before Action)
  6. 새롭게 시도해본 10% 작은 행동 (Recent Action)
  7. 예상과 실제의 차이 (Expected vs Actual)
  8. 다음 삶으로 가져가고 싶은 선택 (Next Choice)

### 4) `trackSafeJourneyEvent` (프라이버시 무결성 디스패처)
- 사용자의 일기, 장면 상세 설명, 고민 내용 등 원문 텍스트(Raw Text)를 전송 페이로드에서 **100% 원천 삭제(delete)**.
- 오직 `journeyId`, `phase`, `status`, `intention`, `daysRemaining` 등의 익명 카운트 메트릭만 브라우저 내부 이벤트 및 집계기로 전달.

---

## 3. 데이터 모델 명세

```json
{
  "journeyId": "jrn_1726915200000_a1b2c",
  "userId": "usr_99812",
  "startedAt": "2026-09-21T10:00:00.000Z",
  "windowEndAt": "2026-10-21T10:00:00.000Z",
  "status": "ACTIVE",
  "currentPhase": "NOTICE",
  "intention": "divide",
  "focusSceneDescription": "답장이 늦을 때 불안해서 바로 다시 확인하는 것",
  "experiences": [
    {
      "id": "jexp_1726915250000",
      "type": "scan",
      "cardId": "M-034",
      "cardTitle": "답장을 재촉하고 싶은 순간의 1분",
      "action": "스마트폰을 서랍에 넣고 15분 동안 내 할 일 집중하기",
      "actualResult": "",
      "phase": "TRY",
      "recordedAt": "2026-09-21T10:05:00.000Z"
    }
  ],
  "createdAt": "2026-09-21T10:00:00.000Z",
  "updatedAt": "2026-09-21T10:05:00.000Z"
}
```

---

## 4. 기존 시스템과의 통합 및 인터페이스

1. **Personal Home v2 연동**:
   - `my/home.html`의 `#sec-30day-journey-home` 섹션에 여정 상태 카드가 동적으로 주입됩니다.
   - 여정 미시작 시: 부담 없는 시작 제안 카드(닫기 가능).
   - 여정 진행 중: 현재 Phase 및 "다음 추천 스텝" 카드 표시.
2. **Behavior Experiment Loop 연동**:
   - 여정 내에서 제안된 10% 작은 행동은 즉시 `MyungsimExperiment` 모달로 전달되어 예상 고통 점수 및 예상 결과를 기록할 수 있습니다.
3. **Working Map 연동**:
   - 3회 이상의 관찰이 누적되면 `MAP` Phase로 자연스럽게 이동하여, 나의 반복 작동 패턴(TRIGGER → STORY → BODY → URGE → ACTION)을 시각적으로 확인합니다.

---

## 5. 결론 및 신뢰성 확인

- **외부 AI 호출**: 0건 (100% 무과금, 무지연)
- **개인 원문 데이터 유출**: 0건 (100% 브라우저 로컬 저장)
- **반응형 뷰포트**: 모바일 390px (iPhone / Galaxy) 및 데스크톱 완벽 지원
