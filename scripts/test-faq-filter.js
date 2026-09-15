const fs = require('fs');

const content = fs.readFileSync('faq.html', 'utf8');

const categoryMapping = {
  all: null,
  nature: ['nature'],
  conflict: ['conflict', 'doubt', 'reality', 'diff'],
  relation: ['relation', 'daily', 'mind'],
  career: ['career', 'turning', 'social'],
  habit: ['habit', 'health'],
  code: ['code', 'tech', 'trust']
};

const itemRegex = /<div class="faq-item[^"]*"[^>]*data-category="([^"]*)"/g;
let match;
const allCats = [];
while ((match = itemRegex.exec(content)) !== null) {
  allCats.push(match[1]);
}

console.log('Total FAQ items found:', allCats.length);

for (const [tabKey, allowedList] of Object.entries(categoryMapping)) {
  if (tabKey === 'all') {
    console.log(`Tab [${tabKey}]: ${allCats.length} items visible`);
  } else {
    const visible = allCats.filter((c) => allowedList.includes(c)).length;
    console.log(`Tab [${tabKey}]: ${visible} items visible`);
  }
}
