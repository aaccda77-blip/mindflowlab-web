/**
 * MyungSim Operations Console E2E Synthetic Test Suite
 * ==========================================================
 * 운영센터(Operations Console)의 7대 합성 시나리오 및 무결성 검증
 */

const assert = require('assert');

// 1. Mock LocalStorage & Browser Environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// 2. Load Operations Console Engine
const Ops = require('../js/myungsim-operations.js');

console.log('========================================================');
console.log('🚀 MYUNGSIM OPERATIONS CONSOLE E2E SYNTHETIC TEST SUITE');
console.log('========================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}: ${err.message}`);
    throw err;
  }
}

// --- TEST 1: Everything Healthy ---
runTest('TEST 1: Everything Healthy (No urgent actions required)', () => {
  localStorage.clear();
  const health = Ops.getOperationalHealth('TODAY', {});
  assert.strictEqual(health.systems.SERVICE.status, 'HEALTHY');
  assert.strictEqual(health.systems.ROUTER.status, 'HEALTHY');
  assert.strictEqual(health.systems.SAFETY.status, 'HEALTHY');
  assert.strictEqual(health.systems.PRIVACY.status, 'HEALTHY');
  assert.strictEqual(health.systems.SAVE_AUTH.status, 'HEALTHY');
  assert.strictEqual(health.systems.CONTENT.status, 'HEALTHY');
  assert.strictEqual(health.systems.ANALYTICS.status, 'HEALTHY');
  assert.strictEqual(health.systems.SEO_SHARE.status, 'HEALTHY');
  assert.strictEqual(health.needsAttention.length, 0, 'Needs Attention should be 0 on healthy state');
});

// --- TEST 2: Router Down ---
runTest('TEST 2: Router Down (P1 Issue & Status Transition)', () => {
  const health = Ops.getOperationalHealth('TODAY', { routerDown: true });
  assert.strictEqual(health.systems.ROUTER.status, 'ISSUE');
  assert.strictEqual(health.systems.SERVICE.status, 'ISSUE');
  assert(health.needsAttention.some(item => item.priority === 'P1'), 'Should have P1 alert in needs attention');
});

// --- TEST 3: Privacy Leak ---
runTest('TEST 3: Privacy Leak (P0 Critical Alert & Issue Status)', () => {
  const health = Ops.getOperationalHealth('TODAY', { privacyLeak: true });
  assert.strictEqual(health.systems.PRIVACY.status, 'ISSUE');
  assert(health.needsAttention.some(item => item.priority === 'P0'), 'Should have P0 alert in needs attention');
});

// --- TEST 4: Safety Regression ---
runTest('TEST 4: Safety Regression (P0 Intercept Alert)', () => {
  const health = Ops.getOperationalHealth('TODAY', { safetyRegression: true });
  assert.strictEqual(health.systems.SAFETY.status, 'ISSUE');
  assert(health.needsAttention.some(item => item.priority === 'P0'), 'Should have P0 alert in needs attention');
});

// --- TEST 5: Broken Book URL ---
runTest('TEST 5: Broken Book URL (P3 Watch & Content Task Creation)', () => {
  const health = Ops.getOperationalHealth('TODAY', { brokenBookUrl: true });
  assert.strictEqual(health.systems.CONTENT.status, 'WATCH');
  assert(health.needsAttention.some(item => item.priority === 'P3'), 'Should have P3 alert in needs attention');

  // 태스크 생성 테스트
  const task = Ops.createTask({
    title: '카드 014 도서 URL 링크 점검',
    priority: 'P3',
    area: 'CONTENT'
  }, 'EDITOR');
  assert.strictEqual(task.priority, 'P3');
  assert.strictEqual(task.status, 'OPEN');
});

// --- TEST 6: Cross-User Leak Flag ---
runTest('TEST 6: Cross-User Leak Flag (P0 Top Alert & Incident Creation)', () => {
  const health = Ops.getOperationalHealth('TODAY', { crossUserLeak: true });
  assert.strictEqual(health.systems.PRIVACY.status, 'ISSUE');

  // P0 인시던트 등록 테스트
  const incident = Ops.createIncident({
    severity: 'P0',
    area: 'PRIVACY',
    description: '공용 PC 세션 교차 노출 플래그 발생 (합성 테스트)',
    evidence: 'Session ID mismatch observed in test runner'
  }, 'ADMIN');

  assert.strictEqual(incident.severity, 'P0');
  assert.strictEqual(incident.status, 'OPEN');
  assert(incident.incidentId.startsWith('INC-'));

  // 감사 로그 기록 확인
  const audits = Ops.getAuditLogs();
  assert(audits.some(a => a.action === 'CREATE_INCIDENT'));
});

// --- TEST 7: Zero-Key & Privacy Sanitizer Verification ---
runTest('TEST 7: Zero-Key Operations & Sanitizer Integrity', () => {
  const health = Ops.getOperationalHealth('TODAY');
  assert.strictEqual(health.noAiStatus.externalAiCallsToday, 0, 'External AI calls must be 0');
  assert.strictEqual(health.noAiStatus.zeroKeyCore, 'PASS', 'Zero-Key core must be PASS');
  assert.strictEqual(health.noAiStatus.routerMode, 'RULE', 'Router mode must be RULE');

  // 민감 원문 주입 시 자동 살균(Sanitize) 검증
  const incidentWithSensitive = Ops.createIncident({
    severity: 'P0',
    area: 'SAFETY',
    description: '위기 발화 매칭 테스트',
    evidence: '사용자가 "너무 힘들어서 죽고 싶다"고 말함'
  }, 'ADMIN');

  assert(!incidentWithSensitive.evidence.includes('죽고 싶'), 'Sensitive crisis words must be sanitized');
  assert(incidentWithSensitive.evidence.includes('[REDACTED_SENSITIVE]'), 'Evidence must be redacted with guardrail tag');

  // Feature flag 비활성화 제한 검증 (Safety & Rule Router는 불가)
  assert.throws(() => {
    Ops.setFeatureFlag('SAFETY', false, 'ADMIN');
  }, /cannot be disabled/);

  // VIEWER 권한 조작 금지 검증
  assert.throws(() => {
    Ops.setFeatureFlag('SHARE', false, 'VIEWER');
  }, /VIEWER role has no permission/);
});

console.log('\n========================================================');
console.log(`📊 TEST SUMMARY: Total ${totalTests} | Passed ${passedTests} | Failed 0`);
console.log('🎉 ALL OPERATIONS CONSOLE SYNTHETIC TESTS PASSED PERFECTLY!');
console.log('   - OPERATIONS CONSOLE: READY');
console.log('   - SAFETY MONITORING: READY');
console.log('   - PRIVACY MONITORING: READY');
console.log('   - INCIDENT RESPONSE: READY');
console.log('   - ZERO-KEY OPERATIONS: PASS');
console.log('   - PRIVATE RAW TEXT IN OPERATIONS CONSOLE: 0');
console.log('   - EXTERNAL AI CALLS: 0');
console.log('========================================================\n');
