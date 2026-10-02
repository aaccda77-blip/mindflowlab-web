/**
 * =================================================================
 * MyungSim Concept Router v3 Comprehensive E2E Test Suite
 * =================================================================
 * 1. 20대 Mandatory Golden Test 전수 검증
 * 2. Ontology Boundary 및 10대 계층 분리 검증
 * 3. Paraphrase / Synonym 정규 개념 매핑 검증
 * 4. Typo / Josa / 구어체 복원력 검증
 * 5. Ambiguous / Clarifier 처리 검증
 * 6. Safety Recall 100% (위기 차단 및 Near-miss 관용구 통과)
 * 7. Zero-Key / External API 0건 / Privacy Safe 보증
 */

const fs = require('fs');
const path = require('path');

// Global mock for Node.js environment
global.window = global;

// 1. Load Data and Modules
console.log('🔄 Loading core modules...');
require('../js/mind-cards-data.js');
const MyungSimKnowledgeGraph = require('../js/myungsim-knowledge-graph.js');
const MyungSimOntologyGovernance = require('../js/myungsim-ontology-governance.js');
const { RuleBasedRouter } = require('../js/myeongsim-ai-router.js');
const MyungSimConceptRouter = require('../js/myungsim-concept-router.js');

global.RuleBasedRouter = RuleBasedRouter;
global.MyungSimKnowledgeGraph = MyungSimKnowledgeGraph;
global.MyungSimOntologyGovernance = MyungSimOntologyGovernance;

// Initialize Knowledge Graph
MyungSimKnowledgeGraph.init(global.MIND_CARDS_DATA);

// Create Concept Router Instance
const conceptRouter = MyungSimConceptRouter.create(global.MIND_CARDS_DATA, { MODE: 'assist' });

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
  }
}

console.log('\n==================================================');
console.log('TEST SUITE 1: 20대 Mandatory Golden Set 검증');
console.log('==================================================');

const mandatoryCases = [
  { q: '읽씹당하면 계속 카톡 봐요', expectConcept: 'message_no_reply' },
  { q: '남친이 답장 안오면 가슴이 철렁해요', expectConcept: 'message_no_reply', expectContext: 'romantic' },
  { q: '엄마 부탁 거절하면 나쁜 딸 같아요', expectConcept: 'mother_request', expectContext: 'family' },
  { q: '올해 삼재라는데 사업 망할까봐 초조해요', expectConcept: 'fortune_warning_heard', expectContext: 'belief_fate' },
  { q: '팀장한테 비판 들으면 숨이 턱 막혀요', expectConcept: 'breath_shallow', expectContext: 'work' },
  { q: '확인하고 싶은 건 아닌데 자꾸 폰을 봐요', expectNegation: true, expectConcept: 'action_phone_check' },
  { q: '완벽하게 안 되면 시작하기 무서워요', expectConcept: 'fear' },
  { q: '남의 시선 때문에 밖에 나가기 싫어요', expectConcept: 'anxiety' },
  { q: '빚내서 주식에 전재산 몰빵하려고 해요', expectFinancialWarning: true },
  { q: '지금 수면제 모아서 영원히 잠들고 싶어요', expectSafety: true },
  { q: '안읽씹 당하면 관계 끝난 것 같아 겁나요', expectConcept: 'relationship_is_ending' },
  { q: '일 때문에 힘들어서 죽겠네요', expectIdiomPass: true },
  { q: '계약 취소돼서 멘탈 나갔어요', expectConcept: 'contract_cancelled' },
  { q: '폭행당하고 맞았어요 도와주세요', expectSafety: true },
  { q: '사표 내고 싶은 충동이 매일 들어요', expectConcept: 'urge_to_quit' },
  { q: '진짜 퇴사하고 사표 냈어요', expectConcept: 'action_quit_job' },
  { q: '내가 원래 실패자인 것 같아요', expectConcept: 'global_failure_story' },
  { q: '연락 끊고 그냥 숨고 싶어요', expectConcept: 'urge_to_escape' },
  { q: '친구들 모임에서 나만 초라한 것 같아요', expectContext: 'friendship' },
  { q: '배우자랑 대화가 안 통해서 답답해요', expectContext: 'romantic' }
];

mandatoryCases.forEach((c, idx) => {
  const res = conceptRouter.route(c.q);

  if (c.expectSafety) {
    assert(res.status === 'high_risk_blocked', `Mandatory #${idx + 1}: Safety crisis blocked (${c.q})`);
    return;
  }

  if (c.expectFinancialWarning) {
    const isFinWarn = res.safety && (res.safety.isFinancialHighStakes || res.safety.routeType === 'financial_high_stakes');
    assert(isFinWarn, `Mandatory #${idx + 1}: Financial high-stakes warning triggered (${c.q})`);
    return;
  }

  if (c.expectIdiomPass) {
    assert(res.status === 'success' || (res.recommendations && res.recommendations.length > 0), `Mandatory #${idx + 1}: Near-miss idiom pass-through (${c.q})`);
    return;
  }

  const detected = res.detectedConcepts || [];
  const contexts = res.detectedContexts || [];

  if (c.expectConcept) {
    assert(detected.includes(c.expectConcept), `Mandatory #${idx + 1}: Detected canonical concept (${c.expectConcept})`, `detected: ${detected.join(', ')}`);
  }

  if (c.expectContext) {
    assert(contexts.includes(c.expectContext), `Mandatory #${idx + 1}: Detected context (${c.expectContext})`, `detected: ${contexts.join(', ')}`);
  }

  assert(res.recommendations && res.recommendations.length >= 2, `Mandatory #${idx + 1}: Diversified Top 2~3 Recommendations`, `count: ${res.recommendations ? res.recommendations.length : 0}`);
});

console.log('\n==================================================');
console.log('TEST SUITE 2: Ontology Boundary & 1-Hop 탐색 검증');
console.log('==================================================');

const normRes = MyungSimConceptRouter.ConceptNormalizer.normalize('   읽씹당하고   ㅠㅠ 폰만봐요 !?? ');
assert(normRes.includes('읽씹 당하고') && normRes.includes('폰만 봐요'), 'KoreanNormalizer clean & typo fix', `norm: ${normRes}`);

const vocabMatches = MyungSimConceptRouter.SearchVocabularyMapper.matchTerms('읽씹');
assert(vocabMatches.length > 0 && vocabMatches[0].canonicalKey === 'message_no_reply', 'SearchVocabularyMapper 일상어 -> Canonical 매핑');

// 1-Hop Limit Enforced Check
const connectedConcepts = MyungSimKnowledgeGraph.getConnectedConcepts('TRIG_MESSAGE_NO_REPLY', 1);
const hasHigherHop = connectedConcepts.some(c => c.hop > 1);
assert(!hasHigherHop, 'Graph limited to strictly 1-Hop (2-Hop disallowed)');

console.log('\n==================================================');
console.log('TEST SUITE 3: Typo, Negation & Boundary Guards');
console.log('==================================================');

// Negation check
const negRes = conceptRouter.route('확인하고 싶은 건 아닌데 폰을 봐요');
assert(!negRes.detectedConcepts.includes('urge_to_check'), 'Negation guard successfully suppressed "urge_to_check"');
assert(negRes.detectedConcepts.includes('action_phone_check'), 'Negation guard retained non-negated concept');

// Context guard check
const familyRes = conceptRouter.route('엄마 부탁을 거절 못하겠어요');
assert(familyRes.detectedContexts.includes('family'), 'Context Detector correctly identifies "family"');
const recsFamily = familyRes.recommendations || [];
const hasRomanticPollution = recsFamily.some(r => (r.guardTags || []).includes('CONTEXT_MISMATCH_ROMANTIC_PENALTY'));
assert(!hasRomanticPollution || recsFamily.every(r => (r.card.contextTags || []).includes('family') || !(r.card.contextTags || []).includes('romantic_only')), 'No romantic cross-domain pollution in family query');

console.log('\n==================================================');
console.log('TEST SUITE 4: Zero-AI & Zero-Key & Privacy Compliance');
console.log('==================================================');

assert(conceptRouter.getExternalAiCallCount() === 0, 'External AI Call Count strictly ZERO (0)');
assert(conceptRouter.isZeroKeyCompliant() === true, 'Zero-Key Protocol 100% Compliant');

// Check that result object does not expose or store rawQuery persistently
const auditRes = conceptRouter.route('아무에게도 말 못한 내 비밀 사연 원문입니다');
assert(!auditRes.rawQuery, 'Privacy Safe: rawQuery is NOT exposed in result schema');

console.log('\n==================================================');
console.log('TEST SUITE 5: Operational Mode Switching & Fallback');
console.log('==================================================');

// Shadow mode check
conceptRouter.setMode('shadow');
assert(conceptRouter.getMode() === 'shadow', 'Mode switched to "shadow"');
const shadowRes = conceptRouter.route('카톡 안와서 불안해요');
assert(shadowRes.routerMode === 'shadow' && Boolean(shadowRes.shadowConceptResult), 'Shadow mode returns rule result with shadowConceptResult payload');

// Assist mode check
conceptRouter.setMode('assist');
assert(conceptRouter.getMode() === 'assist', 'Mode switched to "assist"');

// Off mode check
conceptRouter.setMode('off');
assert(conceptRouter.getMode() === 'off', 'Mode switched to "off"');
const offRes = conceptRouter.route('카톡 안와서 불안해요');
assert(offRes.recommendations && offRes.recommendations.length > 0, 'Off mode 100% falls back to RuleBasedRouter seamlessly');

// Reset to shadow (default)
conceptRouter.setMode('shadow');

console.log('\n==================================================');
console.log(`TOTAL RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('==================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CONCEPT ROUTER v3 TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}
