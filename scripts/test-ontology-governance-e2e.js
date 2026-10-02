/**
 * MyungSim Knowledge Graph QA & Ontology Governance E2E Test Suite
 * ===================================================================
 * 10대 계층 분리, 5대 분리 원칙, 15대 Synthetic 자연어 매핑,
 * 거버넌스 룰(Merge Dry Run/Rollback), Zero-Key 무결성 전수 검증 스크립트.
 */

const assert = require('assert');
const path = require('path');

// 로컬 환경 모듈 로드
const MyungSimOntologyGovernance = require('../js/myungsim-ontology-governance.js');
const MyungSimKnowledgeGraph = require('../js/myungsim-knowledge-graph.js');

let passCount = 0;
let failCount = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}: ${err.message}`);
    failCount++;
  }
}

console.log('\n===============================================================');
console.log('🧪 MYUNGSIM KNOWLEDGE GRAPH QA & ONTOLOGY GOVERNANCE E2E TESTS');
console.log('===============================================================\n');

// 1. 10대 온톨로지 계층 구조 검증
console.log('--- [Group 1] 10대 온톨로지 계층(Layer 1~10) 스키마 검증 ---');
runTest('10대 계층 스키마가 모두 정의되어 있어야 함', () => {
  const layers = MyungSimOntologyGovernance.layers;
  assert.strictEqual(Object.keys(layers).length, 10);
  assert.strictEqual(layers.LAYER_1_CONTEXT.layer, 1);
  assert.strictEqual(layers.LAYER_2_SCENE_TRIGGER.layer, 2);
  assert.strictEqual(layers.LAYER_3_INTERPRETATION.layer, 3);
  assert.strictEqual(layers.LAYER_4_INTERNAL_SIGNAL.layer, 4);
  assert.strictEqual(layers.LAYER_5_URGE.layer, 5);
  assert.strictEqual(layers.LAYER_6_BEHAVIOR.layer, 6);
  assert.strictEqual(layers.LAYER_7_RESULT_FUNCTION.layer, 7);
  assert.strictEqual(layers.LAYER_8_ALTERNATIVE_ACTION.layer, 8);
  assert.strictEqual(layers.LAYER_9_BOOK_CODE_CONCEPT.layer, 9);
  assert.strictEqual(layers.LAYER_10_SAFETY.layer, 10);
});

// 2. 5대 엄격 분리 원칙 (Separation Principles) 검증
console.log('\n--- [Group 2] 5대 엄격 분리 원칙 검증 ---');
runTest('원칙 1: Body Signal과 Emotion은 병합될 수 없음 (Body != Emotion)', () => {
  const body = MyungSimOntologyGovernance.concepts['BODY_CHEST_DROP'];
  const emo = MyungSimOntologyGovernance.concepts['EMO_ANXIETY'];
  const check = MyungSimOntologyGovernance.validateSeparationPrinciples(body, emo);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.violation, 'BODY_EMOTION_COLLAPSE');
});

runTest('원칙 2: Urge와 Action은 병합될 수 없음 (Urge != Action)', () => {
  const urge = MyungSimOntologyGovernance.concepts['URGE_CHECK'];
  const act = MyungSimOntologyGovernance.concepts['ACT_PHONE_CHECK'];
  const check = MyungSimOntologyGovernance.validateSeparationPrinciples(urge, act);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.violation, 'URGE_ACTION_COLLAPSE');
});

runTest('원칙 3: Scene과 Trigger는 병합될 수 없음 (Scene != Trigger)', () => {
  const scene = MyungSimOntologyGovernance.concepts['SCENE_FAMILY_MEETING'];
  const trig = MyungSimOntologyGovernance.concepts['TRIG_MOTHER_REQUEST'];
  const check = MyungSimOntologyGovernance.validateSeparationPrinciples(scene, trig);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.violation, 'SCENE_TRIGGER_COLLAPSE');
});

runTest('원칙 4: Story와 Fact는 병합될 수 없음 (Story != Fact)', () => {
  const story = MyungSimOntologyGovernance.concepts['STORY_GLOBAL_FAILURE'];
  const fact = MyungSimOntologyGovernance.concepts['FACT_CONTRACT_CANCELLED'];
  const check = MyungSimOntologyGovernance.validateSeparationPrinciples(story, fact);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.violation, 'STORY_FACT_COLLAPSE');
});

runTest('원칙 5: Function과 Strength는 병합될 수 없음 (Function != Strength)', () => {
  const func = MyungSimOntologyGovernance.concepts['PROT_AVOID_CONFLICT'];
  const str = MyungSimOntologyGovernance.concepts['STR_CARE_FOR_OTHERS'];
  const check = MyungSimOntologyGovernance.validateSeparationPrinciples(func, str);
  assert.strictEqual(check.valid, false);
  assert.strictEqual(check.violation, 'FUNCTION_STRENGTH_COLLAPSE');
});

// 3. 금지된 엣지 및 코드 서열화/정체성 라벨 차단 검증
console.log('\n--- [Group 3] 금지된 관계 및 서열화/정체성 라벨 차단 검증 ---');
runTest('3대 코드 간의 LOWER_LEVEL_THAN 서열화 엣지는 차단되어야 함', () => {
  const check = MyungSimOntologyGovernance.validateEdgeProposal('CODE_CONCEPT', 'CODE_CONCEPT', 'LOWER_LEVEL_THAN');
  assert.strictEqual(check.valid, false);
});

runTest('인과 단정 CAUSES 엣지는 차단되어야 함', () => {
  const check = MyungSimOntologyGovernance.validateEdgeProposal('TRIGGER', 'ACTION', 'CAUSES');
  assert.strictEqual(check.valid, false);
});

runTest('사용자 정체성 라벨 DEFINES_USER 엣지는 차단되어야 함', () => {
  const check = MyungSimOntologyGovernance.validateEdgeProposal('STORY', 'USER', 'DEFINES_USER');
  assert.strictEqual(check.valid, false);
});

// 4. 15대 Synthetic 자연어 매핑 테스트
console.log('\n--- [Group 4] 15대 Synthetic 자연어 매핑 및 Negative Guard 검증 ---');

runTest('Test 1: "카톡이 안 와요" -> message_no_reply (관계단절 자동추론 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("카톡이 안 와요");
  assert.strictEqual(res.mappedLayers.trigger.id, 'TRIG_MESSAGE_NO_REPLY');
  assert.strictEqual(res.mappedLayers.story, null);
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('relationship_is_ending')));
});

runTest('Test 2: "카톡이 안 와서 마음이 식었나 싶어요" -> message_no_reply + relationship_ending', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("카톡이 안 와서 마음이 식었나 싶어요");
  assert.strictEqual(res.mappedLayers.trigger.id, 'TRIG_MESSAGE_NO_REPLY');
  assert.strictEqual(res.mappedLayers.story.id, 'STORY_RELATIONSHIP_ENDING');
});

runTest('Test 3: "가슴이 철렁했어요" -> BODY_SIGNAL (불안 정서로 자동추론 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("가슴이 철렁했어요");
  assert.strictEqual(res.mappedLayers.bodySignal.id, 'BODY_CHEST_DROP');
  assert.strictEqual(res.mappedLayers.emotion, null);
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('EMOTION: anxiety')));
});

runTest('Test 4: "무서워요" -> EMOTION: fear (신체감각 아님)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("무서워요");
  assert.strictEqual(res.mappedLayers.emotion.id, 'EMO_FEAR');
  assert.strictEqual(res.mappedLayers.bodySignal, null);
});

runTest('Test 5: "계속 확인하고 싶어요" -> URGE: check (실제 행동 아님)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("계속 확인하고 싶어요");
  assert.strictEqual(res.mappedLayers.urge.id, 'URGE_CHECK');
  assert.strictEqual(res.mappedLayers.action, null);
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('action_phone_check')));
});

runTest('Test 6: "계속 폰을 열어봤어요" -> ACTION: phone_check (충동 아님)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("계속 폰을 열어봤어요");
  assert.strictEqual(res.mappedLayers.action.id, 'ACT_PHONE_CHECK');
});

runTest('Test 7: "제가 나쁜 딸 같아요" -> STORY: bad_child (정체성 라벨 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("제가 나쁜 딸 같아요");
  assert.strictEqual(res.mappedLayers.story.id, 'STORY_BAD_CHILD');
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('bad_daughter_type')));
});

runTest('Test 8: "엄마가 부탁했어요" -> Scene/Trigger (죄책감/수락 억지추론 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("엄마가 부탁했어요");
  assert.strictEqual(res.mappedLayers.trigger.id, 'TRIG_MOTHER_REQUEST');
  assert.strictEqual(res.mappedLayers.emotion, null);
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('EMOTION: guilt')));
});

runTest('Test 9: "삼재래요" -> Context/Trigger (실제 사고 발생 비약 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("삼재래요");
  assert.strictEqual(res.mappedLayers.context.id, 'CTX_BELIEF_FATE');
  assert.strictEqual(res.mappedLayers.trigger.id, 'TRIG_FORTUNE_WARNING');
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('bad_event_occurred')));
});

runTest('Test 10: "삼재라서 아무것도 하면 안 될 것 같아요" -> warning + bad_period + freeze', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("삼재라서 아무것도 하면 안 될 것 같아요");
  assert.strictEqual(res.mappedLayers.trigger.id, 'TRIG_FORTUNE_WARNING');
  assert.strictEqual(res.mappedLayers.story.id, 'STORY_BAD_PERIOD_DANGER');
  assert.strictEqual(res.mappedLayers.urge.id, 'URGE_FREEZE');
});

runTest('Test 11: "남편이 저를 때렸어요" -> SAFETY VIOLENCE INTERCEPT FIRST', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("남편이 저를 때렸어요");
  assert.strictEqual(res.safetyIntercepted, true);
  assert.strictEqual(res.mappedLayers.safety.id, 'SAFETY_VIOLENCE');
});

runTest('Test 12: "퇴사하고 싶어요" -> URGE: quit (실제 퇴사 단정 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("퇴사하고 싶어요");
  assert.strictEqual(res.mappedLayers.urge.id, 'URGE_QUIT');
  assert.strictEqual(res.mappedLayers.action, null);
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('action_quit_job')));
});

runTest('Test 13: "오늘 퇴사했어요" -> ACTION: quit_job (충동 아님)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("오늘 퇴사했어요");
  assert.strictEqual(res.mappedLayers.action.id, 'ACT_QUIT_JOB');
});

runTest('Test 14: "나는 원래 실패자야" -> STORY: failure (영구 진단 배제, 생각의 이야기)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("나는 원래 실패자야");
  assert.strictEqual(res.mappedLayers.story.id, 'STORY_GLOBAL_FAILURE');
  assert.ok(res.unsupportedInferencesBlocked.some(b => b.includes('chronic_loser')));
});

runTest('Test 15: "실제로 계약이 취소됐어요" -> FACT: contract_cancelled (재앙화 왜곡 차단)', () => {
  const res = MyungSimOntologyGovernance.mapUserInputToOntology("실제로 계약이 취소됐어요");
  assert.strictEqual(res.mappedLayers.fact.id, 'FACT_CONTRACT_CANCELLED');
  assert.strictEqual(res.mappedLayers.story, null);
});

// 5. 거버넌스 룰 (Dry Run & Rollback) 검증
console.log('\n--- [Group 5] 거버넌스 룰 (Dry Run & Rollback) 검증 ---');
runTest('6대 질문 중 불일치가 있으면 병합 Dry Run이 반려(REJECT)되어야 함', () => {
  const dry = MyungSimOntologyGovernance.dryRunMerge(
    'TRIG_MESSAGE_NO_REPLY',
    'TRIG_MOTHER_REQUEST',
    [true, false, true, true, true, true], // 질문 2번 불일치
    null
  );
  assert.strictEqual(dry.canMerge, false);
  assert.strictEqual(dry.dryRunStatus, 'REJECTED_BY_GOVERNANCE');
});

runTest('스냅샷 생성 및 롤백이 완벽히 작동해야 함', () => {
  const initialCount = Object.keys(MyungSimOntologyGovernance.concepts).length;
  const snapId = MyungSimOntologyGovernance.createSnapshot('test-snap', '테스트 스냅샷');
  assert.ok(snapId.startsWith('SNAP_'));

  // 임의 개념 추가
  MyungSimOntologyGovernance.concepts['TEMP_TEST_CONCEPT'] = { id: 'TEMP_TEST_CONCEPT', label: '임시', layer: 1 };
  assert.strictEqual(Object.keys(MyungSimOntologyGovernance.concepts).length, initialCount + 1);

  // 롤백 실행
  const rollRes = MyungSimOntologyGovernance.rollback(snapId);
  assert.strictEqual(rollRes.success, true);
  assert.strictEqual(Object.keys(MyungSimOntologyGovernance.concepts).length, initialCount);
  assert.strictEqual(MyungSimOntologyGovernance.concepts['TEMP_TEST_CONCEPT'], undefined);
});

// 6. Zero-Key 검증
console.log('\n--- [Group 6] Zero-Key (외부 AI 호출 0건) 검증 ---');
runTest('외부 AI 호출 수는 엄격히 0건이어야 함', () => {
  assert.strictEqual(MyungSimOntologyGovernance.getExternalAiCallCount(), 0);
  assert.strictEqual(MyungSimOntologyGovernance.isZeroKeyCompliant(), true);
});

console.log('\n===============================================================');
console.log(`🎉 E2E TEST SUMMARY: PASS = ${passCount}, FAIL = ${failCount}`);
console.log('===============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
