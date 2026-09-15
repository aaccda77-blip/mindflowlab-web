/**
 * Refine FAQ Typography & Contrast for World-Class Readability
 * Updates faq.html and all 134 faq/qa-*.html files to light theme perfection
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const faqDir = path.join(rootDir, 'faq');

function transformFaqContent(html) {
  let res = html;

  // 1. Transform "사이다 한 줄 요약" Box Container
  // Match any bg-*color*-950/30 or similar dark container
  res = res.replace(
    /class=["'][^"']*bg-(?:purple|indigo|amber|cyan|emerald|rose|slate)-950\/30[^"']*["']/g,
    'class="mb-5 p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-slate-900 text-sm leading-relaxed font-medium flex items-start gap-3 shadow-xs"'
  );

  // 2. Transform "사이다 한 줄 요약:" Label
  res = res.replace(
    /<strong class=["']text-(?:amber|purple|indigo|cyan|emerald|rose|pink|red|blue|orange|teal|violet|sky)-300["']>사이다 한 줄 요약:<\/strong>/g,
    '<strong class="text-[#007A55] font-black text-sm inline-block mr-1">💡 사이다 한 줄 요약:</strong>'
  );

  // 3. Transform summary box icon (remove duplicate icon if already has bulb)
  // If the box has <span class="text-base">💡</span>, keep it neat
  res = res.replace(
    /<span class=["']text-base["']>💡<\/span>\s*<div>\s*<strong class=["']text-\[#007A55\] font-black text-sm inline-block mr-1["']>💡 사이다 한 줄 요약:<\/strong>/g,
    '<span class="text-lg shrink-0 mt-0.5">💡</span>\n              <div>\n                <strong class="text-[#007A55] font-black text-sm inline-block mr-1">사이다 한 줄 요약:</strong>'
  );

  // 4. Transform inner dark text colors inside FAQ
  res = res.replace(/\btext-(?:purple|indigo|amber|cyan|emerald|rose|pink|red|blue|orange|teal|violet)-200\b/g, 'text-slate-800');
  res = res.replace(/\btext-(?:purple|indigo|cyan|emerald|rose|pink|red|blue|orange|teal|violet)-300\b/g, 'text-[#007A55]');
  
  // Transform amber-300 (which was used for yellow emphasis in dark mode) to primary green bold
  res = res.replace(/\btext-amber-300\b/g, 'text-[#007A55]');
  res = res.replace(/\btext-amber-200\b/g, 'text-slate-800');

  // Transform slate-300 (light gray in dark mode) to readable dark slate-700
  res = res.replace(/\btext-slate-300\b/g, 'text-slate-700');
  // Transform slate-400 to slate-600
  res = res.replace(/\btext-slate-400\b/g, 'text-slate-600');

  // 5. Transform dark highlight boxes (bg-slate-950) to clean light quote cards
  res = res.replace(
    /class=["']([^"']*\b)bg-slate-950(\b[^"']*)["']/g,
    'class="$1bg-[#F8FAFC] border border-slate-200 border-l-4 border-l-[#007A55] shadow-xs$2"'
  );

  // 6. Transform like button and dividers
  res = res.replace(/border-slate-800(?:\/80)?/g, 'border-slate-100');
  res = res.replace(/bg-slate-800 hover:bg-slate-700/g, 'bg-slate-100 hover:bg-emerald-50 border border-slate-200');

  return res;
}

// 1. Process faq.html
const faqPath = path.join(rootDir, 'faq.html');
let faqHtml = fs.readFileSync(faqPath, 'utf8');
const transformedFaq = transformFaqContent(faqHtml);
fs.writeFileSync(faqPath, transformedFaq, 'utf8');
console.log('✓ Successfully transformed faq.html typography');

// 2. Process all 134 faq/qa-*.html files
const files = fs.readdirSync(faqDir).filter(f => f.startsWith('qa-') && f.endsWith('.html'));
let count = 0;
for (const f of files) {
  const filePath = path.join(faqDir, f);
  let html = fs.readFileSync(filePath, 'utf8');
  const transformed = transformFaqContent(html);
  fs.writeFileSync(filePath, transformed, 'utf8');
  count++;
}
console.log(`✓ Successfully transformed all ${count} individual FAQ pages`);
