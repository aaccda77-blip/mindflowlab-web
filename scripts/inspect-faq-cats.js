const fs = require('fs');

const content = fs.readFileSync('faq.html', 'utf8');

const regex = /<div id="body-(qa-\d+)" class="[^"]*">[\s\S]*?<h3 class="[^"]*">([\s\S]*?)<\/h3>/g;
// Let's extract items with their data-category and data-title
const itemRegex = /<div class="faq-item[^"]*"[^>]*data-category="([^"]*)"[^>]*data-title="([^"]*)"/g;

let match;
const groups = {};
while ((match = itemRegex.exec(content)) !== null) {
  const cat = match[1];
  const title = match[2];
  if (!groups[cat]) groups[cat] = [];
  groups[cat].push(title);
}

console.log('Categories and sample questions:');
for (const [k, v] of Object.entries(groups)) {
  console.log(`\n=== Category: ${k} (${v.length} items) ===`);
  v.slice(0, 3).forEach((t) => console.log('  -', t));
}
