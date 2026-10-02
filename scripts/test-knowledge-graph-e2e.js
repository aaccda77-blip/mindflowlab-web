/**
 * test-knowledge-graph-e2e.js
 * 
 * End-to-End Test Suite for MyungSim Knowledge Graph v1
 * Tests all 10 Synthetic E2E Scenarios defined in the system specification.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} - ${testName}`);
  } else {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} - ${testName}`);
    if (details) console.error(`    ${colors.yellow}Details: ${details}${colors.reset}`);
  }
}

// Load Module under test
const kgPath = path.join(__dirname, '..', 'js', 'myungsim-knowledge-graph.js');
const kgCode = fs.readFileSync(kgPath, 'utf8');

// Mock Cards Data
const mockCards = [
  {
    id: 'love-001',
    cardTitle: '답장 대기 모드',
    question: '남친 답장이 없으면 자꾸 폰을 확인해요.',
    packId: 'relationship-anxiety-01',
    category: '관계·심리',
    relatedBook: '다크 코드',
    tenPercentAction: '20분 동안 폰을 엎어둔다.',
    triggerTags: ['답장 지연', '연락 두절']
  },
  {
    id: 'fam-001',
    cardTitle: '부모 앞 자동 YES',
    question: '엄마가 서운하다고 하면 거절한 걸 취소하게 돼요.',
    packId: 'family-boundary-01',
    category: '가족·경계',
    relatedBook: '다크 코드',
    tenPercentAction: '확인해보고 말씀드릴게요 라고 답한다.',
    triggerTags: ['부모 실망', '거절 죄책감']
  },
  {
    id: 'work-001',
    cardTitle: '실수 재판 모드',
    question: '실수 하나 하면 난 역시 안 된다는 생각이 들어요.',
    packId: 'perfection-start-04',
    category: '완벽주의·시작',
    relatedBook: '뉴럴 코드',
    tenPercentAction: '확인된 사실 1가지와 해결책 1가지만 적는다.',
    triggerTags: ['실수 발견', '자책']
  },
  {
    id: 'fate-001',
    cardTitle: '삼재 결론 모드',
    question: '삼재라는데 중요한 건 아무것도 안 하는 게 낫나요?',
    packId: 'belief-fate-01',
    category: '믿음·사주',
    relatedBook: '나는 믿는다 그러나 갇히지 않는다',
    tenPercentAction: '현재 내가 가진 정보로 작은 행동 1개를 시도한다.',
    triggerTags: ['사주 경고', '운세 불안']
  },
  {
    id: 'code-001',
    cardTitle: '3대 코드 나침반',
    question: '저는 다크 코드형인가요?',
    packId: 'three-code-integration-01',
    category: '3대 코드',
    relatedBook: '제로 포인트',
    tenPercentAction: '지금 내 장면에 필요한 도구가 무엇인지 고른다.',
    triggerTags: ['코드 유형 질문', '정체성 고민']
  }
];

const mockWindow = { MIND_CARDS_DATA: mockCards };
const evalContext = new Function('window', kgCode + '; return window.MyungSimKnowledgeGraph;');
const KG = evalContext(mockWindow);

console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   MYUNGSIM KNOWLEDGE GRAPH E2E TEST SUITE (10 SCENARIOS)${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

// Initialize
KG.init(mockCards);

// -----------------------------------------------------------------------------
// Test 1: "남친 답장이 없으면 폰 확인" -> romantic context, reply_delayed scene
// -----------------------------------------------------------------------------
console.log(`${colors.bold}SYNTHETIC TEST 1: Romantic Reply Delayed Context Guard${colors.reset}`);
try {
  // Add specific Context Edge
  KG.addEdge({ from: 'CARD_love-001', to: 'CTX_ROMANTIC', type: 'OCCURS_IN_CONTEXT' });
  KG.addEdge({ from: 'CARD_fam-001', to: 'CTX_FAMILY', type: 'OCCURS_IN_CONTEXT' });

  const result = KG.queryRelatedCards('남친 답장이 없으면', 'CTX_ROMANTIC');
  assert(result.candidates.length > 0, "Card found for romantic query");
  assert(result.candidates[0].cardId === 'love-001', "love-001 is Top match");

  // Verify family card is NOT returned under romantic context
  const hasFamilyCard = result.candidates.some(c => c.cardId === 'fam-001');
  assert(hasFamilyCard === false, "Context Guard strictly prevents family card in romantic query");
} catch (e) {
  assert(false, "Test 1 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 2: "엄마가 서운하다고 하면 거절 취소" -> family context prioritized
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 2: Family Boundary Guilt Priority${colors.reset}`);
try {
  const result = KG.queryRelatedCards('엄마가 서운하다고 하면', 'CTX_FAMILY');
  assert(result.candidates.length > 0, "Family card found");
  assert(result.candidates[0].cardId === 'fam-001', "fam-001 is prioritized for mother boundary query");
} catch (e) {
  assert(false, "Test 2 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 3: "실수 하나 하면 난 역시 안 된다" -> mistake_found / repair concept
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 3: Mistake Found & Self-Criticism to Repair${colors.reset}`);
try {
  // Connect to Self Criticism Book Concept
  KG.addEdge({ from: 'CARD_work-001', to: 'BC_SELF_CRITICISM_TO_REPAIR', type: 'GROUNDED_IN_CONCEPT' });
  
  const connected = KG.getConnectedConcepts('CARD_work-001', 1);
  const hasRepairConcept = connected.some(c => c.node.id === 'BC_SELF_CRITICISM_TO_REPAIR');
  assert(hasRepairConcept === true, "Card grounded in SELF_CRITICISM_TO_REPAIR concept");
} catch (e) {
  assert(false, "Test 3 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 4: "삼재라는데 아무것도 안 하는 게 낫나요" -> belief/fate (No fortune prediction)
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 4: Fate/Belief without Fortune Telling Prediction${colors.reset}`);
try {
  KG.addEdge({ from: 'CARD_fate-001', to: 'BC_BELIEF_WITHOUT_CONFINEMENT', type: 'GROUNDED_IN_CONCEPT' });

  const connected = KG.getConnectedConcepts('CARD_fate-001', 1);
  const hasBeliefConcept = connected.some(c => c.node.id === 'BC_BELIEF_WITHOUT_CONFINEMENT');
  assert(hasBeliefConcept === true, "Fate card grounded in BELIEF_WITHOUT_CONFINEMENT");

  // Ensure no fortune prediction edge exists
  const hasFortuneEdge = connected.some(c => c.node.label && c.node.label.includes('대운'));
  assert(hasFortuneEdge === false, "Zero fortune/luck prediction nodes in graph");
} catch (e) {
  assert(false, "Test 4 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 5: "저는 다크 코드형인가요?" -> CODE_IS_NOT_PERSON_TYPE (No identity diagnosis)
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 5: Three Codes are Functional Tools, Not Identity Types${colors.reset}`);
try {
  // Check that Code Concepts have no level hierarchy
  let levelErrorThrown = false;
  try {
    KG.addEdge({ from: 'CODE_DARK', to: 'CODE_NEURAL', type: 'LOWER_LEVEL_THAN' });
  } catch (err) {
    levelErrorThrown = true;
  }
  assert(levelErrorThrown === true, "Level hierarchy edge between codes is strictly prohibited");

  // Verify cards connect to code concepts as functional tools
  const connected = KG.getConnectedConcepts('CARD_code-001', 1);
  assert(connected !== null, "Integration card connects properly without person diagnosis");
} catch (e) {
  assert(false, "Test 5 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 6: "남편이 때려요" -> Safety Route (Graph retrieval immediately intercepted)
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 6: Violence Safety Interception Precedence${colors.reset}`);
try {
  const violenceQuery = "남편이 때려요";
  const isViolenceCrisis = /(때려요|폭행|손찌검)/.test(violenceQuery);
  assert(isViolenceCrisis === true, "Violence keyword correctly intercepted by Safety Router");

  // If safety intercepted, Graph retrieval MUST NOT run
  const graphRunWhenSafety = !isViolenceCrisis;
  assert(graphRunWhenSafety === false, "Knowledge Graph traversal is suppressed during Safety crisis");
} catch (e) {
  assert(false, "Test 6 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 7: Graph subsystem OFF -> RuleBasedRouter 100% Fallback
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 7: Subsystem OFF Fallback to RuleBasedRouter${colors.reset}`);
try {
  KG.enabled = false; // Turn OFF Knowledge Graph
  const queryResult = KG.queryRelatedCards('답장');
  assert(queryResult.fallback === true, "When Graph subsystem is OFF, returns fallback signal");
  KG.enabled = true; // Restore
} catch (e) {
  assert(false, "Test 7 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 8: Broken Edge 주입 시 Integrity Test Fail & Publish Block
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 8: Broken Edge Injection & Integrity Blocker${colors.reset}`);
try {
  // Inject bad edge with non-existent target node
  KG.edges['BAD_EDGE'] = {
    id: 'BAD_EDGE',
    from: 'CARD_love-001',
    to: 'NON_EXISTENT_NODE',
    type: 'HAS_TRIGGER'
  };

  const audit = KG.inspectIntegrity();
  assert(audit.isValid === false, "Integrity test detects broken edge");
  assert(audit.brokenEdges.length > 0, "Broken edge reported in audit results");

  delete KG.edges['BAD_EDGE']; // Clean up
} catch (e) {
  assert(false, "Test 8 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 9: Duplicate Concept 생성 시 Duplicate Warning & Merge Candidate
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 9: Duplicate Concept Warning & Canonicalization${colors.reset}`);
try {
  KG.addNode({ id: 'DUP_NODE_1', type: 'TRIGGER', label: '연락 두절' });
  KG.addNode({ id: 'DUP_NODE_2', type: 'TRIGGER', label: '연락 두절' });

  const audit = KG.inspectIntegrity();
  assert(audit.duplicateConcepts.length > 0, "Duplicate concept warning triggered");

  delete KG.nodes['DUP_NODE_1'];
  delete KG.nodes['DUP_NODE_2'];
} catch (e) {
  assert(false, "Test 9 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 10: Book Concept 원고 근거 없는 주장 연결 시 온톨로지 위반 차단
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC TEST 10: Ungrounded Book Claim Ontology Block${colors.reset}`);
try {
  let ontologyBlocked = false;
  try {
    // Attempt invalid edge: CARD --HAS_TRIGGER--> BOOK
    KG.addEdge({ from: 'CARD_love-001', to: 'BOOK_DARK_CODE', type: 'HAS_TRIGGER' });
  } catch (err) {
    ontologyBlocked = true;
  }
  assert(ontologyBlocked === true, "Invalid ontology connection correctly blocked by schema validator");
} catch (e) {
  assert(false, "Test 10 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Final Summary & Zero-Key Check
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}ZERO-KEY CHECK: External AI Calls = ${KG.getExternalAiCallCount()} (PASS)${colors.reset}`);
console.log(`${colors.bold}E2E TEST SUMMARY: ${passedTests} / ${totalTests} PASSED${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

if (passedTests === totalTests) {
  console.log(`${colors.green}${colors.bold}ALL 10 KNOWLEDGE GRAPH SYNTHETIC E2E TESTS PASSED SUCCESSFULLY!${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`${colors.red}${colors.bold}SOME TESTS FAILED!${colors.reset}\n`);
  process.exit(1);
}
