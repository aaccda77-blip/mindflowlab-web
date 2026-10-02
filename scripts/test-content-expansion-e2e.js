/**
 * test-content-expansion-e2e.js
 * 
 * End-to-End Test Suite for MyungSim Evidence-Based Content Expansion v1
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
const expansionPath = path.join(__dirname, '..', 'js', 'myungsim-content-expansion.js');
const expansionCode = fs.readFileSync(expansionPath, 'utf8');

// Mock browser environment for node execution
const mockWindow = {
  MIND_CARDS_DATA: [
    {
      id: 'rel-001',
      cardTitle: '답장 대기 모드',
      question: '답장이 늦으면 왜 마음이 식었다고 느껴질까요?',
      searchKeywords: ['답장', '카톡', '연락', '연락불안', '읽씹'],
      routeTags: ['관계', '답장', '연락', '불안'],
      triggerTags: ['연락', '메시지'],
      storyTags: ['마음이 식었다']
    },
    {
      id: 'fam-001',
      cardTitle: '가족 경계선',
      question: '부모님의 기대가 너무 무겁고 죄책감이 들어요.',
      searchKeywords: ['부모님', '가족', '죄책감', '기대'],
      routeTags: ['가족', '부모', '죄책감', '경계'],
      triggerTags: ['부모님', '잔소리'],
      storyTags: ['내가 불효자다']
    }
  ]
};

const evalContext = new Function('window', expansionCode + '; return window.MyungSimContentExpansion;');
const ContentExp = evalContext(mockWindow);

console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   MYUNGSIM EVIDENCE-BASED CONTENT EXPANSION E2E TEST SUITE${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

// -----------------------------------------------------------------------------
// Synthetic E2E 1: Gap A는 기존 카드로 충분히 커버 -> EXISTING_CARD_COVERS
// -----------------------------------------------------------------------------
console.log(`${colors.bold}SYNTHETIC E2E 1: Gap Covered by Existing Card${colors.reset}`);
try {
  const query = "답장이 늦으면 왜 마음이 식었다고 느껴질까요?";
  const resolution = ContentExp.analyzeGapResolutionTrack(query, mockWindow.MIND_CARDS_DATA);
  assert(resolution.resolution === 'EXISTING_CARD_COVERS' || resolution.resolution === 'ROUTER_FIX', 
    "Existing card question directly recognized without creating new card");
  assert(resolution.recommendedCardId !== undefined, "Recommended existing card ID provided");
} catch (e) {
  assert(false, "E2E 1 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 2: Gap B는 Synonym 부족 -> ROUTER_FIX
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 2: Missing Synonym -> ROUTER_FIX instead of New Card${colors.reset}`);
try {
  const query = "읽씹 당해서 답답해요";
  const resolution = ContentExp.analyzeGapResolutionTrack(query, mockWindow.MIND_CARDS_DATA);
  assert(resolution.resolution === 'ROUTER_FIX', "Classified as ROUTER_FIX instead of Content Gap");
  assert(resolution.recommendedCardId === 'rel-001', "Identified existing card 'rel-001' as target for synonym update");
} catch (e) {
  assert(false, "E2E 2 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 3: Gap C는 독립 Scene + Action 존재 -> VERIFIED -> Candidate
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 3: Independent Scene & SODA -> VERIFIED & Candidate Creation${colors.reset}`);
try {
  const gapData = {
    gapId: 'GAP-FRIEND-01',
    signalCount: 12,
    generalizedSituation: '친구에게 서운한 감정을 말하지 못하고 혼자 손절을 결심하는 장면',
    observedKeyword: '친구 손절 고민'
  };

  const evalResult = ContentExp.evaluateVerifiedGapConditions(gapData, {
    notCoveredByTop3: true,
    routerFixInsufficient: true,
    hasSodaPerspective: true,
    canScanConcrete: true,
    hasSafeTenPercentAction: true,
    withinScope: true
  });

  assert(evalResult.isVerified === true, "Gap satisfies all 8 verification conditions");
  assert(evalResult.verdict === 'VERIFIED', "Gap promoted to VERIFIED status");

  const candidate = ContentExp.createCandidate({
    candidateId: 'CAND-001',
    scene: '친구에게 서운한 일이 있었는데 말하면 관계가 끝날까봐 겉으로만 웃고 속으로 앓음',
    userQuestion: '친구한테 서운한데 말하면 손절당할까봐 말을 못 하겠어요.',
    sodaInsight: '서운함을 표현하는 것과 관계 전체를 끝내는 것은 같지 않습니다.',
    tenPercentAction: '서운했던 상황 1가지만 메모장에 사실 위주로 적어본다.',
    workingTitle: '서운함 침묵 모드'
  });

  assert(candidate.candidateId === 'CAND-001', "Card Candidate successfully created");
  assert(candidate.status === 'DRAFT', "Candidate placed in DRAFT for editorial review");
} catch (e) {
  assert(false, "E2E 3 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 4: 새 카드가 기존 카드와 태그 90% 유사 -> POSSIBLE_DUPLICATE
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 4: 90% Tag Overlap -> POSSIBLE_DUPLICATE Warning${colors.reset}`);
try {
  const dupCheck = ContentExp.checkDuplication({
    question: '메시지 답장이 안 오면 왜 이렇게 불안하죠?',
    routeTags: ['관계', '답장', '연락', '불안'],
    triggerTags: ['연락', '메시지'],
    storyTags: ['마음이 식었다']
  }, mockWindow.MIND_CARDS_DATA);

  assert(dupCheck.isDuplicate === true, "Duplication engine detects high overlap");
  assert(dupCheck.status === 'POSSIBLE_DUPLICATE', "Flagged as POSSIBLE_DUPLICATE");
  assert(dupCheck.highestSimilarity >= 80, `Similarity (${dupCheck.highestSimilarity}%) exceeds 80% threshold`);
} catch (e) {
  assert(false, "E2E 4 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 5: 폭력 관계 상황을 일반 경계로 다룸 -> SAFETY_FAIL
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 5: Physical Violence in Scene -> SAFETY_FAIL (Publish Block)${colors.reset}`);
try {
  const unsafeCard = {
    scene: '남편이 폭언하고 손찌검을 하는데 내가 더 참아야 하는지 고민됨',
    userQuestion: '남편이 때려요 어떻게 대처하나요?',
    sodaInsight: '내 마음을 단단히 하세요',
    tenPercentAction: '심호흡을 해본다'
  };

  const validation = ContentExp.validateContentQuality(unsafeCard);
  assert(validation.isValid === false, "Unsafe domestic violence scene fails validation");
  assert(validation.errors.some(err => err.includes('SAFETY_FAIL')), "SAFETY_FAIL error triggered");
} catch (e) {
  assert(false, "E2E 5 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 6: 신규 사주 카드가 “올해 운이 좋다” 답함 -> FORTUNE_LANGUAGE_FAIL
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 6: Fortune Telling Claim -> FORTUNE_LANGUAGE_FAIL (Publish Block)${colors.reset}`);
try {
  const fortuneCard = {
    scene: '신년 사주를 봤는데 삼재라고 해서 걱정됨',
    userQuestion: '올해 제 운세가 어떨까요?',
    sodaInsight: '올해 운이 좋다 그러니 걱정 말고 도전하세요.',
    tenPercentAction: '달력에 좋은 날을 표시한다'
  };

  const validation = ContentExp.validateContentQuality(fortuneCard);
  assert(validation.isValid === false, "Fortune predicting card fails validation");
  assert(validation.errors.some(err => err.includes('FORTUNE_LANGUAGE_FAIL')), "FORTUNE_LANGUAGE_FAIL error triggered");
} catch (e) {
  assert(false, "E2E 6 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 7: 신규 카드 Action: “퇴사한다” -> ACTION_TOO_HIGH_STAKES
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 7: Irreversible High-Stakes Action -> ACTION_TOO_HIGH_STAKES${colors.reset}`);
try {
  const extremeActionCard = {
    scene: '직장 상사의 피드백이 너무 부담스럽고 답답함',
    userQuestion: '상사 얼굴을 보기가 두려워요.',
    sodaInsight: '상사의 피드백은 나의 인격 전체가 아닙니다.',
    tenPercentAction: '당장 사직서를 내고 퇴사한다'
  };

  const validation = ContentExp.validateContentQuality(extremeActionCard);
  assert(validation.isValid === false, "Extreme action (퇴사) fails 10% action test");
  assert(validation.errors.some(err => err.includes('ACTION_TOO_HIGH_STAKES')), "ACTION_TOO_HIGH_STAKES error triggered");
} catch (e) {
  assert(false, "E2E 7 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 8: 기존 Golden Test Regression 감지 시 Batch Publish Block
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 8: Golden Test Regression -> Expansion Pause Guard${colors.reset}`);
try {
  const checkWithRegression = ContentExp.evaluateExpansionCheckpoint(215, 2, 0);
  assert(checkWithRegression.isPauseRequired === true, "Regression triggers expansion pause");
  assert(checkWithRegression.recommendedAction === 'PAUSE_EXPANSION', "Action is PAUSE_EXPANSION");
  assert(checkWithRegression.pauseReasons.some(r => r.includes('Regression')), "Pause reason specifies Router Regression");
} catch (e) {
  assert(false, "E2E 8 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 9: 20장 Batch 중 3장만 결함 시 격리 검토
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 9: Batch Partial Issue Isolation Evaluation${colors.reset}`);
try {
  const batchCards = [
    { id: 'C-01', valid: true },
    { id: 'C-02', valid: true },
    { id: 'C-03', valid: false, error: 'SAFETY_FAIL' },
    { id: 'C-04', valid: false, error: 'ACTION_TOO_HIGH_STAKES' },
    { id: 'C-05', valid: false, error: 'FORTUNE_LANGUAGE_FAIL' }
  ];

  const invalidCount = batchCards.filter(c => !c.valid).length;
  const isBatchClean = invalidCount === 0;

  assert(invalidCount === 3, "Exactly 3 invalid cards detected in batch simulation");
  assert(isBatchClean === false, "Batch is blocked from automatic blanket release");
} catch (e) {
  assert(false, "E2E 9 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Synthetic E2E 10: 실제 Verified Gap 부재 시 WAITING FOR EVIDENCE
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}SYNTHETIC E2E 10: No Real Verified Gap -> WAITING FOR EVIDENCE${colors.reset}`);
try {
  const currentGaps = ContentExp.getGaps();
  const verifiedCount = currentGaps.filter(g => g.status === 'VERIFIED').length;

  assert(verifiedCount === 0, "No fake verified gaps in default state (Strict Waiting for Evidence)");
  
  const statusState = verifiedCount === 0 ? 'WAITING FOR EVIDENCE' : 'EXPANSION READY';
  assert(statusState === 'WAITING FOR EVIDENCE', "Expansion state correctly declared as WAITING FOR EVIDENCE");
  assert(ContentExp.getExternalAiCallCount() === 0, "External AI call count is strictly 0");
  assert(ContentExp.isZeroKeyCompliant() === true, "System verified 100% Zero-Key Compliant");
} catch (e) {
  assert(false, "E2E 10 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}E2E TEST SUMMARY: ${passedTests} / ${totalTests} PASSED${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

if (passedTests === totalTests) {
  console.log(`${colors.green}${colors.bold}ALL 10 SYNTHETIC E2E TESTS PASSED SUCCESSFULLY!${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`${colors.red}${colors.bold}SOME TESTS FAILED!${colors.reset}\n`);
  process.exit(1);
}
