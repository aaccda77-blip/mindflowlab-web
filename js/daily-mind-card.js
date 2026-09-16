/**
 * =================================================================
 * MYUNGSIM DAILY INSIGHT · STREAMLINED 30-SECOND COACHING ENGINE
 * 명심코칭 "오늘의 명심 카드" 초간결 30초 단일 몰입 코칭 컨트롤러
 * =================================================================
 */

(function () {
  'use strict';

  let currentCard = null;
  let isShuffling = false;
  let isDeepDiveUnlocked = false;

  // 이벤트 트래킹 (개인 심리 데이터 미포함)
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

  // 초기화
  document.addEventListener('DOMContentLoaded', () => {
    renderPopularQuestions();
    renderWeeklyDiscovery();
    setupSwipeGesture();
  });

  // 1. 카드 섞기 (SHUFFLE)
  window.shuffleMindCards = function () {
    if (isShuffling) return;
    isShuffling = true;

    const deckEl = document.getElementById('mind-fanned-deck');
    const statusText = document.getElementById('mind-deck-status-text');

    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }

    if (statusText) {
      statusText.innerText = "정답을 고르지 마세요. 지금 마음에 와닿는 한 장.";
    }

    if (deckEl) {
      deckEl.classList.add('is-shuffling');
      setTimeout(() => {
        deckEl.classList.remove('is-shuffling');
        isShuffling = false;
      }, 550);
    } else {
      isShuffling = false;
    }

    trackMindEvent('card_shuffle');
  };

  // 2. 카드 선택 및 3D 플립 (PICK & REVEAL -> 30초 몰입 카드)
  window.pickMindCard = function (slotIndex, customCardId) {
    if (isShuffling) return;

    let selectedCard = null;
    if (customCardId) {
      selectedCard = MIND_CARDS_DATA.find(c => c.id === customCardId);
    }

    if (!selectedCard) {
      const randomIndex = Math.floor(Math.random() * MIND_CARDS_DATA.length);
      selectedCard = MIND_CARDS_DATA[randomIndex];
    }

    currentCard = selectedCard;
    isDeepDiveUnlocked = false;
    trackMindEvent('card_selected', { card_id: selectedCard.id, slot: slotIndex });

    // 히스토리 저장
    saveToWeeklyDiscovery(selectedCard);

    // 데이터 바인딩
    bindCardData(selectedCard);

    // 화면 전환 (1단 클릭으로 30초 내 즉시 도달)
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3d = document.getElementById('mind-active-card-3d');

    // 딥다이브 접어두기 (답변을 충분히 본 뒤에만 노출)
    const ctaContainer = document.getElementById('deep-dive-cta-container');
    const arrowEl = document.getElementById('deep-dive-arrow');
    const btnLabel = document.getElementById('deep-dive-btn-label');
    if (ctaContainer) ctaContainer.classList.add('hidden');
    if (arrowEl) arrowEl.innerHTML = '&darr;';
    if (btnLabel) btnLabel.innerText = '답변을 충분히 보셨나요? 내 일상과 책으로 더 깊이 이어가기';

    if (homeView && resultView && card3d) {
      homeView.style.opacity = '0';
      homeView.style.transform = 'scale(0.96)';

      setTimeout(() => {
        homeView.classList.add('hidden');
        resultView.classList.remove('hidden');

        requestAnimationFrame(() => {
          card3d.classList.add('is-revealed');
          trackMindEvent('card_revealed', { card_id: selectedCard.id });
        });

        const stage = document.getElementById('daily-mind-card-section');
        if (stage) {
          stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 280);
    }
  };

  // 3. 데이터 바인딩
  function bindCardData(card) {
    // 카드 헤더
    setElText('card-category-chip', card.category);
    setElText('card-title-text', card.cardTitle);
    setElText('card-question-text', card.question);

    // 1. 사이다 답변
    setElText('soda-answer-lead', card.sodaAnswer);
    setElText('soda-answer-desc', card.description);

    // 2. 1분 SCAN 질문 하나
    setElText('coach-scan-text', card.scanQuestion);
    const feedbackBox = document.getElementById('curiosity-feedback-box');
    if (feedbackBox) feedbackBox.classList.add('hidden');
    document.querySelectorAll('.curiosity-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });

    // 3. 오늘의 10% 실천 행동
    setElText('ten-percent-action-text', card.tenPercentAction);
    const actionCheckbox = document.getElementById('ten-percent-action-check');
    if (actionCheckbox) actionCheckbox.checked = false;

    // 4. 앱/책 CTA (답변을 본 뒤 노출될 영역 데이터)
    setElText('app-cta-label', card.appCTA || "내 패턴 직접 확인하기");
    setElText('app-subtext-label', card.appSubtext || "오늘 겪은 한 장면에서 내 진짜 Trigger와 자동반응을 관찰하고 기록합니다.");
    const appBtn = document.getElementById('mind-app-cta-btn');
    if (appBtn) {
      appBtn.href = `${MIND_CONFIG.APP_URL}?card=${encodeURIComponent(card.id)}&focus=1`;
    }

    setElText('book-name-label', `청류출판사 《${card.relatedBook}》`);
    setElText('book-chapter-label', card.bookChapter || "관련 챕터");
    setElText('book-subtext-label', card.bookSubtext || "왜 뇌는 이 반응을 최선의 생존 전략으로 착각했을까요? 책에서 원리를 탐구합니다.");
    setElText('book-cta-label', card.bookCTA || "이 질문의 뿌리 더 읽기");

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

  // 4. 1분 SCAN 트리거 칩 선택 (가벼운 1터치 참여)
  window.selectCuriosityTrigger = function (triggerType) {
    const feedbackBox = document.getElementById('curiosity-feedback-box');
    const feedbackText = document.getElementById('curiosity-feedback-text');

    const labels = {
      thought: "생각 (머릿속 소설/해석)",
      body: "몸의 신호 (가슴 답답함, 목 긴장)",
      impulse: "충동 (안절부절, 조급함)",
      action: "자동 행동 (반복확인, 회피)"
    };

    if (feedbackBox && feedbackText) {
      feedbackText.innerHTML = `내 안에서 <strong>‘${labels[triggerType] || triggerType}’</strong>이(가) 가장 먼저 켜지는군요. 이 반응과 싸우지 않고 알아차려 봅니다.`;
      feedbackBox.classList.remove('hidden');
    }

    // 버튼 스타일 강조
    document.querySelectorAll('.curiosity-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });

    const activeBtn = document.getElementById(`curiosity-chip-${triggerType}`);
    if (activeBtn) {
      activeBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
      activeBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
    }

    trackMindEvent('trigger_type_selected', { trigger: triggerType });
  };

  // 5. 10% 실천 체크 및 액션
  window.toggleTenPercentAction = function (isChecked) {
    if (isChecked) {
      trackMindEvent('ten_percent_action_selected', { card_id: currentCard ? currentCard.id : null });
      showToastNotification("✨ 오늘 10% 다른 행동을 선택하셨습니다! 작은 실천이 뇌 회로를 바꿉니다.");

      // 답변과 10% 실천까지 마친 사용자에게 자동으로 앱/책 심층 섹션을 열어줌
      unlockDeepDiveCTA();
    }
  };

  window.triggerTenPercentAction = function () {
    const actionCheckbox = document.getElementById('ten-percent-action-check');
    if (actionCheckbox) {
      actionCheckbox.checked = true;
      toggleTenPercentAction(true);
    }
  };

  // 6. 답변을 충분히 본 뒤에만 노출되는 앱/책 CTA 토글
  window.toggleDeepDiveCTA = function () {
    const ctaContainer = document.getElementById('deep-dive-cta-container');
    const arrowEl = document.getElementById('deep-dive-arrow');
    const btnLabel = document.getElementById('deep-dive-btn-label');
    if (!ctaContainer) return;

    if (ctaContainer.classList.contains('hidden')) {
      unlockDeepDiveCTA();
    } else {
      ctaContainer.classList.add('hidden');
      if (arrowEl) arrowEl.innerHTML = '&darr;';
      if (btnLabel) btnLabel.innerText = '답변을 충분히 보셨나요? 내 일상과 책으로 더 깊이 이어가기';
    }
  };

  function unlockDeepDiveCTA() {
    const ctaContainer = document.getElementById('deep-dive-cta-container');
    const arrowEl = document.getElementById('deep-dive-arrow');
    const btnLabel = document.getElementById('deep-dive-btn-label');
    if (!ctaContainer) return;

    ctaContainer.classList.remove('hidden');
    if (arrowEl) arrowEl.innerHTML = '&uarr;';
    if (btnLabel) btnLabel.innerText = '내 일상(앱)과 원리(책)로 이어가는 다음 단계:';

    if (!isDeepDiveUnlocked) {
      isDeepDiveUnlocked = true;
      trackMindEvent('deep_dive_unlocked', { card_id: currentCard ? currentCard.id : null });

      // 부드럽게 시선 안내
      setTimeout(() => {
        ctaContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }

  // 7. 카드 다시 뽑기
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
      }, 300);
    }
  };

  // 8. 모바일 스와이프 제스처
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
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        window.shuffleMindCards();
      }
    }
  }

  // 9. 이번 주의 발견 (로컬 스토리지 캐싱)
  function saveToWeeklyDiscovery(card) {
    try {
      const storageKey = 'mindflow_weekly_discovery';
      let history = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const today = new Date();
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayString = dayNames[today.getDay()];

      history = history.filter(item => item.id !== card.id);
      history.unshift({
        id: card.id,
        category: card.category,
        cardTitle: card.cardTitle,
        day: dayString,
        timestamp: Date.now()
      });

      if (history.length > 7) {
        history = history.slice(0, 7);
      }

      localStorage.setItem(storageKey, JSON.stringify(history));
      renderWeeklyDiscovery();
    } catch (e) {
      console.error(e);
    }
  }

  function renderWeeklyDiscovery() {
    try {
      const container = document.getElementById('weekly-discovery-list');
      const frequentInsight = document.getElementById('weekly-frequent-pattern');
      if (!container) return;

      const storageKey = 'mindflow_weekly_discovery';
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (history.length === 0) {
        container.innerHTML = `
          <div class="py-3 text-center text-xs text-slate-400 font-medium">
            아직 이번 주에 발견한 카드가 없습니다. 첫 카드를 뽑아보세요!
          </div>
        `;
        if (frequentInsight) frequentInsight.innerText = "이번 주를 시작할 첫 카드를 발견해 보세요.";
        return;
      }

      let html = '';
      const categoryCount = {};

      history.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        html += `
          <div onclick="pickMindCard(0, '${item.id}')" class="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200 hover:border-[#0F6B5B] transition shadow-2xs flex items-center justify-between gap-2.5 cursor-pointer group shrink-0">
            <div class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-[#0F6B5B]/10 text-[#0F6B5B] text-[10px] font-black flex items-center justify-center">${item.day}</span>
              <span class="text-xs font-bold text-slate-800 group-hover:text-[#0F6B5B]">${item.cardTitle}</span>
            </div>
            <span class="text-[10px] text-slate-400">[${item.category}]</span>
          </div>
        `;
      });
      container.innerHTML = html;

      let maxCategory = "";
      let maxCount = 0;
      for (const [cat, cnt] of Object.entries(categoryCount)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          maxCategory = cat;
        }
      }

      if (frequentInsight && maxCategory) {
        frequentInsight.innerHTML = `이번 주 가장 자주 등장한 마음 영역: <strong class="text-[#0F6B5B] font-black">${maxCategory}</strong>`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 10. 가로 스크롤 인기 질문 캐러셀
  function renderPopularQuestions() {
    const container = document.getElementById('popular-questions-carousel');
    if (!container) return;

    const popularIds = [
      "peoplepleaser-02",
      "textanxiety-08",
      "perfectionism-10",
      "burnout-15",
      "overchecking-01",
      "nunchi-04",
      "selfcriticism-19",
      "zeropoint-30"
    ];

    const cards = popularIds
      .map(id => MIND_CARDS_DATA.find(c => c.id === id))
      .filter(Boolean);

    let html = '';
    cards.forEach(c => {
      html += `
        <div onclick="pickMindCard(0, '${c.id}')" class="min-w-[260px] max-w-[280px] p-5 rounded-2xl bg-[#F7F4EC] border border-[#0F6B5B]/20 hover:border-[#0F6B5B] transition shadow-2xs hover:shadow-sm cursor-pointer flex flex-col justify-between group shrink-0 select-none">
          <div class="space-y-2">
            <span class="inline-block px-2 py-0.5 rounded-full bg-white text-[#0F6B5B] text-[10px] font-bold border border-[#0F6B5B]/20">
              ${c.category} · ${c.cardTitle}
            </span>
            <p class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0F6B5B] leading-snug">
              ${c.question}
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-[#0F6B5B] font-bold">
            <span>내 패턴 확인하기</span>
            <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 11. 자연어 검색
  window.handleMindCardSearch = function (query) {
    const dropdown = document.getElementById('mind-search-dropdown');
    if (!dropdown) return;

    const q = (query || "").trim().toLowerCase();
    if (q.length < 1) {
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
        <div class="p-4 text-center text-xs text-slate-500 font-medium">
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
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F6B5B]/10 text-[#0F6B5B]">${m.category}</span>
              <span class="text-xs font-bold text-slate-800">${m.cardTitle}</span>
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

  // 12. 토스트
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

  // 13. 복사
  window.copyMindCardResult = function () {
    if (!currentCard) return;
    const shareText = `🌿 [마인드플로우 랩 · 오늘의 명심 카드]
[${currentCard.category}] ${currentCard.cardTitle}
Q. ${currentCard.question}

💡 사이다 통찰:
${currentCard.sodaAnswer}

🔍 1분 SCAN:
${currentCard.scanQuestion}

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
