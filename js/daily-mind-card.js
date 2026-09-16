/**
 * =================================================================
 * MYUNGSIM DAILY INSIGHT · PRODUCTION MVP COACHING ENGINE
 * 명심코칭 "오늘의 명심 카드" & "사이다 Q&A"
 * 24개 스키마 필드 완전 지원 · 300~500개 무제한 확장 아키텍처
 * =================================================================
 */

(function () {
  'use strict';

  let currentCard = null;
  let isShuffling = false;
  let isDeepDiveUnlocked = false;
  let selectedBodyPart = '가슴 조임';
  let selectedImpulse = '거듭 확인';

  // 동적 CMS 데이터 저장소 (data/mind-cards.json 비동기 로드)
  let cardsData = [];
  let isDataLoaded = false;
  let dataLoadPromise = null;

  // 11개 핵심 분석 이벤트 트래킹 (사적인 심리 문장/텍스트는 일체 전송하지 않음)
  function trackMindEvent(eventName, payload) {
    try {
      // 민감한 텍스트 필드 필터링 (프라이버시 철저 보호)
      const safePayload = {};
      if (payload && typeof payload === 'object') {
        for (const [k, v] of Object.entries(payload)) {
          if (!['text', 'story', 'input', 'query'].includes(k)) {
            safePayload[k] = v;
          }
        }
      }
      if (window.dataLayer) {
        window.dataLayer.push({ event: eventName, ...safePayload });
      }
      console.log(`[Mindflow Analytics] ${eventName}:`, safePayload);
    } catch (e) {
      // ignore
    }
  }
  window.trackMindEvent = trackMindEvent;

  // 0. 서비스 링크 설정 비동기 로더 (data/service-config.json)
  let serviceConfigPromise = null;
  async function ensureServiceConfig() {
    if (window.MIND_CONFIG && window.MIND_CONFIG.APP_URL) return window.MIND_CONFIG;
    if (serviceConfigPromise) return serviceConfigPromise;

    serviceConfigPromise = (async () => {
      try {
        const response = await fetch('data/service-config.json', { cache: 'no-cache' });
        if (response.ok) {
          const json = await response.json();
          if (json && typeof json === 'object') {
            window.MIND_CONFIG = Object.assign({}, window.MIND_CONFIG || {}, json);
            console.log('[Mindflow Config] Loaded service config from data/service-config.json');
            return window.MIND_CONFIG;
          }
        }
      } catch (e) {
        console.warn('[Mindflow Config] fetch data/service-config.json failed, falling back:', e);
      }

      if (!window.MIND_CONFIG) {
        window.MIND_CONFIG = {
          APP_URL: 'https://myeongsimcoaching.com',
          PUBLISHER_URL: 'https://smartstore.naver.com/crbooks',
          DARK_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
          NEURAL_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
          ZERO_POINT_BOOK_URL: 'https://smartstore.naver.com/crbooks'
        };
      }
      return window.MIND_CONFIG;
    })();

    return serviceConfigPromise;
  }

  // relatedBook에 따른 자동 도서 상세 링크 라우팅
  function resolveBookUrl(card, config) {
    if (card && card.bookUrl && typeof card.bookUrl === 'string' && card.bookUrl.trim()) {
      return card.bookUrl.trim();
    }
    const cfg = config || window.MIND_CONFIG || {};
    const bookTitle = ((card && card.relatedBook) || '').trim().replace(/\s+/g, '');

    if (bookTitle.includes('다크')) {
      return cfg.DARK_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
    } else if (bookTitle.includes('뉴럴')) {
      return cfg.NEURAL_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
    } else if (bookTitle.includes('제로')) {
      return cfg.ZERO_POINT_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
    }
    return cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
  }

  // 앱 주소 라우팅 (카드 파라미터 및 액션 연동 지원)
  function resolveAppUrl(card, config, actionType) {
    if (card && card.appUrl && typeof card.appUrl === 'string' && card.appUrl.trim()) {
      return card.appUrl.trim();
    }
    const cfg = config || window.MIND_CONFIG || {};
    const baseUrl = cfg.APP_URL || 'https://myeongsimcoaching.com';
    const cardId = card && card.id ? card.id : '';
    const action = actionType || 'scan';
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}card=${encodeURIComponent(cardId)}&action=${action}&focus=1`;
  }

  // 0-1. 비동기 JSON 데이터 로더 (data/mind-cards.json)
  async function ensureCardsData() {
    if (isDataLoaded && cardsData.length > 0) return cardsData;
    if (dataLoadPromise) return dataLoadPromise;

    dataLoadPromise = (async () => {
      // 1. data/mind-cards.json 순수 JSON 파일 비동기 fetch
      try {
        const response = await fetch('data/mind-cards.json', { cache: 'no-cache' });
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            cardsData = json;
            isDataLoaded = true;
            window.MIND_CARDS_DATA = json; // 전역 싱크
            console.log(`[Mindflow CMS] Loaded ${json.length} cards from data/mind-cards.json`);
            return cardsData;
          }
        }
      } catch (e) {
        console.warn('[Mindflow CMS] fetch data/mind-cards.json failed, falling back to cached bundle:', e);
      }

      // 2. 오프라인 또는 file:// 로컬 미리보기용 캐시 fallback
      if (window.MIND_CARDS_DATA && Array.isArray(window.MIND_CARDS_DATA) && window.MIND_CARDS_DATA.length > 0) {
        cardsData = window.MIND_CARDS_DATA;
        isDataLoaded = true;
        console.log(`[Mindflow CMS] Using fallback bundle with ${cardsData.length} cards`);
        return cardsData;
      }

      return [];
    })();

    return dataLoadPromise;
  }

  // 초기화 (DOM 준비 시 데이터 로드 및 렌더링)
  document.addEventListener('DOMContentLoaded', async () => {
    trackMindEvent('daily_card_opened');
    await Promise.all([ensureServiceConfig(), ensureCardsData()]);
    renderPopularQuestions();
    renderWeeklyDiscovery();
    setupSwipeGesture();
    // 기본 검색 제안 렌더링
    handleMindCardSearch('');
  });

  // =================================================================
  // 1. 홈 화면 입구 분리 (A. 오늘의 카드 한 장 vs B. 지금 고민이 있어요)
  // =================================================================
  window.switchMindHomeTab = function (tab) {
    const deckTabBtn = document.getElementById('mind-tab-deck-btn');
    const searchTabBtn = document.getElementById('mind-tab-search-btn');
    const deckPanel = document.getElementById('mind-deck-panel');
    const searchPanel = document.getElementById('mind-search-panel');

    if (tab === 'deck') {
      if (deckTabBtn) {
        deckTabBtn.classList.remove('bg-white/10', 'text-slate-200', 'border', 'border-white/15');
        deckTabBtn.classList.add('bg-[#C7A86B]', 'text-slate-950', 'shadow-sm');
      }
      if (searchTabBtn) {
        searchTabBtn.classList.remove('bg-[#C7A86B]', 'text-slate-950', 'shadow-sm');
        searchTabBtn.classList.add('bg-white/10', 'text-slate-200', 'border', 'border-white/15');
      }
      if (deckPanel) deckPanel.classList.remove('hidden');
      if (searchPanel) searchPanel.classList.add('hidden');
    } else {
      if (searchTabBtn) {
        searchTabBtn.classList.remove('bg-white/10', 'text-slate-200', 'border', 'border-white/15');
        searchTabBtn.classList.add('bg-[#C7A86B]', 'text-slate-950', 'shadow-sm');
      }
      if (deckTabBtn) {
        deckTabBtn.classList.remove('bg-[#C7A86B]', 'text-slate-950', 'shadow-sm');
        deckTabBtn.classList.add('bg-white/10', 'text-slate-200', 'border', 'border-white/15');
      }
      if (searchPanel) searchPanel.classList.remove('hidden');
      if (deckPanel) deckPanel.classList.add('hidden');

      const searchInput = document.getElementById('mind-search-input');
      if (searchInput) {
        searchInput.focus();
        handleMindCardSearch(searchInput.value || '');
      }
    }
  };

  // 1-1. 추천 검색어 칩 클릭
  window.setMindSearchQuery = function (query) {
    const searchInput = document.getElementById('mind-search-input');
    if (searchInput) {
      searchInput.value = query;
      handleMindCardSearch(query);
    }
  };

  window.clearMindSearch = function () {
    const searchInput = document.getElementById('mind-search-input');
    if (searchInput) {
      searchInput.value = '';
      handleMindCardSearch('');
    }
  };

  // =================================================================
  // 2. 카드 섞기 (SHUFFLE)
  // =================================================================
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
  };

  // =================================================================
  // 3. 카드 선택 및 3D 플립 (PICK & REVEAL -> 3단계 코칭 흐름)
  // =================================================================
  window.pickMindCard = async function (slotIndex, customCardId) {
    if (isShuffling) return;

    await Promise.all([ensureServiceConfig(), ensureCardsData()]);
    if (!cardsData || cardsData.length === 0) return;

    // 특정 카드 ID 지정 또는 가중치/랜덤 선택
    let targetCard = null;
    if (customCardId) {
      targetCard = cardsData.find(c => c.id === customCardId);
      trackMindEvent('question_clicked', { cardId: customCardId });
    }

    if (!targetCard) {
      // 가중치(popularity) 기반 랜덤 선택
      const totalWeight = cardsData.reduce((sum, c) => sum + (c.popularity || 90), 0);
      let rand = Math.random() * totalWeight;
      for (const card of cardsData) {
        rand -= (card.popularity || 90);
        if (rand <= 0) {
          targetCard = card;
          break;
        }
      }
      if (!targetCard) {
        targetCard = cardsData[Math.floor(Math.random() * cardsData.length)];
      }
    }

    currentCard = targetCard;
    bindCardData(currentCard);
    saveToWeeklyDiscovery(currentCard);

    trackMindEvent('card_revealed', { cardId: currentCard.id, category: currentCard.category });
    trackMindEvent('soda_answer_viewed', { cardId: currentCard.id });
    trackMindEvent('curiosity_bridge_viewed', { cardId: currentCard.id });

    // 화면 전환
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3D = document.getElementById('mind-active-card-3d');

    if (homeView) homeView.classList.add('hidden');
    if (resultView) {
      resultView.classList.remove('hidden');
      if (card3D) {
        card3D.classList.remove('is-revealed');
        void card3D.offsetWidth;
        setTimeout(() => {
          card3D.classList.add('is-revealed');
        }, 30);
      }
    }

    // 부드러운 스크롤 이동
    const anchor = document.getElementById('mind-step-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =================================================================
  // 4. 카드 데이터 UI 바인딩 (24개 스키마 필드 정밀 연동)
  // =================================================================
  function bindCardData(card) {
    if (!card) return;

    // 헤더: 카테고리, 모드 명칭
    setElText('card-category-chip', card.category);
    setElText('card-title-text', card.cardTitle);

    // STEP 1. 질문 & 사이다 답변
    setElText('card-question-text', card.question);
    setElText('soda-answer-lead', card.sodaAnswer);
    setElText('soda-answer-desc', card.description);

    // STEP 2. 내 경우에는? (Curiosity Bridge)
    setElText('curiosity-bridge-question', card.curiosityQuestion || "“그렇다면 내 경우에는 무엇이 가장 먼저 켜지는 걸까?”");
    setElText('curiosity-bridge-sub', `나는 모르는 시간을 어떤 이야기(STORY)로 가장 빨리 채우는 편일까요?`);

    // STEP 3. 1분 SCAN 질문 (FACT / STORY / UNKNOWN)
    setElText('scan-fact-text', card.factQuestion || "실제로 확인된 사실(FACT)은 무엇인가요?");
    setElText('scan-story-text', card.storyQuestion || "그 사실에 나는 어떤 의미(STORY)를 붙였나요?");
    setElText('scan-unknown-text', card.unknownQuestion || "아직 확인되지 않은 미지의 영역(UNKNOWN)은 무엇인가요?");

    // 칩 초기화
    selectedBodyPart = '가슴 조임';
    selectedImpulse = '거듭 확인';
    document.querySelectorAll('.scan-body-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });
    const defaultBodyBtn = document.getElementById('scan-body-chest');
    if (defaultBodyBtn) {
      defaultBodyBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      defaultBodyBtn.classList.remove('border-slate-200', 'bg-white');
    }

    document.querySelectorAll('.scan-impulse-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });
    const defaultImpulseBtn = document.getElementById('scan-impulse-check');
    if (defaultImpulseBtn) {
      defaultImpulseBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      defaultImpulseBtn.classList.remove('border-slate-200', 'bg-white');
    }

    // STEP 4. 오늘의 작동지도 박스는 초기에는 접혀있거나 숨김
    const mapBox = document.getElementById('mind-operation-map-box');
    if (mapBox) mapBox.classList.add('hidden');

    // STEP 5. 오늘의 10% 실천 행동
    setElText('ten-percent-action-text', card.tenPercentAction);
    const actionCheckbox = document.getElementById('ten-percent-action-check');
    if (actionCheckbox) actionCheckbox.checked = false;

    // STEP 6. 앱/책 CTA
    const config = window.MIND_CONFIG || {
      APP_URL: 'https://myeongsimcoaching.com',
      PUBLISHER_URL: 'https://smartstore.naver.com/crbooks',
      DARK_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
      NEURAL_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
      ZERO_POINT_BOOK_URL: 'https://smartstore.naver.com/crbooks'
    };

    setElText('app-cta-label', card.appCTA || "내 패턴 1분 SCAN");
    setElText('app-subtext-label', "오늘 겪은 한 장면을 떠올려 내 진짜 Trigger와 자동반응을 관찰하고 기록합니다.");
    const appBtn = document.getElementById('mind-app-cta-btn');
    if (appBtn) {
      const appUrl = resolveAppUrl(card, config, 'scan');
      appBtn.href = appUrl;
    }
    const appSecBtn = document.getElementById('mind-app-secondary-btn');
    if (appSecBtn) {
      const compareUrl = resolveAppUrl(card, config, 'compare');
      appSecBtn.href = compareUrl;
    }

    setElText('book-name-label', `청류출판사 《${card.relatedBook}》`);
    setElText('book-chapter-label', card.relatedBookChapter || "원리 탐구");
    setElText('book-subtext-label', "왜 뇌는 이 반응을 최선의 생존 전략으로 착각했을까요? 책에서 원리를 탐구합니다.");
    setElText('book-cta-label', card.bookCTA || "이 질문의 뿌리 더 읽기");

    const bookBtn = document.getElementById('mind-book-cta-btn');
    if (bookBtn) {
      const bookUrl = resolveBookUrl(card, config);
      bookBtn.href = bookUrl;
    }

    // CTA 영역 초기화
    isDeepDiveUnlocked = false;
    const ctaContainer = document.getElementById('deep-dive-cta-container');
    if (ctaContainer) ctaContainer.classList.add('hidden');
    const arrow = document.getElementById('deep-dive-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  // =================================================================
  // 5. 1분 SCAN 트리거 칩 선택 (가벼운 1터치 참여)
  // =================================================================
  window.selectScanBody = function (partKey) {
    trackMindEvent('scan_started', { type: 'body' });
    const mapping = {
      chest: '가슴 조임/답답함',
      neck: '목·어깨 굳음',
      breath: '얕아진 호흡/명치 얹힘',
      head: '머리 열감/지끈거림'
    };
    selectedBodyPart = mapping[partKey] || '가슴 조임';

    document.querySelectorAll('.scan-body-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });

    const activeBtn = document.getElementById(`scan-body-${partKey}`);
    if (activeBtn) {
      activeBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      activeBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
    }
  };

  window.selectScanImpulse = function (impulseKey) {
    trackMindEvent('scan_started', { type: 'impulse' });
    const mapping = {
      check: '거듭 확인하고 통제하기',
      avoid: '회피하고 잠수타기',
      explain: '길게 변명하고 설명하기',
      criticize: '자책하고 스스로 몰아세우기'
    };
    selectedImpulse = mapping[impulseKey] || '거듭 확인하기';

    document.querySelectorAll('.scan-impulse-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });

    const activeBtn = document.getElementById(`scan-impulse-${impulseKey}`);
    if (activeBtn) {
      activeBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      activeBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
    }
  };

  // =================================================================
  // 6. 오늘의 작동지도 생성 (비진단성 작동기록 다이어그램)
  // =================================================================
  window.generateOperationMap = function () {
    if (!currentCard) return;

    // 트리거: 카드 질문을 바탕으로 정돈
    const cleanTrigger = currentCard.question.replace(/[“”"']/g, '').trim();
    setElText('map-trigger-text', cleanTrigger);

    // 내가 붙인 스토리
    const cleanStory = currentCard.storyQuestion || "상대나 상황에 나만의 빠른 의미를 부여함";
    setElText('map-story-text', cleanStory);

    // 몸의 신호
    setElText('map-body-text', selectedBodyPart);

    // 올라온 충동
    setElText('map-impulse-text', selectedImpulse);

    // 오늘의 10% 선택
    setElText('map-choice-text', currentCard.tenPercentAction);

    // 작동지도 표시
    const mapBox = document.getElementById('mind-operation-map-box');
    if (mapBox) {
      mapBox.classList.remove('hidden');
      mapBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 전환 CTA 자동 열림
    unlockDeepDiveCTA();

    trackMindEvent('scan_completed', { cardId: currentCard.id });
    showToastNotification("🧭 오늘의 작동지도가 생성되었습니다! 진단이 아닌 오늘의 기록입니다.");
  };

  // =================================================================
  // 7. 오늘의 10% 행동 선택 & 실천
  // =================================================================
  window.selectAltAction = function (actionText) {
    if (!currentCard) return;
    const label = document.getElementById('ten-percent-action-text');
    if (label) label.innerText = actionText;

    const checkbox = document.getElementById('ten-percent-action-check');
    if (checkbox) checkbox.checked = true;

    triggerTenPercentAction(actionText);
  };

  window.toggleTenPercentAction = function (isChecked) {
    if (isChecked) {
      triggerTenPercentAction();
    }
  };

  window.triggerTenPercentAction = function (customAction) {
    const checkbox = document.getElementById('ten-percent-action-check');
    if (checkbox) checkbox.checked = true;

    const actionName = customAction || (currentCard ? currentCard.tenPercentAction : "오늘의 10% 작은 실천");
    unlockDeepDiveCTA();

    showToastNotification("✨ 오늘 10% 다른 행동을 선택하셨습니다! 작은 실천이 뇌 회로를 바꿉니다.");
    trackMindEvent('ten_percent_action_selected', { cardId: currentCard ? currentCard.id : null, action: actionName });
  };

  // =================================================================
  // 8. 앱/책 CTA 토글 (Progressive Unlock)
  // =================================================================
  window.toggleDeepDiveCTA = function () {
    const container = document.getElementById('deep-dive-cta-container');
    const arrow = document.getElementById('deep-dive-arrow');
    if (!container) return;

    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      trackMindEvent('book_detail_viewed', { cardId: currentCard ? currentCard.id : null });
    } else {
      container.classList.add('hidden');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
  };

  function unlockDeepDiveCTA() {
    isDeepDiveUnlocked = true;
    const container = document.getElementById('deep-dive-cta-container');
    const arrow = document.getElementById('deep-dive-arrow');
    if (container) {
      container.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
  }

  // =================================================================
  // 9. 다시 뽑기 (RESET)
  // =================================================================
  window.resetMindCardSelection = function () {
    currentCard = null;
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3D = document.getElementById('mind-active-card-3d');

    if (card3D) card3D.classList.remove('is-revealed');
    if (resultView) resultView.classList.add('hidden');
    if (homeView) homeView.classList.remove('hidden');

    const statusText = document.getElementById('mind-deck-status-text');
    if (statusText) statusText.innerText = "“오늘의 마음은 어떤 카드를 꺼낼까?”";

    const section = document.getElementById('daily-mind-card-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // =================================================================
  // 10. 모바일 스와이프 제스처 지원 (390px 모바일 최적화)
  // =================================================================
  function setupSwipeGesture() {
    const activeCard = document.getElementById('mind-active-card-3d');
    if (!activeCard) return;

    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    activeCard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    activeCard.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < 0) {
          // Swipe Left -> 다른 카드 뽑기
          pickMindCard(1);
        } else {
          // Swipe Right -> 섞기
          shuffleMindCards();
        }
      }
    }
  }

  // =================================================================
  // 11. 이번 주의 발견 (7일 히스토리 & 메타 성찰)
  // =================================================================
  function saveToWeeklyDiscovery(card) {
    if (!card) return;
    try {
      const key = 'myeongsim_history_cards';
      let history = [];
      const raw = localStorage.getItem(key);
      if (raw) history = JSON.parse(raw);

      const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
      const now = new Date();
      const dayLabel = `${daysOfWeek[now.getDay()]}요일`;

      // 중복 추가 방지 (동일 ID는 최신으로 이동)
      history = history.filter(item => item.id !== card.id);
      history.unshift({
        id: card.id,
        category: card.category,
        cardTitle: card.cardTitle,
        keyword: card.keyword,
        day: dayLabel,
        timestamp: Date.now()
      });

      // 최대 7개 보관
      history = history.slice(0, 7);
      localStorage.setItem(key, JSON.stringify(history));
      renderWeeklyDiscovery();
    } catch (e) {
      // localStorage 불가 환경 대응
    }
  }

  function renderWeeklyDiscovery() {
    const listEl = document.getElementById('weekly-discovery-list');
    const freqEl = document.getElementById('weekly-frequent-pattern');
    if (!listEl) return;

    let history = [];
    try {
      const raw = localStorage.getItem('myeongsim_history_cards');
      if (raw) history = JSON.parse(raw);
    } catch (e) {}

    // 기록이 적은 경우 기본 4일 예시 스타터 팩 제공
    if (!history || history.length === 0) {
      history = [
        { id: 'overchecking-01', cardTitle: '확인 모드', day: '월요일', category: '불확실성' },
        { id: 'peoplepleaser-02', cardTitle: '착한 사람 모드', day: '화요일', category: '경계·관계' },
        { id: 'perfectionism-10', cardTitle: '완벽 검열 모드', day: '목요일', category: '성과·완벽' },
        { id: 'overchecking-01', cardTitle: '확인 모드', day: '토요일', category: '불확실성' }
      ];
    }

    listEl.innerHTML = history.map(item => `
      <button onclick="pickMindCard(0, '${item.id}')" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
        <span class="text-[10px] text-[#E2CF9F]">${item.day}</span>
        <span>${item.cardTitle}</span>
      </button>
    `).join('');

    // 가장 자주 등장한 모드 자동 계산
    if (freqEl) {
      const counts = {};
      history.forEach(item => {
        counts[item.cardTitle] = (counts[item.cardTitle] || 0) + 1;
      });
      let maxCount = 0;
      let frequentMode = '확인 모드';
      for (const [mode, cnt] of Object.entries(counts)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          frequentMode = mode;
        }
      }
      freqEl.innerText = `💡 이번 주에는 '${frequentMode}'(${maxCount}회)가 가장 자주 관찰되었습니다.`;
    }
  }

  // =================================================================
  // 12. 요즘 사람들이 많이 마주하는 질문 (9대 큐레이션 캐러셀)
  // =================================================================
  function renderPopularQuestions() {
    const carousel = document.getElementById('popular-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    // 1. isFeatured 플래그가 있는 카드 우선 (최대 12개)
    let curated = cardsData.filter(c => c.isFeatured);
    if (curated.length < 12) {
      const remaining = cardsData.filter(c => !c.isFeatured)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      curated = curated.concat(remaining);
    }
    curated = curated.slice(0, 12);

    carousel.innerHTML = curated.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0F6B5B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#0F6B5B]/10 text-[#0F6B5B] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0F6B5B] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#0F6B5B]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // 13. 자연어 일상 고민 검색 (입구 B)
  // =================================================================
  window.handleMindCardSearch = function (rawQuery) {
    const resultsBox = document.getElementById('mind-search-results-box');
    const clearBtn = document.getElementById('mind-search-clear-btn');
    if (!resultsBox) return;

    const query = (rawQuery || '').trim().toLowerCase();

    if (clearBtn) {
      if (query.length > 0) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    let matched = [];
    if (!query) {
      // 쿼리가 없을 때: 기본 추천 질문 4개 노출
      matched = cardsData.filter(c => c.isFeatured).slice(0, 4);
      if (matched.length === 0) matched = cardsData.slice(0, 4);
    } else {
      matched = cardsData.filter(c => {
        const qText = (c.question || '').toLowerCase();
        const kw = (c.keyword || '').toLowerCase();
        const title = (c.cardTitle || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const answer = (c.sodaAnswer || '').toLowerCase();
        const tags = Array.isArray(c.searchKeywords) ? c.searchKeywords.join(' ').toLowerCase() : '';
        return qText.includes(query) || kw.includes(query) || title.includes(query) || cat.includes(query) || tags.includes(query) || answer.includes(query);
      }).slice(0, 5);
    }

    // 헤더: “당신을 규정하는 결과가 아닙니다. 지금 상황과 가까운 질문부터 골라보세요.”
    let html = `
      <div class="mb-2">
        <div class="text-xs sm:text-sm font-black text-[#E2CF9F] leading-snug">
          “당신을 규정하는 결과가 아닙니다.<br class="sm:hidden" /> 지금 상황과 가까운 질문부터 골라보세요.”
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">상황에 맞는 사이다 질문과 1분 SCAN으로 이어집니다.</div>
      </div>
    `;

    if (matched.length === 0) {
      html += `
        <div class="p-4 rounded-xl bg-white/5 text-center text-xs text-slate-400">
          일치하는 카드가 없습니다. '답장', '거절', '확인', '불안' 등 다른 키워드로 검색해보세요.
        </div>
      `;
    } else {
      html += matched.map(card => `
        <div onclick="pickMindCard(0, '${card.id}')" class="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-[#C7A86B] transition-all cursor-pointer flex items-center justify-between gap-3 group">
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-md bg-[#0F6B5B] text-white text-[9px] font-bold">
                ${card.category}
              </span>
              <span class="text-[10px] text-[#E2CF9F] font-bold">${card.cardTitle}</span>
            </div>
            <p class="text-xs font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
              ${card.question}
            </p>
          </div>
          <span class="text-[#E2CF9F] text-xs font-black shrink-0">&rarr;</span>
        </div>
      `).join('');
    }

    resultsBox.innerHTML = html;
  };

  // =================================================================
  // 14. 토스트 알림
  // =================================================================
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

  // =================================================================
  // 15. 카드 복사
  // =================================================================
  window.copyMindCardResult = function () {
    if (!currentCard) return;
    const shareText = `🌿 [마인드플로우 랩 · 오늘의 명심 카드]
[${currentCard.category}] ${currentCard.cardTitle}
Q. ${currentCard.question}

💡 사이다 통찰:
${currentCard.sodaAnswer}

🔍 1분 SCAN 관찰:
- FACT: ${currentCard.factQuestion}
- STORY: ${currentCard.storyQuestion}
- UNKNOWN: ${currentCard.unknownQuestion}

⚡ 오늘 10% 실천:
${currentCard.tenPercentAction}

“이것은 성격진단이 아니라 오늘의 작동기록입니다.”
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
