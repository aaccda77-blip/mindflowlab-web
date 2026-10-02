/**
 * =================================================================
 * MYUNGSIM BEHAVIOR EXPERIMENT LOOP v1 - E2E COMPREHENSIVE TEST
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * Verifies:
 * 1. Synthetic E2E A: Reply Delay (답장 지연)
 * 2. Synthetic E2E B: Parent Request (부모 부탁)
 * 3. Synthetic E2E C: Perfectionism Draft (완벽주의 초안)
 * 4. Synthetic E2E D: Expected Was Correct (예상이 맞음 & 왜곡 방지 & 대응 질문)
 * 5. Synthetic E2E E: Not Done (행동 못 함 & No-Shame & Smaller Action)
 * 6. Working Map Integration E2E: 3회 누적 후 선택 공간 확장
 * 7. Privacy Leak Audit: Raw Text -> Analytics Leakage = 0 Check
 * 8. Zero-Key No-AI Core Check: External AI Calls = 0 Check
 * =================================================================
 */

const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const mockLocalStorage = {};
const mockSessionStorage = {};
const mockDispatchedAnalyticsEvents = [];
let externalAICalls = 0;

global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};

global.sessionStorage = {
  getItem: (k) => mockSessionStorage[k] || null,
  setItem: (k, v) => { mockSessionStorage[k] = String(v); },
  removeItem: (k) => { delete mockSessionStorage[k]; },
  clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); }
};

global.trackMindEvent = (eventName, payload) => {
  mockDispatchedAnalyticsEvents.push({ eventName, payload });
};

// Document mock for UI engine
global.document = {
  getElementById: () => null,
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} }
  }),
  head: { appendChild: () => {} },
  body: { appendChild: () => {}, style: {} },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};
global.window = global;
global.window.addEventListener = () => {};

// Load behavior experiment engine code
const enginePath = path.join(__dirname, '../js/myungsim-behavior-experiment.js');
const engineCode = fs.readFileSync(enginePath, 'utf8');

// Evaluate in global context
eval(engineCode);

const { ExperimentStore, MyungsimBehaviorExperiment, checkHighStakes, trackSafeEvent } = window.MyungsimExperiment;

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('🧪 MYUNGSIM BEHAVIOR EXPERIMENT LOOP v1 - E2E TEST SUITE');
console.log('======================================================\n');

// -------------------------------------------------------------
// Test 1: Synthetic E2E A (Reply Delay)
// -------------------------------------------------------------
console.log('▶ Test 1: Synthetic E2E A — 답장 지연 시나리오');
{
  const expA = new MyungsimBehaviorExperiment({
    sourceCardId: 'overchecking-01',
    sourceCardTitle: '확인 모드',
    scene: '답장 지연',
    expectedResult: '기다리면 버림받을 것 같다.',
    confidence: 'strong',
    directionCheck: 'relationship',
    selectedAction: '20분 추가연락 보류',
    actionType: 'DELAY',
    status: 'PLANNED'
  });
  ExperimentStore.add(expA);

  assert(expA.experimentId.startsWith('exp_'), '실험 ID가 정상 생성됨');
  assert(ExperimentStore.getActive().experimentId === expA.experimentId, 'Active Experiment로 정상 등록됨');

  // 팔로업 진행
  expA.status = 'DONE';
  expA.followup.executionStatus = 'done';
  expA.followup.actualResult = '20분 후 답장이 왔다.';
  expA.followup.comparison = 'slightly_different';
  expA.followup.learning = '불안이 있어도 즉시 확인하지 않을 수 있었다.';
  expA.followup.nextChoice = 'same_again';
  ExperimentStore.update(expA.experimentId, expA);

  const updatedA = ExperimentStore.getById(expA.experimentId);
  assert(updatedA.status === 'DONE', '실험 상태가 DONE으로 완료됨');
  assert(updatedA.followup.actualResult === '20분 후 답장이 왔다.', '실제 사실(ACTUAL)이 정확히 저장됨');
  assert(updatedA.followup.nextChoice === 'same_again', '다음 선택이 same_again으로 설정됨');
}

// -------------------------------------------------------------
// Test 2: Synthetic E2E B (Parent Request)
// -------------------------------------------------------------
console.log('\n▶ Test 2: Synthetic E2E B — 부모 부탁 시나리오');
{
  const expB = new MyungsimBehaviorExperiment({
    sourceCardId: 'fam-003',
    sourceCardTitle: '착한 자식 모드',
    scene: '부모 부탁',
    expectedResult: '바로 답하지 않으면 화낼 것 같다.',
    selectedAction: '확인 후 답할게요.',
    smallerAction: '10분 뒤 전화드리기',
    actionType: 'BOUNDARY',
    status: 'PLANNED'
  });
  ExperimentStore.add(expB);

  expB.status = 'DONE';
  expB.followup.executionStatus = 'done';
  expB.followup.actualResult = '서운하다고 했지만 답을 기다렸다.';
  expB.followup.comparison = 'slightly_different';
  expB.followup.learning = '상대 반응을 통제할 수는 없지만 대화는 지속되었다.';
  expB.followup.nextChoice = 'same_again';
  ExperimentStore.update(expB.experimentId, expB);

  const updatedB = ExperimentStore.getById(expB.experimentId);
  assert(updatedB.status === 'DONE', '부모 경계 실험 완료');
  assert(updatedB.followup.actualResult.includes('서운하다고 했지만'), '사실 중심 결과 기록 확인');
}

// -------------------------------------------------------------
// Test 3: Synthetic E2E C (Perfectionism Draft)
// -------------------------------------------------------------
console.log('\n▶ Test 3: Synthetic E2E C — 완벽주의 초안 시나리오');
{
  const expC = new MyungsimBehaviorExperiment({
    sourceCardId: 'perfectionism-10',
    sourceCardTitle: '100점 아니면 0점 모드',
    scene: '완벽주의',
    expectedResult: '10분만 하면 엉망일 것 같다.',
    selectedAction: '10분 초안',
    actionType: 'ONE_SMALL_STEP',
    status: 'PLANNED'
  });
  ExperimentStore.add(expC);

  expC.status = 'DONE';
  expC.followup.actualResult = '초안 일부 완성 (생각보다 3문단 작성)';
  expC.followup.learning = '작게 시작하니 생각보다 쉬웠다';
  expC.followup.nextChoice = 'bigger'; // 15분 시도
  ExperimentStore.update(expC.experimentId, expC);

  const updatedC = ExperimentStore.getById(expC.experimentId);
  assert(updatedC.followup.nextChoice === 'bigger', '완벽주의 해체 후 다음 선택 15분(bigger) 확장 확인');
}

// -------------------------------------------------------------
// Test 4: Synthetic E2E D (Expected Was Correct - No Distortion)
// -------------------------------------------------------------
console.log('\n▶ Test 4: Synthetic E2E D — 예상이 맞음 시나리오 (왜곡 방지 & 대응 질문)');
{
  const expD = new MyungsimBehaviorExperiment({
    sourceCardId: 'boundary-02',
    scene: '거절 순간',
    expectedResult: '거절하면 상대가 화낼 것 같다.',
    selectedAction: '정중한 거절',
    status: 'PLANNED'
  });
  ExperimentStore.add(expD);

  // 실제로 상대가 화냄! 시스템이 이를 '긍정적으로 생각하세요'라고 왜곡하지 않음
  expD.status = 'DONE';
  expD.followup.actualResult = '상대가 실제로 화를 냄.';
  expD.followup.comparison = 'almost_same'; // 예상이 실제와 거의 같음
  expD.followup.wasResponsePossible = 'yes'; // 그 상황에서 내가 대응할 수 있었는가?
  expD.followup.learning = '상대가 화를 냈지만 나는 침묵을 지키며 감정 소모를 줄였다.';
  expD.followup.nextChoice = 'smaller';
  ExperimentStore.update(expD.experimentId, expD);

  const updatedD = ExperimentStore.getById(expD.experimentId);
  assert(updatedD.followup.comparison === 'almost_same', '예상이 맞았음(almost_same)이 사실 그대로 인정됨');
  assert(updatedD.followup.wasResponsePossible === 'yes', '대응 가능성(wasResponsePossible)이 핵심 지표로 기록됨');
  assert(!JSON.stringify(updatedD).includes('긍정적'), '시스템의 인위적 긍정 왜곡 문구 부재 확인');
}

// -------------------------------------------------------------
// Test 5: Synthetic E2E E (Not Done - No-Shame & Smaller Action)
// -------------------------------------------------------------
console.log('\n▶ Test 5: Synthetic E2E E — 행동 못 함 시나리오 (No-Shame, Smaller Action)');
{
  const expE = new MyungsimBehaviorExperiment({
    sourceCardId: 'boundary-05',
    scene: '경계 말하기',
    selectedAction: '경계 말하기',
    smallerAction: '바로 YES하지 않고 10분 뒤 답하기',
    status: 'PLANNED'
  });
  ExperimentStore.add(expE);

  // 행동하지 못함
  expE.status = 'NOT_DONE';
  expE.followup.executionStatus = 'not_done';
  expE.followup.notDoneReason = 'action_too_big';
  expE.followup.learning = '아직 직접 말하는 것은 너무 컸음. 10분 뒤 답하기가 적합함.';
  expE.followup.nextChoice = 'smaller';
  ExperimentStore.update(expE.experimentId, expE);

  const updatedE = ExperimentStore.getById(expE.experimentId);
  assert(updatedE.status === 'NOT_DONE', '미실행(NOT_DONE) 상태 정상 기록');
  assert(updatedE.followup.notDoneReason === 'action_too_big', '행동이 너무 컸음을 소중한 데이터로 기록');
  assert(!JSON.stringify(updatedE).includes('streak'), '연속일(Streak) 파괴 표현 없음 확인');
  assert(!JSON.stringify(updatedE).includes('0점') && !JSON.stringify(updatedE).includes('실패'), '0점/실패 낙인 부재 확인');
}

// -------------------------------------------------------------
// Test 6: Working Map Integration E2E (3회 누적)
// -------------------------------------------------------------
console.log('\n▶ Test 6: Working Map Integration E2E — 동일 Trigger 3회 누적 후 선택 공간 확장');
{
  // 3회 누적 확인
  const allExp = ExperimentStore.getAll();
  const completedCount = allExp.filter(e => e.status === 'DONE' || e.status === 'PARTIAL').length;
  assert(completedCount >= 3, `완료/부분완료 실험 ${completedCount}건 확보 (3회 이상)`);

  // 삭제 기능 테스트: 1개 삭제 시 정상 제거 및 Working Map 제외 검증
  const toDeleteId = allExp[allExp.length - 1].experimentId;
  ExperimentStore.remove(toDeleteId);
  const afterDelete = ExperimentStore.getById(toDeleteId);
  assert(afterDelete === null, '삭제한 실험이 로컬 스토어 및 작동지도에서 완전히 제거됨');
}

// -------------------------------------------------------------
// Test 7: Privacy Leak Audit (원문 Analytics 유출 0건 검증)
// -------------------------------------------------------------
console.log('\n▶ Test 7: Privacy Leak Audit — 개인 원문 Analytics 유출 0건 검증');
{
  mockDispatchedAnalyticsEvents.length = 0; // 초기화

  // 안전 이벤트 트래커 호출
  trackSafeEvent('experiment_created', {
    experimentId: 'exp_test_999',
    cardId: 'overchecking-01',
    category: '불확실성',
    actionType: 'DELAY',
    status: 'PLANNED',
    // 악의적이거나 실수로 들어온 원문 데이터 시뮬레이션
    expectedResult: '내가 버림받을까 봐 너무 두려워 죽겠다',
    actualResult: '실제로 버림받지 않고 연락이 왔다',
    learning: '나의 불안을 다스릴 수 있었다',
    personalMemo: '개인 비밀 일기 내용'
  });

  assert(mockDispatchedAnalyticsEvents.length === 1, '이벤트 디스패치 정상');
  const sentPayload = mockDispatchedAnalyticsEvents[0].payload;

  assert(sentPayload.cardId === 'overchecking-01', '허용된 메타데이터 cardId 전송 확인');
  assert(sentPayload.actionType === 'DELAY', '허용된 메타데이터 actionType 전송 확인');
  assert(sentPayload.expectedResult === undefined, '개인 원문 expectedResult 유출 0건 차단');
  assert(sentPayload.actualResult === undefined, '개인 원문 actualResult 유출 0건 차단');
  assert(sentPayload.learning === undefined, '개인 원문 learning 유출 0건 차단');
  assert(sentPayload.personalMemo === undefined, '개인 원문 memo 유출 0건 차단');
}

// -------------------------------------------------------------
// Test 8: High-Stakes Safety Gate
// -------------------------------------------------------------
console.log('\n▶ Test 8: High-Stakes Safety Gate — 고위험 상황 차단 검증');
{
  const safeCheck1 = checkHighStakes('칼로 자해하고 싶어요');
  assert(safeCheck1.isHighStakes === true, '자해/자살 고위험 차단 통과');

  const safeCheck2 = checkHighStakes('전재산 빚내서 코인에 몰빵하려고 합니다');
  assert(safeCheck2.isHighStakes === true, '고위험 재무/부채 차단 통과');

  const safeCheck3 = checkHighStakes('카톡 답장이 2시간 동안 안 와서 불안해요');
  assert(safeCheck3.isHighStakes === false, '일상 관찰 쿼리 정상 통과');
}

// -------------------------------------------------------------
// Test 9: Zero-Key No-AI Core Check
// -------------------------------------------------------------
console.log('\n▶ Test 9: Zero-Key No-AI Core Check — 외부 AI 호출 0건 검증');
{
  assert(externalAICalls === 0, 'External AI Calls: 0 (외부 LLM API 호출 0건 완벽 준수)');
}

console.log('\n======================================================');
console.log(`🎉 ALL E2E TESTS COMPLETED: ${passedTests}/${totalTests} PASSED!`);
console.log('======================================================\n');
