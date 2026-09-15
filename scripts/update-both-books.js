const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const libPath = path.join(rootDir, 'library.html');

const dualBooksMarkup = `
      <!-- [FEATURED BOOKS] 현재 정식 출간 도서 2종 컬렉션 -->
      <div class="mb-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-950 border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Section Header -->
        <div class="text-center max-w-2xl mx-auto mb-12 relative z-10">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 mb-3 shadow-sm">
            <span>👑 AUTHOR'S PUBLISHED WORKS · 이경윤 대표 정식 출간작 2종</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            현재 정식 출간된 <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-300">대표 도서 컬렉션</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            일상의 자유를 찾는 공존의 사용설명서부터 생각과 감정 너머의 순수 자각 《ZERO POINT》까지,<br class="hidden sm:inline" />
            전국 온·오프라인 서점에서 지금 바로 실물 도서로 만나보실 수 있습니다.
          </p>
        </div>

        <!-- 2 Books Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          
          <!-- Book 1: 나는 믿는다, 그러나 갇히지 않는다 -->
          <div class="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:border-emerald-400 transition group shadow-xl">
            <div class="shrink-0 text-center">
              <div class="relative group-hover:scale-[1.03] transition duration-300">
                <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition"></div>
                <img 
                  src="/assets/book-cover-freedom.jpg" 
                  alt="나는 믿는다, 그러나 갇히지 않는다" 
                  class="relative w-44 sm:w-48 rounded-xl shadow-2xl border border-white/20"
                />
              </div>
              <div class="mt-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow">
                  ✓ 정식 출간 도서
                </span>
              </div>
            </div>
            <div class="space-y-3 text-left">
              <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">인문 · 심리 · 영성</span>
              <h3 class="text-xl sm:text-2xl font-black text-white leading-snug">
                나는 믿는다,<br />
                <span class="text-emerald-300">그러나 갇히지 않는다</span>
              </h3>
              <p class="text-xs text-emerald-200/80 font-medium">
                다른 믿음과 함께 살아가는 자유인의 사용 설명서
              </p>
              <div class="text-[11px] text-slate-400 border-y border-slate-800/80 py-1.5 flex items-center gap-3">
                <span>저자 이경윤</span>
                <span>|</span>
                <span>도서출판 청류</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                신앙과 신념이 왜 사랑 대신 갈등과 배척을 낳는가? 믿음과 결합한 무의식적 자동반응(Dark Code)을 자각하고, 내 믿음을 지키며 타인을 끌어안는 ‘성숙한 자유인의 공존법’을 전합니다.
              </p>
              <div class="pt-2">
                <span class="inline-block px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                  📚 전국 온·오프라인 서점 절찬 판매 중
                </span>
              </div>
            </div>
          </div>

          <!-- Book 2: ZERO POINT -->
          <div class="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-amber-500/40 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:border-amber-400 transition group shadow-xl">
            <div class="shrink-0 text-center">
              <div class="relative group-hover:scale-[1.03] transition duration-300">
                <div class="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition"></div>
                <img 
                  src="/assets/book-cover-zeropoint.jpg" 
                  alt="ZERO POINT: Awareness of Awareness" 
                  class="relative w-44 sm:w-48 rounded-xl shadow-2xl border border-white/20"
                />
              </div>
              <div class="mt-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                  ✓ 정식 출간 도서
                </span>
              </div>
            </div>
            <div class="space-y-3 text-left">
              <span class="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">31권 대통합 완결작 · 인지과학</span>
              <h3 class="text-xl sm:text-2xl font-black text-white leading-snug">
                ZERO POINT<br />
                <span class="text-amber-300">AWARENESS OF AWARENESS</span>
              </h3>
              <p class="text-xs text-amber-200/80 font-medium">
                알아차림의 알아차림 · 아무것도 바꾸지 않아도 자유로운 자리
              </p>
              <div class="text-[11px] text-slate-400 border-y border-slate-800/80 py-1.5 flex items-center gap-3">
                <span>저자 이경윤</span>
                <span>|</span>
                <span>도서출판 청류</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                생각과 감정, 관찰자의 착각마저 멈추는 곳. 31권 마스터 시리즈의 최종 대통합 완결권으로서, 조건을 바꾸지 않고도 현실을 있는 그대로 안고 살아가는 ‘영점(Zero Point)의 절대 자유’를 밝힙니다.
              </p>
              <div class="pt-2">
                <span class="inline-block px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[11px] font-bold text-amber-300">
                  📚 전국 온·오프라인 서점 절찬 판매 중
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- 31 Series Notice Footer -->
        <div class="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400 relative z-10">
          ※ 상기 2종 도서는 현재 정식 출간되어 전국 서점에서 바로 구매하실 수 있으며, 아래의 <strong>명심코칭 31권 마스터 시리즈는 순차적으로 출간예정</strong>입니다.
        </div>
      </div>
`;

// 1. Update index.html
let indexHtml = fs.readFileSync(indexPath, 'utf8');
// Replace previous single featured book with dual books markup
indexHtml = indexHtml.replace(
  /<!-- \[FEATURED BOOK\] 현재 공식 출간 도서:[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  dualBooksMarkup.trim()
);

// Update Vol.31 card in Canon 7 in index.html to show actual Zero Point cover & "정식 출간 완료"
const oldVol31IndexRegex = /<!-- Canon 7: 31 ZERO POINT -->[\s\S]*?<div class="w-full sm:w-44 h-44 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-950 flex flex-col items-center justify-center p-4 text-center shrink-0 shadow-xl">[\s\S]*?<\/div>/;

const newVol31IndexCover = `<!-- Canon 7: 31 ZERO POINT -->
          <div class="p-6 rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-2xl flex flex-col justify-between hover:border-amber-300 transition group md:col-span-2 xl:col-span-2 relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-mono font-black text-amber-400">VOL.31 (FINAL MASTER)</span>
                <span class="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md">✓ 정식 출간 완료 (발간작)</span>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-6 mb-5">
                <div class="shrink-0 text-center">
                  <img src="/assets/book-cover-zeropoint.jpg" alt="ZERO POINT - 저자 이경윤, 청류" class="w-36 sm:w-44 rounded-xl shadow-2xl border border-white/20" />
                </div>`;

indexHtml = indexHtml.replace(oldVol31IndexRegex, newVol31IndexCover);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✓ Updated index.html with 2 featured published books and Zero Point cover');

// 2. Update library.html
let libHtml = fs.readFileSync(libPath, 'utf8');
libHtml = libHtml.replace(
  /<!-- \[FEATURED BOOK\] 현재 공식 출간 도서:[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  dualBooksMarkup.trim()
);

// Update Vol.31 card in library.html to show actual Zero Point cover & "정식 출간 완료"
const oldVol31LibRegex = /<!-- Vol 31 -->[\s\S]*?<div class="w-full h-40 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-950 p-4 text-center text-white flex flex-col justify-center items-center my-4">[\s\S]*?<\/div>[\s\S]*?<div class="pt-4 border-t border-slate-100 mt-4 text-xs font-bold text-amber-600">[\s\S]*?<\/div>/;

const newVol31LibCover = `<!-- Vol 31 -->
            <div class="p-6 rounded-3xl bg-white border-2 border-amber-500 shadow-xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-mono font-black text-amber-700">VOL.31 (FINAL)</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">✓ 출간 완료</span>
                </div>
                <div class="text-center my-3">
                  <img src="/assets/book-cover-zeropoint.jpg" alt="ZERO POINT" class="h-44 mx-auto rounded-xl shadow-lg border border-slate-200" />
                </div>
                <h4 class="font-black text-slate-900 mt-2">《ZERO POINT》</h4>
                <p class="text-xs text-slate-500 mt-0.5 font-medium">AWARENESS OF AWARENESS</p>
                <p class="text-xs text-slate-600 mt-1">아무것도 바꾸지 않아도 선택할 수 있는 자리</p>
              </div>
              <div class="pt-4 border-t border-slate-100 mt-4 text-xs font-bold text-amber-600">
                ✓ 정식 출간작 (전국 서점 절찬 판매 중)
              </div>`;

libHtml = libHtml.replace(oldVol31LibRegex, newVol31LibCover);
fs.writeFileSync(libPath, libHtml, 'utf8');
console.log('✓ Updated library.html with 2 featured published books and Zero Point cover');
