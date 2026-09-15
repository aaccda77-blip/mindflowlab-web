const fs = require('fs');

const content = fs.readFileSync('faq.html', 'utf8');
const regex = /class=["'][^"']*faq-item[^"']*["'][^>]*data-category=["']([^"']*)["']/g;
let match;
const cats = {};
while ((match = regex.exec(content)) !== null) {
  cats[match[1]] = (cats[match[1]] || 0) + 1;
}
console.log('Categories found in faq.html with class before data-category:', cats);

// Also search for data-category anywhere on faq-item
const regex2 = /data-category=["']([^"']*)["']/g;
const cats2 = {};
while ((match = regex2.exec(content)) !== null) {
  cats2[match[1]] = (cats2[match[1]] || 0) + 1;
}
console.log('All data-category attributes found in faq.html:', cats2);
