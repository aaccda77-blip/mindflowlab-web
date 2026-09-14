/**
 * MindflowLab SEO Build Script
 * Dynamic Canonical / OpenGraph / Sitemap / Robots generator based on Environment Variables
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const faqDir = path.join(rootDir, 'faq');

// 1. Determine Target Domain from Environment Variables
const rawUrl = process.env.SITE_URL || 'https://lab.mindflowlab.co.kr';
const SITE_URL = rawUrl.replace(/\/+$/, '');
const VERCEL_ENV = process.env.VERCEL_ENV || 'production';
const IS_STAGING = process.env.IS_STAGING === 'true' || VERCEL_ENV === 'preview' || SITE_URL.includes('vercel.app');

console.log('=== MindflowLab SEO Build ===');
console.log('Target SITE_URL:', SITE_URL);
console.log('VERCEL_ENV:', VERCEL_ENV);
console.log('Is Staging / Preview:', IS_STAGING);

// 2. Generate sitemap.xml (140 URLs)
const now = new Date().toISOString().split('T')[0];
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

const coreRoutes = [
  { path: '', priority: '1.0', freq: 'weekly' },
  { path: '/faq', priority: '0.9', freq: 'daily' },
  { path: '/self-check', priority: '0.9', freq: 'weekly' },
  { path: '/ai', priority: '0.9', freq: 'weekly' },
  { path: '/library', priority: '0.8', freq: 'monthly' },
  { path: '/trust', priority: '0.7', freq: 'monthly' },
];

for (const r of coreRoutes) {
  sitemap += '  <url>\n';
  sitemap += '    <loc>' + SITE_URL + (r.path || '/') + '</loc>\n';
  sitemap += '    <lastmod>' + now + '</lastmod>\n';
  sitemap += '    <changefreq>' + r.freq + '</changefreq>\n';
  sitemap += '    <priority>' + r.priority + '</priority>\n';
  sitemap += '  </url>\n';
}

for (let i = 1; i <= 134; i++) {
  sitemap += '  <url>\n';
  sitemap += '    <loc>' + SITE_URL + '/faq/qa-' + i + '</loc>\n';
  sitemap += '    <lastmod>' + now + '</lastmod>\n';
  sitemap += '    <changefreq>weekly</changefreq>\n';
  sitemap += '    <priority>0.8</priority>\n';
  sitemap += '  </url>\n';
}
sitemap += '</urlset>\n';
fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');
console.log('✓ sitemap.xml generated with 140 URLs based on', SITE_URL);

// 3. Generate robots.txt
let robotsContent = '';
if (IS_STAGING) {
  // Disallow all indexing on staging/preview environments
  robotsContent = '# Staging / QA Environment - Disallow indexing\nUser-agent: *\nDisallow: /\n';
} else {
  // Allow indexing on production environment
  robotsContent = '# Production Environment\nUser-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n';
}
fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsContent, 'utf8');
console.log('✓ robots.txt generated (Staging Disallow: ' + IS_STAGING + ')');

// 4. Update Core Root Pages
const rootPages = ['index.html', 'faq.html', 'self-check.html', 'ai.html', 'library.html', 'trust.html'];
for (const p of rootPages) {
  const filePath = path.join(rootDir, p);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');
  const routeName = p === 'index.html' ? '' : '/' + p.replace('.html', '');
  const canonicalUrl = SITE_URL + (routeName || '/');

  // Update canonical
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/gi, '<link rel="canonical" href="' + canonicalUrl + '" />');
  // Update og:url
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/gi, '<meta property="og:url" content="' + canonicalUrl + '" />');
  // Update og:image
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/gi, '<meta property="og:image" content="' + SITE_URL + '/assets/start48-cover.jpg" />');

  fs.writeFileSync(filePath, html, 'utf8');
}
console.log('✓ Core 6 pages canonical and OG updated to', SITE_URL);

// 5. Update 134 FAQ Pages
const faqFiles = fs.readdirSync(faqDir).filter(f => f.startsWith('qa-') && f.endsWith('.html'));
for (const f of faqFiles) {
  const filePath = path.join(faqDir, f);
  let html = fs.readFileSync(filePath, 'utf8');
  const num = f.replace('qa-', '').replace('.html', '');
  const canonicalUrl = SITE_URL + '/faq/qa-' + num;

  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/gi, '<link rel="canonical" href="' + canonicalUrl + '" />');
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/gi, '<meta property="og:url" content="' + canonicalUrl + '" />');
  html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/gi, '<meta property="og:image" content="' + SITE_URL + '/assets/start48-cover.jpg" />');

  fs.writeFileSync(filePath, html, 'utf8');
}
console.log('✓ 134 FAQ pages canonical, OG, image updated to', SITE_URL);
console.log('=== SEO Build Completed Successfully ===');
