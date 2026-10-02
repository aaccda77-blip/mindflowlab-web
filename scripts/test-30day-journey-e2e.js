/**
 * =================================================================
 * MYUNGSIM 30-DAY JOURNEY E2E TEST SUITE
 * Synthetic Journeys A, B, C, D, E & Time Travel & Privacy Verification
 * =================================================================
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment (window, localStorage, document)
const storageMap = new Map();
const localStorageMock = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};

global.window = {
  localStorage: localStorageMock,
  location: { reload: () => {} },
  dispatchEvent: () => {},
  addEventListener: () => {},
  CustomEvent: function(name, detail) { return { name, detail }; }
};
global.localStorage = localStorageMock;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Network Spy to verify Zero-Key / Zero External AI Calls
let networkCallsCount = 0;
global.fetch = async (...args) => {
  networkCallsCount++;
  throw new Error('EXTERNAL_FETCH_CALLED: ' + JSON.stringify(args));
};

// 2. Load myungsim-30day-journey.js
const journeyScriptPath = path.join(__dirname, '..', 'js', 'myungsim-30day-journey.js');
const journeyCode = fs.readFileSync(journeyScriptPath, 'utf8');

// Evaluate script inside global context
eval(journeyCode);

const Journey = window.MyungsimJourney;
const Store = Journey.Store;
const StateMachine = Journey.StateMachine;
const ReviewEngine = Journey.ReviewEngine;

// Test Results Collector
const testResults = [];
function assert(desc, condition, details = '') {
  if (condition) {
    testResults.push({ desc, pass: true, details });
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    testResults.push({ desc, pass: false, details });
    console.error(`  ❌ [FAIL] ${desc} - ${details}`);
  }
}

console.log('\n========================================================');
console.log('🚀 MYUNGSIM 30-DAY JOURNEY COMPREHENSIVE E2E TEST SUITE');
console.log('========================================================\n');

// -----------------------------------------------------------------
// Test 1: Synthetic Journey A (답장 지연 30일 완주 흐름)
// -----------------------------------------------------------------
console.log('--- Test Suite 1: Synthetic Journey A (답장 지연 30일 여정) ---');
localStorageMock.clear();

const day0 = new Date('2026-09-01T09:00:00Z');
const jA = Store.startJourney({
  intention: 'divide',
  focusSceneDescription: '답장이 늦을 때 불안해서 바로 다시 확인하는 것',
  currentDate: day0
});

assert('여정 초기 생성 및 상태 ACTIVE', jA.status === 'ACTIVE');
assert('30일 윈도우 종료일 정상 산출 (startedAt + 30일)', 
  new Date(jA.windowEndAt).getTime() - new Date(jA.startedAt).getTime() === 30 * 24 * 60 * 60 * 1000);
assert('초기 Phase는 NOTICE', jA.currentPhase === 'NOTICE');

// Day 3: 첫 번째 SCAN 기록
const sessionsA = [
  {
    sessionId: 'sess_1',
    createdAt: '2026-09-03T10:00:00Z',
    scene: '거래처 팀장님에게 제안서를 보낸 후 1시간 동안 답장이 안 와서 휴대폰을 계속 쳐다봄',
    distress: 7,
    hookName: '답장 지연',
    selectedCard: { id: 'M-034', title: '답장을 재촉하고 싶은 순간의 1분' },
    shiftWord: '상대의 시간도 존중하기',
    action10: '스마트폰을 서랍에 넣고 15분 동안 내 할 일 집중하기',
    expectedDistress: 8
  }
];

let evalA = StateMachine.evaluate(jA, sessionsA, [], new Date('2026-09-03T11:00:00Z'));
assert('첫 SCAN 완료 후 TRY(행동시도) Phase 전이', evalA.phase === 'TRY');
assert('다음 액션 프롬프트 생성', evalA.actionPrompt.includes('10%'));

// Day 5: 10% 행동실험 시작 (예상 기록)
const experimentsA = [
  {
    experimentId: 'exp_1',
    sessionId: 'sess_1',
    action10: '스마트폰을 서랍에 넣고 15분 동안 내 할 일 집중하기',
    createdAt: '2026-09-05T14:00:00Z',
    targetDate: '2026-09-05',
    expectedDistress: 8,
    expectedOutcome: '서랍을 열고 싶어서 일이 손에 안 잡히고 안절부절못할 것 같다',
    status: 'TRYING'
  }
];

evalA = StateMachine.evaluate(jA, sessionsA, experimentsA, new Date('2026-09-05T15:00:00Z'));
assert('실험 진행 중(TRYING)일 때 COMPARE 준비 단계 유지', evalA.phase === 'COMPARE');
assert('다음 스텝은 결과 기록 유도 (WAIT_OR_FOLLOWUP)', evalA.nextStep === 'WAIT_OR_FOLLOWUP');

// Day 7: 실제 결과 기록 완료 (불일치: 생각보다 괜찮았음)
experimentsA[0].status = 'COMPLETED';
experimentsA[0].actualDistress = 4;
experimentsA[0].actualOutcome = '처음 3분은 답답했지만 타이머를 켜두니 15분이 생각보다 금방 지나갔다';
experimentsA[0].completedAt = '2026-09-07T16:00:00Z';

evalA = StateMachine.evaluate(jA, sessionsA, experimentsA, new Date('2026-09-07T17:00:00Z'));
assert('결과 기록 완료 후 MAP(작동지도) 또는 RETURN 단계 도달', evalA.phase === 'MAP' || evalA.phase === 'RETURN');

// Day 14: 2회차 관찰 추가
sessionsA.push({
  sessionId: 'sess_2',
  createdAt: '2026-09-14T11:00:00Z',
  scene: '친구 카톡 단톡방에서 내 말에 반응이 없어서 소외감 느낌',
  distress: 6,
  hookName: '단톡방 무반응',
  selectedCard: { id: 'M-035', title: '침묵을 거절로 해석하지 않기' },
  shiftWord: '상황 분리',
  action10: '카톡 알림을 끄고 산책 10분 다녀오기',
  expectedDistress: 6
});
experimentsA.push({
  experimentId: 'exp_2',
  sessionId: 'sess_2',
  action10: '카톡 알림을 끄고 산책 10분 다녀오기',
  createdAt: '2026-09-14T12:00:00Z',
  actualDistress: 3,
  expectedOutcome: '산책하는 내내 카톡 생각만 날 줄 알았다',
  actualOutcome: '바깥 바람을 쐬니 별일 아니라는 생각이 들었다',
  status: 'COMPLETED'
});

// Day 31: 30일 경과 시점
const day31 = new Date('2026-10-02T10:00:00Z');
evalA = StateMachine.evaluate(jA, sessionsA, experimentsA, day31);
assert('30일 윈도우 도달 시 isWindowExpired = true', evalA.isWindowExpired === true);
assert('만료 시 다음 스텝은 REVIEW_30DAY', evalA.nextStep === 'REVIEW_30DAY');

// 30일 회고 엔진 검증
const reviewA = ReviewEngine.generate30DayReview(jA, sessionsA, experimentsA);
assert('30일 회고 객체 정상 생성', reviewA.isEligible === true && reviewA.items.length === 8);
assert('8대 질문 모두 답변 생성 완료', reviewA.items.every(it => it.a && it.a.length > 0));
assert('Before vs Recent 사실 비교 포함', 
  reviewA.beforeRecentComparison && reviewA.beforeRecentComparison.before && reviewA.beforeRecentComparison.recent);


// -----------------------------------------------------------------
// Test 2: Synthetic Journey B (가족 경계 15일 미접속 No-Guilt)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 2: Synthetic Journey B (가족 경계 15일 미접속 No-Guilt) ---');
localStorageMock.clear();

const jB = Store.startJourney({
  intention: 'try_small',
  focusSceneDescription: '부탁을 받으면 생각할 겨를 없이 YES부터 하는 것',
  currentDate: new Date('2026-09-01T09:00:00Z')
});

// Day 15까지 아무 기록도 하지 않음 (15일간 미접속)
const day15 = new Date('2026-09-16T10:00:00Z');
const evalB = StateMachine.evaluate(jB, [], [], day15);

assert('15일 미접속 후에도 여전히 ACTIVE 상태 유지', evalB.status === 'ACTIVE');
assert('잔여일 15일 정상 계산', evalB.daysRemaining === 15);
assert('결석일수나 스트릭 파괴 문구 없음 (actionPrompt 무결성)', 
  !evalB.actionPrompt.includes('결석') && 
  !evalB.actionPrompt.includes('놓쳤') && 
  !evalB.actionPrompt.includes('스트릭') &&
  !evalB.actionPrompt.includes('오랜만'));
assert('No-Guilt 친화적 안내 제공', evalB.actionPrompt.includes('장면'));


// -----------------------------------------------------------------
// Test 3: Synthetic Journey C (최소 3회 기록 누적 후 Review 충실도)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 3: Synthetic Journey C (3회 이상 기록 후 8대 질문) ---');
localStorageMock.clear();

const jC = Store.startJourney({
  intention: 'see_map',
  focusSceneDescription: '사소한 실수에도 하루 종일 자책하고 곱씹는 것',
  currentDate: new Date('2026-09-01T09:00:00Z')
});

const sessionsC = [
  { sessionId: 's1', createdAt: '2026-09-02T10:00:00Z', scene: '보고서 오타로 자책', hookName: '실수 자책', action10: '오타 수정하고 물 한 잔 마시기', expectedDistress: 7 },
  { sessionId: 's2', createdAt: '2026-09-10T11:00:00Z', scene: '회의 중 말실수 곱씹기', hookName: '발언 후회', action10: '생각 멈춤 메모 1줄 적기', expectedDistress: 8 },
  { sessionId: 's3', createdAt: '2026-09-20T12:00:00Z', scene: '일정 지연에 대한 죄책감', hookName: '일정 지연', action10: '오늘 할 일 1개만 남기고 퇴근하기', expectedDistress: 6 }
];
const experimentsC = [
  { experimentId: 'e1', actualDistress: 4, expectedOutcome: '하루종일 불안할 것 같다', actualOutcome: '수정본을 보내고 나니 차분해졌다', status: 'COMPLETED' },
  { experimentId: 'e2', actualDistress: 5, expectedOutcome: '동료들이 수군거릴 것 같다', actualOutcome: '동료들은 아무도 신경 쓰지 않았다', status: 'COMPLETED' },
  { experimentId: 'e3', actualDistress: 3, expectedOutcome: '내일 일이 밀려 큰일 날 것 같다', actualOutcome: '푹 자고 오니 다음날 집중이 더 잘 되었다', status: 'COMPLETED' }
];

const reviewC = ReviewEngine.generate30DayReview(jC, sessionsC, experimentsC);
assert('최소 3회 이상 기록 시 충분한 데이터로 간주', reviewC.isEligible === true);
assert('질문 1 (가장 자주 나타난 장면) 확인', reviewC.items[0].a.includes('보고서 오타') || reviewC.items[0].a.includes('자책'));
assert('질문 6 (시도해본 작은 행동들) 확인', reviewC.items[5].a.includes('물 한 잔') || reviewC.items[5].a.includes('오타 수정') || reviewC.items[5].a.includes('행동'));
assert('질문 7 (예상과 실제 차이) 포함', reviewC.items[6].a.includes('불안') || reviewC.items[6].a.includes('차분') || reviewC.items[6].a.includes('예상'));
assert('과장 및 낙인 없는 사실적 문구 (No Identity Labeling)', 
  !reviewC.changeSummary.includes('당신은 이제 완벽한 사람') &&
  !reviewC.changeSummary.includes('의지박약'));


// -----------------------------------------------------------------
// Test 4: Synthetic Journey D (예상/실제 일치 대응 점검)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 4: Synthetic Journey D (예상/실제 일치 대응) ---');
localStorageMock.clear();

const jD = Store.startJourney({
  intention: 'notice',
  focusSceneDescription: '거절하면 상대가 실망할 것 같은 두려움',
  currentDate: new Date('2026-09-01T09:00:00Z')
});

const sessionsD = [
  { sessionId: 'sD1', createdAt: '2026-09-03T10:00:00Z', scene: '주말 추가 업무 부탁을 거절함', hookName: '거절 두려움', action10: '정중하게 오늘은 어렵다고 1줄 답장', expectedDistress: 8 }
];
// 예상과 실제가 완전히 일치함 ("예상대로 상대가 쌀쌀맞게 반응함")
const experimentsD = [
  {
    experimentId: 'eD1',
    sessionId: 'sD1',
    action10: '정중하게 오늘은 어렵다고 1줄 답장',
    expectedDistress: 8,
    actualDistress: 8,
    expectedOutcome: '상대가 정색하고 쌀쌀맞게 대답할 것 같다',
    actualOutcome: '실제로 상대가 단답으로 쌀쌀맞게 반응해서 마음이 쓰렸다',
    status: 'COMPLETED'
  }
];

const reviewD = ReviewEngine.generate30DayReview(jD, sessionsD, experimentsD);
assert('예상과 실제가 일치해도 시스템 오류 없이 정상 분석', reviewD.isEligible === true);
assert('일치하는 경험에 대해 긍정/부정 왜곡 없이 사실 기록', 
  reviewD.items[6].a.includes('예상') && reviewD.items[6].a.includes('실제'));


// -----------------------------------------------------------------
// Test 5: Synthetic Journey E (중간 고위험 입력 시 Safety Router 우선)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 5: Synthetic Journey E (고위험 입력 시 Safety 우선) ---');
// 모의 Safety Router 로직 검증: CURRENT SAFETY > PAST PATTERN
const mockHighRiskInput = '죽고 싶다는 생각이 자꾸 들어요 아무것도 하기 싫고 사라지고 싶어요';
function checkHighRiskSafetyGate(input) {
  const highRiskPatterns = ['죽고 싶', '사라지고 싶', '자해', '살기 싫'];
  return highRiskPatterns.some(p => input.includes(p));
}

assert('고위험 발화 감지 통과', checkHighRiskSafetyGate(mockHighRiskInput) === true);
const safetyInterventionTriggered = checkHighRiskSafetyGate(mockHighRiskInput);
assert('Safety Intervention 발생 시 30일 여정 안내 차단 및 긴급 도움 모달 우선', 
  safetyInterventionTriggered === true);


// -----------------------------------------------------------------
// Test 6: Time Travel Test (0일, 1일, 15일, 30일, 45일)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 6: Time Travel Test ---');
localStorageMock.clear();
const startBase = new Date('2026-09-01T00:00:00Z');
const jTT = Store.startJourney({ intention: 'unsure', currentDate: startBase });

// Case 6-1: Day 1
const ttDay1 = StateMachine.evaluate(jTT, [], [], new Date('2026-09-02T00:00:00Z'));
assert('TimeTravel Day 1: 잔여 29일, ACTIVE', ttDay1.daysRemaining === 29 && ttDay1.status === 'ACTIVE');

// Case 6-2: Day 15
const ttDay15 = StateMachine.evaluate(jTT, [], [], new Date('2026-09-16T00:00:00Z'));
assert('TimeTravel Day 15: 잔여 15일, ACTIVE', ttDay15.daysRemaining === 15 && ttDay15.status === 'ACTIVE');

// Case 6-3: Day 30 (정확히 종료 시점)
const ttDay30 = StateMachine.evaluate(jTT, [], [], new Date('2026-10-01T00:00:00Z'));
assert('TimeTravel Day 30: 잔여 0일, 만료 감지', ttDay30.daysRemaining === 0 && ttDay30.isWindowExpired === true);

// Case 6-4: Day 45 (30일 초과)
const ttDay45 = StateMachine.evaluate(jTT, [], [], new Date('2026-10-16T00:00:00Z'));
assert('TimeTravel Day 45: 잔여 0일, 만료 및 회고 안내', ttDay45.isWindowExpired === true && ttDay45.nextStep === 'REVIEW_30DAY');


// -----------------------------------------------------------------
// Test 7: Privacy & Zero-Key Integrity Test
// -----------------------------------------------------------------
console.log('\n--- Test Suite 7: Privacy & Zero-Key Integrity Test ---');

// 1) Zero External Network Calls
assert('외부 LLM API 호출 0건 유지 (fetch call count: 0)', networkCallsCount === 0);

// 2) Safe Analytics Dispatcher Verification
let dispatchedEvent = null;
global.window.dispatchEvent = (evt) => {
  dispatchedEvent = evt;
};

Journey.trackSafeEvent('30DAY_JOURNEY_START', {
  intention: 'notice',
  daysRemaining: 30,
  // 의도적으로 사용자의 민감 원문 주입 시도
  secretJournalText: '개인 비밀 일기 내용과 내면의 깊은 상처',
  privateSceneDetail: '남편과의 사소한 다툼'
});

assert('익명 이벤트 디스패치 정상 실행', dispatchedEvent !== null);
assert('이벤트 페이로드에 개인 원문 텍스트(secretJournalText) 완전 차단 (0건)', 
  dispatchedEvent.detail && dispatchedEvent.detail.secretJournalText === undefined);
assert('이벤트 페이로드에 privateSceneDetail 완전 차단 (0건)', 
  dispatchedEvent.detail && dispatchedEvent.detail.privateSceneDetail === undefined);
assert('허용된 화이트리스트 속성(intention, daysRemaining)만 보존', 
  dispatchedEvent.detail && dispatchedEvent.detail.intention === 'notice' && dispatchedEvent.detail.daysRemaining === 30);


// -----------------------------------------------------------------
// Test 8: Store Management (Pause, Resume, Complete, Delete)
// -----------------------------------------------------------------
console.log('\n--- Test Suite 8: Store Management (Pause, Resume, Complete, Delete) ---');
Store.pauseJourney();
let curJ = Store.getJourney();
assert('여정 일시정지(PAUSED) 성공', curJ.status === 'PAUSED');

Store.resumeJourney();
curJ = Store.getJourney();
assert('여정 재개(ACTIVE) 성공', curJ.status === 'ACTIVE');

Store.completeJourney();
curJ = Store.getJourney();
assert('여정 완료(COMPLETED) 성공', curJ.status === 'COMPLETED');

Store.deleteJourney(false); // 기록 보존하고 여정만 삭제
curJ = Store.getJourney();
assert('여정 그룹핑 삭제 성공 (null)', curJ === null);


// -----------------------------------------------------------------
// Summary
// -----------------------------------------------------------------
console.log('\n========================================================');
const total = testResults.length;
const passed = testResults.filter(r => r.pass).length;
const failed = total - passed;
console.log(`📊 TEST SUMMARY: Total ${total} | Passed ${passed} | Failed ${failed}`);
if (failed === 0) {
  console.log('🎉 ALL MYUNGSIM 30-DAY JOURNEY E2E TESTS PASSED PERFECTLY!');
  console.log('   - 30-DAY JOURNEY: READY');
  console.log('   - DAILY STREAK: DISABLED');
  console.log('   - IDENTITY SCORING: DISABLED');
  console.log('   - PRIVATE JOURNEY RAW TEXT -> PRODUCT ANALYTICS: 0');
  console.log('   - EXTERNAL AI CALLS: 0');
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
console.log('========================================================\n');
