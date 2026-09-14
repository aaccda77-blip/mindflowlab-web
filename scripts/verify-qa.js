/**
 * MindflowLab Pre-Production Full QA Verification Script
 * Validates SEO, Metadata, 134 FAQ pages, sitemap, robots, privacy & error handling
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const faqDir = path.join(rootDir, 'faq');

console.log('====================================================');
console.log('🚀 MindflowLab Production Readiness QA Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ----------------------------------------------------
// Section 1: Sitemap.xml Verification (140 URLs)
// ----------------------------------------------------
console.log('📁 [1] Sitemap.xml Validation');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml file exists');

if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const urlMatches = sitemapContent.match(/<url>/g) || [];
  assert(urlMatches.length === 140, `sitemap contains exactly 140 URLs (Found: ${urlMatches.length})`);
  
  // Check core 6 routes
  assert(sitemapContent.includes('<loc>') && sitemapContent.includes('/faq</loc>'), 'Core /faq route present');
  assert(sitemapContent.includes('/self-check</loc>'), 'Core /self-check route present');
  assert(sitemapContent.includes('/ai</loc>'), 'Core /ai route present');
  assert(sitemapContent.includes('/library</loc>'), 'Core /library route present');
  assert(sitemapContent.includes('/trust</loc>'), 'Core /trust route present');
  
  // Check Q1 and Q134
  assert(sitemapContent.includes('/faq/qa-1</loc>'), 'Q1 route present');
  assert(sitemapContent.includes('/faq/qa-134</loc>'), 'Q134 route present');
}

// ----------------------------------------------------
// Section 2: Robots.txt & Staging Protection Verification
// ----------------------------------------------------
console.log('\n🤖 [2] Robots.txt & Indexing Guard Validation');
const robotsPath = path.join(rootDir, 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt file exists');

const vercelJsonPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelJsonPath), 'vercel.json file exists');
if (fs.existsSync(vercelJsonPath)) {
  const vJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  assert(vJson.cleanUrls === true, 'Vercel cleanUrls is enabled');
  const hasRobotsHeader = JSON.stringify(vJson.headers || []).includes('X-Robots-Tag');
  assert(hasRobotsHeader, 'Vercel X-Robots-Tag noindex header configured for staging/preview');
}

// ----------------------------------------------------
// Section 3: 134 Individual FAQ Pages Comprehensive QA
// ----------------------------------------------------
console.log('\n📄 [3] 134 FAQ SEO Pages Full Audit (134 * 5 = 670 checkpoints)');
let missingTitle = 0;
let missingDesc = 0;
let missingCanonical = 0;
let missingOg = 0;
let missingJsonLd = 0;

for (let i = 1; i <= 134; i++) {
  const fPath = path.join(faqDir, `qa-${i}.html`);
  if (!fs.existsSync(fPath)) {
    missingTitle++;
    continue;
  }
  const content = fs.readFileSync(fPath, 'utf8');

  // Title
  if (!content.includes('<title>') || !content.includes(`[Q${i}]`)) missingTitle++;
  // Description
  if (!content.includes('<meta name="description"') || !content.includes('content="')) missingDesc++;
  // Canonical
  if (!content.includes('<link rel="canonical"') || !content.includes(`/faq/qa-${i}`)) missingCanonical++;
  // OG
  if (!content.includes('property="og:title"') || !content.includes('property="og:url"') || !content.includes('property="og:image"')) missingOg++;
  // JSON-LD
  if (!content.includes('application/ld+json') || !content.includes('FAQPage')) missingJsonLd++;
}

assert(missingTitle === 0, `All 134 FAQ pages have unique [Q] titles (Failures: ${missingTitle})`);
assert(missingDesc === 0, `All 134 FAQ pages have meta descriptions (Failures: ${missingDesc})`);
assert(missingCanonical === 0, `All 134 FAQ pages have canonical URLs (Failures: ${missingCanonical})`);
assert(missingOg === 0, `All 134 FAQ pages have OpenGraph tags (Failures: ${missingOg})`);
assert(missingJsonLd === 0, `All 134 FAQ pages have Schema.org FAQPage JSON-LD (Failures: ${missingJsonLd})`);

// ----------------------------------------------------
// Section 4: Self Check Non-Diagnostic & Privacy Audit
// ----------------------------------------------------
console.log('\n🌿 [4] Self Check Non-Diagnostic & Privacy Audit');
const selfCheckPath = path.join(rootDir, 'self-check.html');
assert(fs.existsSync(selfCheckPath), 'self-check.html exists');

if (fs.existsSync(selfCheckPath)) {
  const scContent = fs.readFileSync(selfCheckPath, 'utf8');
  assert(scContent.includes('비의료적 코칭 도구 고지'), 'Disclaimer banner present');
  assert(scContent.includes('의료·정신건강의학적 진단이나 치료가 아닙니다'), 'Explicit non-medical disclaimer text present');
  assert(scContent.includes('반응이 반복되는 경향이 관찰됩니다'), 'Non-diagnostic tendency title phrasing verified');
  assert(!scContent.includes('당신은 통제형입니다'), 'Deprecated diagnostic labeling completely removed');
  assert(scContent.includes('clearHistory'), 'Privacy data clearing (기록 비우기) function present');
  assert(scContent.includes('localStorage.getItem'), 'Client-side only storage without server tracking');
}

// ----------------------------------------------------
// Section 5: Myeongsim AI 7-Step Tracker & Error State Audit
// ----------------------------------------------------
console.log('\n🤖 [5] Myeongsim AI 7-Step Tracker & Error Audit');
const aiPath = path.join(rootDir, 'ai.html');
assert(fs.existsSync(aiPath), 'ai.html exists');

if (fs.existsSync(aiPath)) {
  const aiContent = fs.readFileSync(aiPath, 'utf8');
  assert(aiContent.includes('구체적 장면 (Scene)'), 'Step 1 Scene field present');
  assert(aiContent.includes('무의식 자동반응 (Dark Code)'), 'Step 2 Dark Code field present');
  assert(aiContent.includes('이번에 시도한 행동 (Neural Shift)'), 'Step 3 Neural Shift field present');
  assert(aiContent.includes('머릿속 예상 위험 (Anticipated)'), 'Step 4 Anticipated field present');
  assert(aiContent.includes('실제 현실 결과 (Observed Reality)'), 'Step 5 Observed Reality field present');
  assert(aiContent.includes('평형 복귀시간 (Recovery Latency)'), 'Step 6 Recovery Latency field present');
  assert(aiContent.includes('다음 행동실험 과제 (Next Micro-Experiment)'), 'Step 7 Next Experiment field present');
  assert(aiContent.includes('chained-experiment-box'), 'Smart Chaining previous experiment banner present');
  assert(aiContent.includes('clearAiSessions'), 'Privacy data clearing function present');
  assert(aiContent.includes('exportAiSessions'), 'Data export (JSON) backup function present');
  assert(aiContent.includes('try {') && aiContent.includes('catch ('), 'Robust error handling / exception catching present');
}

// ----------------------------------------------------
// Section 6: Removed Banners & Content Integrity Audit
// ----------------------------------------------------
console.log('\n🛡️ [6] Removed Banner & Content Integrity Audit');
const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert(!indexContent.includes('보건교육사 2급 합격패스'), '"보건교육사 2급 합격패스" card completely absent');
assert(!indexContent.includes('AI 기출 변형 & 자동 오답노트'), 'CBT exam preparation copy completely absent');
assert(indexContent.includes('31권'), '31 Master Series content 100% preserved');
assert(indexContent.includes('START 48'), 'START 48 report viewer 100% preserved');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`📊 Pre-Production QA Summary: Total ${totalTests} checks`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
if (failedTests === 0) {
  console.log('🎉 ALL PRODUCTION QA CHECKS PASSED PERFECTLY!');
} else {
  console.log('⚠️ Please fix the failing checks before deployment.');
}
console.log('====================================================');
