/**
 * test-launch-command-e2e.js
 * 
 * End-to-End Test Suite for MyungSim Public Launch 30-Day Command Plan
 * Tests all 9 major domains including Baseline Lock, Time-travel Focus,
 * Do Not Change Today, Small-Sample Guard, Safety & Privacy, and Zero-Key Enforcement.
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
const launchCommandPath = path.join(__dirname, '..', 'js', 'myungsim-launch-command.js');
const launchCommandCode = fs.readFileSync(launchCommandPath, 'utf8');

// Mock browser environment for node execution
const mockWindow = {};
const evalContext = new Function('window', launchCommandCode + '; return window.MyungSimLaunchCommand;');
const LaunchCmd = evalContext(mockWindow);

console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   MYUNGSIM PUBLIC LAUNCH 30-DAY COMMAND E2E TEST SUITE${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

// -----------------------------------------------------------------------------
// Test 1: Launch Baseline Lock
// -----------------------------------------------------------------------------
console.log(`${colors.bold}Test 1: Launch Baseline Lock Verification${colors.reset}`);
try {
  LaunchCmd.init();
  const baseline = LaunchCmd.getBaseline();
  assert(baseline !== null && typeof baseline === 'object', "Baseline exists and initialized");
  assert(baseline.totalCards === 200, "Total cards locked at 200");
  assert(baseline.totalPacks === 10, "Total packs locked at 10");
  assert(baseline.freezeStatus === 'LOCKED', "Production Freeze is strictly LOCKED");
  assert(baseline.externalAiCalls === 0, "Baseline external AI calls is strictly 0");
} catch (e) {
  assert(false, "Test 1 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 2: Time-travel Focus Switch
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 2: Time-travel Focus Switch Across Milestones${colors.reset}`);
try {
  const milestones = ['LAUNCH_DAY', 'DAYS_2_3', 'WEEK_1', 'WEEK_2', 'WEEK_3', 'DAY_30'];
  let allValid = true;

  milestones.forEach(mKey => {
    const config = LaunchCmd.getMilestoneConfig(mKey);
    if (!config || !config.focusTitle || !config.checklist || config.checklist.length === 0) {
      allValid = false;
    }
  });

  assert(allValid, "All 6 milestones have complete focus titles and checklists");

  const d0 = LaunchCmd.getMilestoneConfig('LAUNCH_DAY');
  assert(d0.checklist.some(item => item.includes('Safety') || item.includes('가용성') || item.includes('크래시')), 
    "LAUNCH_DAY correctly focuses on Availability, Crash, and Safety");

  const d30 = LaunchCmd.getMilestoneConfig('DAY_30');
  assert(d30.checklist.some(item => item.includes('회고') || item.includes('스프린트') || item.includes('의사결정')),
    "DAY_30 correctly focuses on Retrospective and Decision Support");
} catch (e) {
  assert(false, "Test 2 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 3: Do Not Change Today Enforcement
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 3: Do Not Change Today Rule Enforcement${colors.reset}`);
try {
  const d0 = LaunchCmd.getMilestoneConfig('LAUNCH_DAY');
  assert(d0.freezeList && d0.freezeList.length >= 3, "Day 0 has at least 3 strict freeze items");
  assert(d0.freezeList.some(item => item.includes('카드') && item.includes('금지')), "Day 0 forbids card text modifications");
  assert(d0.freezeList.some(item => item.includes('라우터') && item.includes('금지')), "Day 0 forbids router weight modifications");

  const w1 = LaunchCmd.getMilestoneConfig('WEEK_1');
  assert(w1.freezeList.some(item => item.includes('심리검사') || item.includes('태그')), "Week 1 forbids psychological test additions");
} catch (e) {
  assert(false, "Test 3 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 4: Small-Sample Guard Protection
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 4: Small-Sample Guard (No Defect Conclusion for N < 30)${colors.reset}`);
try {
  const sampleLow = 14;
  const sampleHigh = 45;

  const verdictLow = LaunchCmd.evaluateSampleStatus(sampleLow);
  const verdictHigh = LaunchCmd.evaluateSampleStatus(sampleHigh);

  assert(verdictLow.status === 'INSUFFICIENT_EVIDENCE', "N=14 is classified as INSUFFICIENT_EVIDENCE");
  assert(verdictLow.canConcludeDefect === false, "N=14 prevents concluding product defect");
  assert(verdictHigh.status === 'SUFFICIENT_FOR_OBSERVATION', "N=45 is qualified for trend observation");
} catch (e) {
  assert(false, "Test 4 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 5: Safety Incident Protocol Handling
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 5: Safety Incident Detection & P0 Protocol${colors.reset}`);
try {
  const testInputSafe = "오늘 업무 마감이 다가와서 약간 긴장됩니다.";
  const testInputCrisis = "모든 것을 끝내고 사라지고 싶다 자해하고 싶어요.";

  const checkSafe = LaunchCmd.checkSafetyText(testInputSafe);
  const checkCrisis = LaunchCmd.checkSafetyText(testInputCrisis);

  assert(checkSafe.isCrisis === false, "Safe text does not trigger crisis");
  assert(checkCrisis.isCrisis === true, "Crisis text triggers crisis alert (100% catch)");
  assert(checkCrisis.helpline !== null && checkCrisis.helpline.length > 0, "Crisis alert provides verified non-medical helplines");
  assert(checkCrisis.incidentLevel === 'P0', "Crisis incident is classified as P0 emergency");
} catch (e) {
  assert(false, "Test 5 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 6: Strict Zero-PII & Privacy Leakage Check
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 6: Strict Zero-PII & Zero Network Leakage${colors.reset}`);
try {
  const piiInput = "제 이름은 홍길동이고 전화번호는 010-1234-5678, 이메일은 test@example.com 입니다.";
  const sanitized = LaunchCmd.sanitizeTelemetryData({
    notes: piiInput,
    cardId: 'C-001',
    timestamp: Date.now()
  });

  assert(!sanitized.notes.includes('010-1234-5678'), "Phone numbers are stripped from telemetry");
  assert(!sanitized.notes.includes('test@example.com'), "Emails are stripped from telemetry");
  assert(sanitized.isPiiFree === true, "Telemetry payload flagged as strictly PII-Free");
} catch (e) {
  assert(false, "Test 6 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 7: Watch List Registration & Content Gap Isolation
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 7: Watch List Management & Content Gap vs Routing Failure${colors.reset}`);
try {
  const initialWatchlist = LaunchCmd.getWatchlist();
  assert(Array.isArray(initialWatchlist) && initialWatchlist.length >= 3, "Default watchlist has active items");

  const classificationA = LaunchCmd.classifySearchFailure("인지왜곡", false);
  const classificationB = LaunchCmd.classifySearchFailure("직장 상사 가스라이팅", false);

  assert(classificationA.category === 'ROUTING_DEFECT', "Known domain search failure classified as ROUTING_DEFECT");
  assert(classificationB.category === 'POTENTIAL_CONTENT_GAP', "Unknown out-of-pack keyword classified as CONTENT_GAP");
} catch (e) {
  assert(false, "Test 7 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 8: Day 30 Human Decision Packet Generation
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 8: Day 30 Human Decision Packet (A/B/C Options & Structure)${colors.reset}`);
try {
  const packet = LaunchCmd.generateDecisionPacket();
  assert(packet.options && packet.options.length === 3, "Decision packet contains exactly 3 sprint options");

  const optionA = packet.options.find(o => o.id === 'SPRINT_A');
  const optionB = packet.options.find(o => o.id === 'SPRINT_B');
  const optionC = packet.options.find(o => o.id === 'SPRINT_C');

  assert(optionA && optionA.name.includes('Core Optimization'), "Option A is Core Optimization");
  assert(optionB && optionB.name.includes('Content Expansion'), "Option B is Content Expansion");
  assert(optionC && optionC.name.includes('App Deepening'), "Option C is App Deepening");

  // Format Check: FACT, INTERPRETATION, NEXT QUESTION
  assert(optionA.fact && optionA.interpretation && optionA.nextQuestion, "Option A has FACT / INTERPRETATION / NEXT QUESTION");
  assert(optionB.fact && optionB.interpretation && optionB.nextQuestion, "Option B has FACT / INTERPRETATION / NEXT QUESTION");
  assert(optionC.fact && optionC.interpretation && optionC.nextQuestion, "Option C has FACT / INTERPRETATION / NEXT QUESTION");

  // Markdown Generator test
  const mdText = LaunchCmd.generateDecisionPacketText();
  assert(mdText.includes("Sprint Option A") && mdText.includes("FACT"), "Decision packet markdown generated properly");
} catch (e) {
  assert(false, "Test 8 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Test 9: Zero-Key Launch & External AI Calls Compliance
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}Test 9: Zero-Key Launch & External AI Calls Compliance${colors.reset}`);
try {
  const calls = LaunchCmd.getExternalAiCallCount();
  assert(calls === 0, "External AI call count is strictly 0");

  const isZeroKey = LaunchCmd.isZeroKeyCompliant();
  assert(isZeroKey === true, "System is certified 100% Zero-Key Launch Compliant");
} catch (e) {
  assert(false, "Test 9 threw error", e.message);
}

// -----------------------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}E2E TEST SUMMARY: ${passedTests} / ${totalTests} PASSED${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

if (passedTests === totalTests) {
  console.log(`${colors.green}${colors.bold}ALL 9 LAUNCH COMMAND E2E TESTS PASSED SUCCESSFULLY!${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`${colors.red}${colors.bold}SOME TESTS FAILED!${colors.reset}\n`);
  process.exit(1);
}
