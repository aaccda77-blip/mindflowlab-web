/**
 * =================================================================
 * MYUNGSIM CONTENT LANGUAGE LINTER (Node.js CLI)
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * Verifies that no forbidden identity labels, diagnostic claims,
 * fortune predictions, or brain claims appear in output content.
 * =================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DS = require(path.join(ROOT_DIR, 'js', 'myungsim-design-system.js'));

const TARGET_EXTENSIONS = ['.html', '.js'];
const IGNORE_PATHS = [
  'node_modules',
  '.git',
  'scripts',
  'reports',
  'docs',
  'admin' // 관리자 QA 툴 내의 금지어 패턴 텍스트는 린트 대상에서 제외
];

console.log('========================================================');
console.log('🔍 MYUNGSIM CONTENT LANGUAGE LINT AUDIT');
console.log('========================================================\n');

let totalFilesScanned = 0;
let totalViolations = 0;
const violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    // 검사 제외 경로 확인
    if (IGNORE_PATHS.some(ign => relPath.startsWith(ign) || relPath.includes('/' + ign + '/'))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.includes(ext)) {
        scanFile(fullPath, relPath);
      }
    }
  }
}

function scanFile(filePath, relPath) {
  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (relPath.includes('myungsim-design-system.js')) return;

    // 1) INPUT VOCABULARY 예외 처리: 라우터 사전 및 키워드 목록
    if (
      relPath.includes('myeongsim-ai-router.js') &&
      (line.includes('detected.add') || line.includes('test(') || line.includes(': [') || line.includes('/i,'))
    ) {
      return;
    }

    // 카드 데이터 내의 검색 키워드 태그 목록은 인풋 단어이므로 예외
    if (
      relPath.includes('mind-cards-data.js') &&
      (line.includes('"keyword":') || line.includes('"hookTags":') || line.includes('"synonyms":') || line.includes('keywords') || line.includes('searchKeywords'))
    ) {
      return;
    }

    // 2) OUTPUT LANGUAGE 엄격 검사
    // "당신은 ○○형", "당신은 원래", "진단했습니다", "운이 좋습니다" 등 사용자 단정/출력 문구 검출
    const strictOutputPatterns = [
      { pattern: /당신은\s+[^\s]+(?:형|타입)입니다/i, category: '정체성 낙인' },
      { pattern: /당신은\s+원래\s+[^\s]+/i, category: '정체성 낙인' },
      { pattern: /당신의\s+(?:성격|본질)은/i, category: '정체성 낙인' },
      { pattern: /분석\s*결과\s*당신은/i, category: '진단 단정' },
      { pattern: /진단했습니다/i, category: '진단 단정' },
      { pattern: /치료가\s+필요/i, category: '진단 단정' },
      { pattern: /미래가\s+보입니다/i, category: '운세 예언' },
      { pattern: /올해는\s+대운/i, category: '운세 예언' },
      { pattern: /100%\s*(?:변화|완치|해결)/i, category: '과장 약속' },
      { pattern: /뇌가\s*재배선/i, category: '신경과학 과장' },
      { pattern: /연속\s*스트릭\s*파괴/i, category: '죄책감 유발' },
      { pattern: /출석\s*실패/i, category: '죄책감 유발' }
    ];

    // 2) 설명/면책 문맥 예외 처리:
    // "이런 식의 라벨은 명심코칭이 지향하는 방향과 정반대입니다", "단정적 진단을 하지 않습니다", "의료/전문가 치료가 필요한 경우" 등
    const isEducationalOrSafetyDisclaimer = 
      line.includes('정반대') ||
      line.includes('하지 않습니다') ||
      line.includes('거부') ||
      line.includes('함정') ||
      line.includes('의료') ||
      line.includes('정신건강의학과') ||
      line.includes('전문가') ||
      line.includes('코칭으로 붙잡아두지') ||
      line.includes('생태계가 건강하게') ||
      line.includes('Dark Code로 설명하면 안 됩니다') ||
      line.includes('설명하면 안 됩니다');

    if (isEducationalOrSafetyDisclaimer) {
      return;
    }

    strictOutputPatterns.forEach(rule => {
      if (rule.pattern.test(line)) {
        totalViolations++;
        violations.push({
          file: relPath,
          line: idx + 1,
          category: rule.category,
          pattern: rule.pattern.toString(),
          snippet: trimmed.substring(0, 100)
        });
      }
    });
  });
}

// 스캔 실행
scanDirectory(ROOT_DIR);

console.log(`📊 스캔 완료: 총 ${totalFilesScanned}개 파일 검사됨`);

if (totalViolations === 0) {
  console.log('✅ 위반 사항 없음! 모든 사용자 출력 콘텐츠가 명심 언어 규약을 완벽히 준수합니다.');
  console.log('   - IDENTITY-LABEL OUTPUT: 0');
  console.log('   - DIAGNOSIS LANGUAGE: 0');
  console.log('   - FORTUNE PREDICTION: 0');
  console.log('   - BRAIN CLAIM: 0\n');
} else {
  console.warn(`⚠️ 발견된 주의 항목: ${totalViolations} 건\n`);
  violations.forEach(v => {
    console.warn(`  [${v.category}] ${v.file}:${v.line}`);
    console.warn(`    패턴: "${v.pattern}"`);
    console.warn(`    내용: ${v.snippet}\n`);
  });
}

console.log('========================================================\n');
process.exit(totalViolations > 0 ? 1 : 0);
