const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const faqDir = path.join(rootDir, 'faq');

// 1. Update faq.html
const faqPath = path.join(rootDir, 'faq.html');
if (fs.existsSync(faqPath)) {
  let content = fs.readFileSync(faqPath, 'utf8');
  content = content.replace(
    /function trackEvent\(name, params = \{\}\) \{[\s\S]*?console\.log\('\[Analytics Event\]', name, params\);\s*\}/g,
    'function trackEvent(name, params = {}) {\n      // Privacy Protection: No external analytics tracker, zero psychological data transmission\n      console.debug("[Local UI Action]", name);\n    }'
  );
  fs.writeFileSync(faqPath, content, 'utf8');
}

// 2. Update qa-*.html
const files = fs.readdirSync(faqDir).filter(f => f.startsWith('qa-') && f.endsWith('.html'));
let count = 0;
for (const f of files) {
  const p = path.join(faqDir, f);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('window.gtag')) {
    content = content.replace(
      /function trackEvent\(name, params = \{\}\) \{[\s\S]*?console\.log\('\[Analytics Event\]', name, params\);\s*\}/g,
      'function trackEvent(name, params = {}) {\n      // Privacy Protection: No external analytics tracker, zero psychological data transmission\n      console.debug("[Local UI Action]", name);\n    }'
    );
    fs.writeFileSync(p, content, 'utf8');
    count++;
  }
}
console.log('Cleaned gtag references in faq.html and', count, 'FAQ pages');
