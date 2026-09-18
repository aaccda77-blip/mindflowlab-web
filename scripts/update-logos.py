import os
import glob
import re

css_old = '''.brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007A55 0%, #10B981 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 122, 85, 0.3);
    }'''

css_new = '''.brand-mark {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 122, 85, 0.25);
      border: 1px solid rgba(16, 185, 129, 0.35);
      background: #090d16;
      flex-shrink: 0;
      position: relative;
    }
    .brand-mark img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }'''

header_span_regex = re.compile(
    r'<span class="brand-mark w-8 h-8 rounded-xl bg-gradient-to-br from-\[#007A55\] to-\[#10B981\] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0" aria-hidden="true">\s*<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">\s*<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3\.707-9\.293a1 1 0 00-1\.414-1\.414L9 10\.586 7\.707 9\.293a1 1 0 00-1\.414 1\.414l2 2a1 1 0 001\.414 0l4-4z" clip-rule="evenodd"/>\s*</svg>\s*</span>'
)

header_new = '''<span class="brand-mark w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-emerald-500/30 bg-slate-950" title="마인드플로우랩 사주 상징 로고: 수생목(水生木) 성장과 마음 케어의 보석(辛金)" aria-label="마인드플로우랩 로고">
          <img src="/assets/mindflow-saju-symbol.png" alt="마인드플로우랩 로고" class="w-full h-full object-cover" />
        </span>'''

footer_span_regex = re.compile(
    r'<span class="brand-mark w-7 h-7 rounded-lg bg-gradient-to-br from-\[#007A55\] to-\[#10B981\] flex items-center justify-center shrink-0" aria-hidden="true">\s*<svg class="w-3\.5 h-3\.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3\.707-9\.293a1 1 0 00-1\.414-1\.414L9 10\.586 7\.707 9\.293a1 1 0 00-1\.414 1\.414l2 2a1 1 0 001\.414 0l4-4z" clip-rule="evenodd"/></svg>\s*</span>'
)

footer_new = '''<span class="brand-mark w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-emerald-500/30 bg-slate-950" aria-hidden="true">
              <img src="/assets/mindflow-saju-symbol.png" alt="마인드플로우랩 로고" class="w-full h-full object-cover" />
            </span>'''

faq_files = glob.glob('faq/qa-*.html')
count = 0
for fpath in faq_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False
    if css_old in content:
        content = content.replace(css_old, css_new)
        modified = True

    if header_span_regex.search(content):
        content = header_span_regex.sub(header_new, content)
        modified = True

    if footer_span_regex.search(content):
        content = footer_span_regex.sub(footer_new, content)
        modified = True

    if '<link rel="icon"' not in content:
        content = content.replace(
            '<meta name="viewport"',
            '<link rel="icon" type="image/png" href="/favicon.png" />\n  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n  <meta name="viewport"',
        )
        modified = True

    if modified:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1

print(f'Updated {count} / {len(faq_files)} faq files.')
