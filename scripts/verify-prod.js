const https = require('https');

const tests = [
  'https://lab.mindflowlab.co.kr/',
  'https://lab.mindflowlab.co.kr/robots.txt',
  'https://lab.mindflowlab.co.kr/sitemap.xml',
  'https://lab.mindflowlab.co.kr/faq',
  'https://lab.mindflowlab.co.kr/self-check',
  'https://lab.mindflowlab.co.kr/ai',
  'https://lab.mindflowlab.co.kr/library',
  'https://lab.mindflowlab.co.kr/trust',
  'https://lab.mindflowlab.co.kr/faq/qa-1',
  'https://lab.mindflowlab.co.kr/non-existent-page-test-404'
];

async function check() {
  console.log('=== Verifying Live Production Deployment ===\n');
  for (const url of tests) {
    await new Promise((resolve) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`[${res.statusCode}] ${url}`);
          if (url.endsWith('robots.txt')) {
            console.log('   robots.txt preview:\n' + data.trim().split('\n').map((l) => '     ' + l).join('\n'));
          }
          if (url.endsWith('/')) {
            console.log('   X-Robots-Tag header:', res.headers['x-robots-tag'] || '(None - Indexing Allowed!)');
            console.log('   Includes Saju Wisdom:', data.includes('고대 지혜'));
            console.log('   Includes Symbiosis Engine:', data.includes('UNIVERSAL SYMBIOTIC ENGINE'));
            console.log('   Includes Manifesto:', data.includes('3-Code × 3S Protocol 선언문'));
          }
          if (url.includes('404')) {
            console.log('   Branded 404 Page Served:', data.includes('404 Not Found'));
          }
          resolve();
        });
      }).on('error', (err) => {
        console.error(`[ERROR] ${url}:`, err.message);
        resolve();
      });
    });
  }
  console.log('\n=== Production Verification Finished ===');
}

check();
