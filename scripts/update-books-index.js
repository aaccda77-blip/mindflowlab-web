const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Featured Book section markup for index.html
const featuredBookMarkup = `
      <!-- [FEATURED BOOK] 현재 공식 출간 도서: 《나는 믿는다, 그러나 갇히지 않는다》 -->
      <div class="mb-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-950 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 relative z-10">
          <!-- 책 입체 표지 이미지 -->
          <div class="w-full lg:w-5/12 flex flex-col items-center shrink-0">
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <img 
                src="/assets/book-cover-freedom.jpg" 
                alt="나는 믿는다, 그러나 갇히지 않는다 - 이경윤 지음, 청류" 
                class="relative w-64 sm:w-72 md:w-80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 transform group-hover:scale-[1.02] transition duration-300"
              />
            </div>
            <div class="mt-4 flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                <span>✓ 공식 출간 도서</span>
              </span>
              <span class="text-xs text-slate-400">도서출판 청류 · 정식 출간작</span>
            </div>
          </div>

          <!-- 책 상세 소개 및 핵심 메시지 -->
          <div class="w-full lg:w-7/12 space-y-5 text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span>👑 AUTHOR'S PUBLISHED WORK · 공식 출간 단행본</span>
            </div>

            <div>
              <h3 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                나는 믿는다,<br class="hidden sm:inline" />
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">그러나 갇히지 않는다</span>
              </h3>
              <p class="text-sm sm:text-base text-emerald-200 font-semibold mt-2">
                다른 믿음과 함께 살아가는 자유인의 사용 설명서
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1 pb-2 border-y border-slate-800">
              <span><strong>저자:</strong> 이경윤 (마인드플로우랩 대표)</span>
              <span class="text-slate-600">|</span>
              <span><strong>출판사:</strong> 도서출판 청류</span>
              <span class="text-slate-600">|</span>
              <span><strong>분야:</strong> 인문 / 심리 / 영성</span>
            </div>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              “신앙, 정치, 철학 등 인간이 가진 저마다의 믿음은 왜 사랑 대신 공격과 갈등을 낳는가?”<br />
              믿음 자체가 문제가 아니라, 믿음과 결합한 무의식적 자동반응(Dark Code)이 갈등의 뿌리임을 인지과학과 영적 전통의 융합으로 분석합니다. 자신의 신념을 굳건히 지키면서도 타인을 있는 그대로 존중하며 살아가는 <strong>‘성숙한 자유인의 길’</strong>을 제시합니다.
            </p>

            <!-- 3대 핵심 포인트 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <strong class="block text-emerald-400 text-xs font-bold mb-1">01. 도그마의 해체</strong>
                <p class="text-[11px] text-slate-400 leading-normal">신념이 방어기제와 결합해 상대를 배척하는 심리 메커니즘 규명</p>
              </div>
              <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <strong class="block text-teal-400 text-xs font-bold mb-1">02. 자동반응 자각</strong>
                <p class="text-[11px] text-slate-400 leading-normal">믿음 뒤에 숨겨진 불안과 인정욕구를 메타인지로 객관화</p>
              </div>
              <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <strong class="block text-amber-400 text-xs font-bold mb-1">03. 자유인의 공존</strong>
                <p class="text-[11px] text-slate-400 leading-normal">내 믿음을 소중히 지키며 다른 신념과 평화롭게 연대하는 법</p>
              </div>
            </div>

            <div class="pt-3 flex flex-wrap items-center gap-3">
              <span class="px-4 py-2.5 rounded-xl bg-emerald-600/90 text-white font-bold text-xs shadow-lg flex items-center gap-2">
                <span>📚 전국 온·오프라인 서점 절찬 판매 중</span>
              </span>
              <span class="text-xs text-slate-400">교보문고 · YES24 · 알라딘 등</span>
            </div>
          </div>
        </div>
      </div>
`;

if (!html.includes('나는 믿는다, 그러나 갇히지 않는다')) {
  html = html.replace('<!-- 피그마 4대 라이브러리 카드 그리드 -->', featuredBookMarkup + '\n      <!-- 피그마 4대 라이브러리 카드 그리드 -->');
}

// 2. Update status badges in index.html for 31 books to "출간예정"
html = html.replace('출시 완료 (발간)', '출간예정 (Master Plan)');
html = html.replace('출간 준비', '출간예정');
html = html.replace('Official Publishing Plan • 31권 마스터 출판 기획', 'Official Publishing Plan • 31권 마스터 출판 기획 (전권 순차 출간예정)');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ Updated index.html with featured published book and "출간예정" badges');
