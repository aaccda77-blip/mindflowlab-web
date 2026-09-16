/**
 * =================================================================
 * MYUNGSIM DAILY INSIGHT · INTERACTIVE CONTROLLER
 * 명심코칭 "오늘의 명심 카드" 전용 인터랙션 및 상태 관리 엔진
 * =================================================================
 */

(function () {
  'use strict';

  // 상태 변수
  let currentCard = null;
  let isShuffling = false;

  // 1. 이벤트 트래킹 헬퍼 (개인 심리 데이터는 미포함)
  function trackMindEvent(eventName, payload) {
    try {
      if (window.dataLayer) {
        window.dataLayer.push({ event: eventName, ...payload });
      }
      console.log(`[Mindflow Analytics] ${eventName}:`, payload || {});
    } catch (e) {
      // ignore
    }
  }

  // 2. 초기화
  document.addEventListener('DOMContentLoaded', () => {
    renderPopularQuestions();
    renderWeeklyDiscovery();
    setupSwipeGesture();
  });

  // 3. 01. HOME & 02. SHUFFLE: 카드 셔플 모션
  window.shuffleMindCards = function () {
    if (isShuffling) return;
    isShuffling = true;

    const deckEl = document.getElementById('mind-fanned-deck');
    const statusText = document.getElementById('mind-deck-status-text');

    // 햅틱 진동 피드백 (모바일 지원 브라우저)
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }

    if (statusText) {
      statusText.innerText = "정답을 고르지 마세요. 그냥 지금 끌리는 한 장.";
    }

    if (deckEl) {
      deckEl.classList.add('is-shuffling');
      setTimeout(() => {
        deckEl.classList.remove('is-shuffling');
        isShuffling = false;
      }, 600);
    } else {
      isShuffling = false;
    }

    trackMindEvent('card_shuffle');
  };

  // 4. 03. PICK & 04. REVEAL: 카드 선택 및 3D 플립
  window.pickMindCard = function (slotIndex, customCardId) {
    if (isShuffling) return;

    let selectedCard = null;
    if (customCardId) {
      selectedCard = MIND_CARDS_DATA.find(c => c.id === customCardId);
    }

    if (!selectedCard) {
      // 랜덤 카드 선택
      const randomIndex = Math.floor(Math.random() * MIND_CARDS_DATA.length);
      selectedCard = MIND_CARDS_DATA[randomIndex];
    }

    currentCard = selectedCard;
    trackMindEvent('card_selected', { card_id: selectedCard.id, slot: slotIndex });

    // 히스토리에 저장
    saveToWeeklyDiscovery(selectedCard);

    // 뷰 바인딩
    bindCardView(selectedCard);

    // 3D 플립 애니메이션 전개
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3d = document.getElementById('mind-active-card-3d');

    if (homeView && resultView && card3d) {
      homeView.style.opacity = '0';
      homeView.style.transform = 'scale(0.95)';

      setTimeout(() => {
        homeView.classList.add('hidden');
        resultView.classList.remove('hidden');

        // 카드 뒤집기 애니메이션
        requestAnimationFrame(() => {
          card3d.classList.add('is-revealed');
          trackMindEvent('card_revealed', { card_id: selectedCard.id });
          trackMindEvent('soda_answer_viewed', { card_id: selectedCard.id });
        });

        // 결과 영역으로 부드럽게 스크롤
        const stage = document.getElementById('daily-mind-card-section');
        if (stage) {
          stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  };

  // 5. 뷰 바인딩 (사이다 답변, 3S 코칭, 10% 액션, 앱/책 추천)
  function bindCardView(card) {
    // 앞면 기본 정보
    setElText('card-category-chip', card.category);
    setElText('card-title-text', card.cardTitle);
    setElText('card-question-text', card.question);

    // 사이다 답변
    setElText('soda-answer-lead', card.sodaAnswer);
    setElText('soda-answer-desc', card.description);

    // 호기심 브릿지
    setElText('curiosity-bridge-question', card.curiosityQuestion);

    // 3S 코칭
    setElText('coach-scan-text', card.scanQuestion);
    setElText('coach-sync-text', card.syncSentence);
    setElText('coach-shift-text', card.shiftQuestion);

    // 10% 실천 액션
    setElText('ten-percent-action-text', card.tenPercentAction);
    const actionCheckbox = document.getElementById('ten-percent-action-check');
    if (actionCheckbox) actionCheckbox.checked = false;

    // 앱 CTA
    setElText('app-cta-label', card.appCTA || "내 패턴 1분 SCAN");
    const appBtn = document.getElementById('mind-app-cta-btn');
    if (appBtn) {
      appBtn.href = MIND_CONFIG.APP_URL;
    }

    // 책 추천 및 CTA
    setElText('book-name-label', `청류출판사 《${card.relatedBook}》`);
    setElText('book-chapter-label', card.bookChapter || "관련 챕터");
    setElText('book-cta-label', card.bookCTA || "책에서 더 깊이 읽기");
    
    const bookBtn = document.getElementById('mind-book-cta-btn');
    if (bookBtn) {
      if (card.relatedBook === "다크 코드") {
        bookBtn.href = MIND_CONFIG.DARK_CODE_BOOK_URL;
      } else if (card.relatedBook === "뉴럴 코드") {
        bookBtn.href = MIND_CONFIG.NEURAL_CODE_BOOK_URL;
      } else {
        bookBtn.href = MIND_CONFIG.ZERO_POINT_BOOK_URL;
      }
    }
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  // 6. 10% 행동 체크박스 토글
  window.toggleTenPercentAction = function (isChecked) {
    if (isChecked) {
      trackMindEvent('ten_percent_action_selected', { card_id: currentCard ? currentCard.id : null });
      showToastNotification("✨ 오늘 10% 다른 행동을 선택하셨습니다! 당신의 하루를 응원합니다.");
    }
  };

  // 7. 카드 다시 뽑기 (Reset)
  window.resetMindCardSelection = function () {
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3d = document.getElementById('mind-active-card-3d');

    if (card3d) card3d.classList.remove('is-revealed');

    if (resultView && homeView) {
      resultView.style.opacity = '0';
      setTimeout(() => {
        resultView.classList.add('hidden');
        resultView.style.opacity = '1';

        homeView.classList.remove('hidden');
        homeView.style.opacity = '1';
        homeView.style.transform = 'scale(1)';

        const statusText = document.getElementById('mind-deck-status-text');
        if (statusText) {
          statusText.innerText = "오늘의 마음은 어떤 카드를 꺼낼까?";
        }
      }, 350);
    }
  };

  // 8. 모바일 스와이프 제스처 지원 (02. SHUFFLE)
  function setupSwipeGesture() {
    const deck = document.getElementById('mind-fanned-deck');
    if (!deck) return;

    let touchStartX = 0;
    let touchEndX = 0;

    deck.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    deck.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (Math.abs(touchEndX - touchStartX) > 45) {
        shuffleMindCards();
      }
    }, { passive: true });
  }

  // 9. 히스토리: 이번 주의 발견 (Weekly Discovery)
  function saveToWeeklyDiscovery(card) {
    try {
      const now = new Date();
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = days[now.getDay()];

      let history = JSON.parse(localStorage.getItem('myungsim_weekly_discovery') || '[]');
      
      // 동일 요일 중복 방지 (최신 1건으로 덮어쓰기)
      history = history.filter(item => item.day !== dayName);

      history.unshift({
        id: card.id,
        day: dayName,
        cardTitle: card.cardTitle,
        category: card.category,
        dateStr: `${now.getMonth() + 1}/${now.getDate()}`
      });

      // 최대 7개(최근 1주일)만 유지
      if (history.length > 7) history = history.slice(0, 7);

      localStorage.setItem('myungsim_weekly_discovery', JSON.stringify(history));
      renderWeeklyDiscovery();
    } catch (e) {
      console.error(e);
    }
  }

  function renderWeeklyDiscovery() {
    const container = document.getElementById('weekly-discovery-list');
    const frequentInsight = document.getElementById('weekly-frequent-pattern');
    if (!container) return;

    try {
      const history = JSON.parse(localStorage.getItem('myungsim_weekly_discovery') || '[]');
      if (history.length === 0) {
        container.innerHTML = `
          <div class="py-4 text-center text-xs text-slate-400 font-medium">
            아직 이번 주에 발견한 카드가 없습니다. 첫 카드를 뽑아보세요!
          </div>
        `;
        if (frequentInsight) frequentInsight.innerText = "이번 주를 시작할 첫 카드를 발견해 보세요.";
        return;
      }

      // 렌더링
      let html = '';
      const categoryCount = {};

      history.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        html += `
          <div onclick="pickMindCard(0, '${item.id}')" class="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-[#0F6B5B] transition shadow-2xs flex items-center justify-between gap-3 cursor-pointer group shrink-0">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-[#0F6B5B]/10 text-[#0F6B5B] text-[11px] font-black flex items-center justify-center">${item.day}</span>
              <span class="text-xs font-bold text-slate-800 group-hover:text-[#0F6B5B]">${item.cardTitle}</span>
            </div>
            <span class="text-[10px] text-slate-400 font-medium">[${item.category}]</span>
          </div>
        `;
      });
      container.innerHTML = html;

      // 가장 빈번한 카테고리 계산
      let maxCategory = "";
      let maxCount = 0;
      for (const [cat, cnt] of Object.entries(categoryCount)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          maxCategory = cat;
        }
      }

      if (frequentInsight && maxCategory) {
        frequentInsight.innerHTML = `이번 주 나에게 가장 자주 등장한 마음 영역은? 👉 <strong class="text-[#0F6B5B] font-black underline underline-offset-2">${maxCategory}</strong>`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 10. 요즘 사람들이 많이 묻는 질문 (가로 스크롤 캐러셀)
  function renderPopularQuestions() {
    const container = document.getElementById('popular-questions-carousel');
    if (!container) return;

    // 인기 카드 8개 엄선
    const popularIds = [
      "peoplepleaser-02", // 좋은 사람 강박
      "textanxiety-08",   // 답장불안
      "perfectionism-10", // 완벽주의
      "burnout-15",       // 번아웃
      "overchecking-01",  // 과잉확인
      "nunchi-04",        // 눈치
      "selfcriticism-19", // 자기비난
      "zeropoint-30"      // 제로포인트
    ];

    const cards = popularIds
      .map(id => MIND_CARDS_DATA.find(c => c.id === id))
      .filter(Boolean);

    let html = '';
    cards.forEach(c => {
      html += `
        <div onclick="pickMindCard(0, '${c.id}')" class="min-w-[260px] max-w-[280px] p-5 rounded-2xl bg-[#F7F4EC] border border-[#C7A86B]/30 hover:border-[#0F6B5B] transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group shrink-0 select-none">
          <div class="space-y-2">
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-white text-[#0F6B5B] text-[10px] font-black border border-[#0F6B5B]/20">
              ${c.category} · ${c.cardTitle}
            </span>
            <p class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0F6B5B] leading-snug">
              ${c.question}
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#0F6B5B] font-bold">
            <span>답변 카드 열기</span>
            <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 11. 일상 고민 자연어 검색
  window.handleMindCardSearch = function (query) {
    const q = (query || '').toLowerCase().trim();
    const dropdown = document.getElementById('mind-search-dropdown');
    if (!dropdown) return;

    if (!q) {
      dropdown.classList.add('hidden');
      return;
    }

    const matches = MIND_CARDS_DATA.filter(c => {
      return (
        c.question.toLowerCase().includes(q) ||
        c.cardTitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.sodaAnswer.toLowerCase().includes(q) ||
        c.searchKeywords.some(k => k.toLowerCase().includes(q))
      );
    });

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-5 text-center text-xs text-slate-500 font-medium">
          일치하는 명심 카드를 찾지 못했습니다.<br />
          <span class="text-[#0F6B5B] font-bold">"거절", "확인", "답장", "불안"</span> 등으로 검색해 보세요.
        </div>
      `;
    } else {
      let html = '';
      matches.slice(0, 5).forEach(m => {
        html += `
          <div onclick="pickMindCard(0, '${m.id}'); closeMindSearchDropdown();" class="p-3.5 hover:bg-emerald-50/60 transition cursor-pointer border-b border-slate-100 last:border-0 text-left">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#0F6B5B]/10 text-[#0F6B5B]">${m.category}</span>
              <span class="text-xs font-bold text-slate-700">${m.cardTitle}</span>
            </div>
            <div class="text-xs font-bold text-slate-900 leading-snug line-clamp-1">${m.question}</div>
          </div>
        `;
      });
      dropdown.innerHTML = html;
    }

    dropdown.classList.remove('hidden');
  };

  window.closeMindSearchDropdown = function () {
    const dropdown = document.getElementById('mind-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  };

  // 12. 알림 토스트 헬퍼
  function showToastNotification(msg) {
    const toast = document.getElementById('mind-toast');
    const toastText = document.getElementById('mind-toast-text');
    if (!toast) return;
    if (toastText) toastText.innerText = msg;

    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3200);
  }

  // 13. 카드 결과 복사
  window.copyMindCardResult = function () {
    if (!currentCard) return;
    const shareText = `🌿 [마인드플로우 랩 · 오늘의 명심 카드]
[${currentCard.category}] ${currentCard.cardTitle}
Q. ${currentCard.question}

💡 사이다 처방:
${currentCard.sodaAnswer}

⚡ 오늘 10% 실천:
${currentCard.tenPercentAction}

“지금 올라오는 반응은 존중하되, 다음 행동의 결재권까지 넘기지는 마세요.”
— 마인드플로우 랩 명심코칭`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToastNotification("📋 오늘의 명심 카드가 복사되었습니다! 소중한 분과 나눠보세요.");
      }).catch(() => {
        fallbackCopyText(shareText);
      });
    } else {
      fallbackCopyText(shareText);
    }
  };

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToastNotification("📋 오늘의 명심 카드가 복사되었습니다!");
  }

})();