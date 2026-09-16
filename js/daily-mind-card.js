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

  // 9대 핵심 전환 분석 이벤트 트래킹 (사적인 심리 문장/텍스트는 일체 전송하지 않음)
  // [10] question_view, card_open, answer_view, curiosity_click, scan_start, scan_complete, action_select, app_click, book_click
  const EVENT_ALIASES = {
    'daily_card_opened': 'card_open',
    'question_clicked': 'question_view',
    'card_revealed': 'card_open',
    'soda_answer_viewed': 'answer_view',
    'curiosity_bridge_viewed': 'curiosity_click',
    'scan_started': 'scan_start',
    'scan_completed': 'scan_complete',
    'ten_percent_action_selected': 'action_select',
    'app_cta_clicked': 'app_click',
    'book_cta_clicked': 'book_click'
  };

  function trackMindEvent(eventName, payload) {
    try {
      const canonicalEvent = EVENT_ALIASES[eventName] || eventName;
      // 민감한 텍스트 필드 필터링 (프라이버시 철저 보호)
      const safePayload = {};
      if (payload && typeof payload === 'object') {
        for (const [k, v] of Object.entries(payload)) {
          if (!['text', 'story', 'input', 'query', 'memo', 'answer'].includes(k.toLowerCase())) {
            safePayload[k] = v;
          }
        }
      }
      if (window.dataLayer) {
        window.dataLayer.push({ event: canonicalEvent, originalEvent: eventName, ...safePayload });
      }
      console.log(`[Mindflow Analytics] [${canonicalEvent}] (source: ${eventName}):`, safePayload);
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
      return cfg.DARK_CODE_URL || cfg.DARK_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
    } else if (bookTitle.includes('뉴럴')) {
      return cfg.NEURAL_CODE_URL || cfg.NEURAL_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
    } else if (bookTitle.includes('제로')) {
      return cfg.ZERO_POINT_URL || cfg.ZERO_POINT_BOOK_URL || cfg.PUBLISHER_URL || 'https://smartstore.naver.com/crbooks';
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
    trackMindEvent('relationship_pack_view', { packId: 'relationship-anxiety-01', source: 'home_load' });
    trackMindEvent('money_pack_view', { packId: 'money-business-01', source: 'home_load' });
    await Promise.all([ensureServiceConfig(), ensureCardsData()]);
    trackMindEvent('career_pack_view', { packId: 'career-burnout-01', source: 'home_load' });
    trackMindEvent('perfection_pack_view', { packId: 'perfection-approval-comparison-01', source: 'home_load' });
    renderPopularQuestions();
    renderMoneyQuestions();
    renderCareerQuestions();
    renderPerfectionQuestions();
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

      trackMindEvent('relationship_pack_view', { packId: 'relationship-anxiety-01', source: 'search_tab' });
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

    // 관계·불안 명심카드 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('relationship_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 돈·사업 명심카드 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('money_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 직장·성과·번아웃 명심카드 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('career_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 완벽주의·인정·비교 명심카드 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('perfection_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }

    // 화면 전환
    const homeView = document.getElementById('mind-home-view');
    const resultView = document.getElementById('mind-result-view');
    const card3D = document.getElementById('mind-active-card-3d');

    if (homeView) homeView.classList.add('hidden');
    if (resultView) {
      resultView.classList.remove('hidden');
      if (card3D) {
        card3D.style.transform = 'translateY(16px) scale(0.96) rotateY(0deg)';
        card3D.classList.remove('is-revealed');
        void card3D.offsetWidth;
        setTimeout(() => {
          card3D.classList.add('is-revealed');
          card3D.style.transform = 'translateY(0) scale(1) rotateY(0deg)';
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

    // STEP 3-1. SYNC & SHIFT (자기자비와 새로운 관점)
    setElText('sync-sentence-text', card.syncSentence || "불확실해서 확인하고 싶은 마음이 올라오는구나.");
    setElText('shift-question-text', card.shiftQuestion || "지금 바로 결론내리지 않는다면 어떤 선택이 가능할까요?");

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
      DARK_CODE_URL: 'https://smartstore.naver.com/crbooks',
      NEURAL_CODE_URL: 'https://smartstore.naver.com/crbooks',
      ZERO_POINT_URL: 'https://smartstore.naver.com/crbooks'
    };

    setElText('app-cta-label', card.appCTA || "내 패턴 직접 확인하기");
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
    setElText('book-chapter-label', card.relatedChapter || card.relatedBookChapter || "원리 탐구");
    setElText('book-subtext-label', "왜 뇌는 이 반응을 최선의 생존 전략으로 착각했을까요? 책에서 원리를 탐구합니다.");
    setElText('book-cta-label', card.bookCTA || "이 질문의 뿌리 더 읽기");

    const bookBtn = document.getElementById('mind-book-cta-btn');
    if (bookBtn) {
      const bookUrl = resolveBookUrl(card, config);
      bookBtn.href = bookUrl;
    }

    // Curiosity Bridge 즉시 연결 버튼 URL 동적 바인딩
    const bridgeAppBtn = document.getElementById('mind-bridge-app-btn');
    if (bridgeAppBtn) {
      bridgeAppBtn.href = resolveAppUrl(card, config, 'scan');
    }
    const bridgeBookBtn = document.getElementById('mind-bridge-book-btn');
    if (bridgeBookBtn) {
      bridgeBookBtn.href = resolveBookUrl(card, config);
    }

    // PACK 04 전용 Curiosity Bridge 및 특수 인터랙션 분기
    updatePackCuriosityBridge(card);
    renderPack04SpecialInteraction(card);

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

  // =================================================================
  // 4-0. 앱 / 책 CTA 통합 트래킹 핸들러
  // =================================================================
  window.handleMindAppClick = function (source) {
    trackMindEvent('app_click', { source: source || 'app_cta', cardId: currentCard ? currentCard.id : null });
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_app_click', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_app_click', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_app_click', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_app_click', { source: source || 'app_cta', cardId: currentCard.id });
    }
  };

  window.handleMindBookClick = function (source) {
    trackMindEvent('book_click', { source: source || 'book_cta', cardId: currentCard ? currentCard.id : null });
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
  };

  // 4-1. [9] 호기심 4대 질문 인터랙션 (이탈 방지 회로)
  // =================================================================
  window.selectCuriosityQuestion = function (qText) {
    trackMindEvent('curiosity_click', { question: qText });
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
    }
    setElText('curiosity-bridge-question', `“${qText}”`);
    
    // 버튼 하이라이트 효과
    document.querySelectorAll('.curiosity-preset-chip').forEach(btn => {
      btn.classList.remove('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
      btn.classList.add('border-amber-200/80', 'bg-white', 'text-slate-700');
    });
    const clickedBtn = event ? event.currentTarget : null;
    if (clickedBtn) {
      clickedBtn.classList.remove('border-amber-200/80', 'bg-white', 'text-slate-700');
      clickedBtn.classList.add('border-[#0F6B5B]', 'bg-emerald-50', 'text-[#0F6B5B]', 'font-black');
    }

    const scanEl = document.getElementById('mind-scan-container');
    if (scanEl) {
      scanEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // =================================================================
  // 5. 1분 SCAN 인터랙션 (BODY / IMPULSE)
  // =================================================================
  window.selectScanBody = function (partKey) {
    trackMindEvent('scan_started', { type: 'body' });
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'body' });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'body' });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'body' });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'body' });
    }
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
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'impulse' });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'impulse' });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'impulse' });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'impulse' });
    }
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
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_scan_complete', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_scan_complete', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_scan_complete', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_scan_complete', { cardId: currentCard.id, category: currentCard.category });
    }
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
    if (currentCard && (currentCard.packId === 'relationship-anxiety-01' || (currentCard.id && currentCard.id.startsWith('rel-')))) {
      trackMindEvent('relationship_action_select', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'money-business-01' || (currentCard.id && currentCard.id.startsWith('money-')))) {
      trackMindEvent('money_action_select', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'career-burnout-01' || (currentCard.id && currentCard.id.startsWith('career-')))) {
      trackMindEvent('career_action_select', { cardId: currentCard.id, category: currentCard.category });
    }
    if (currentCard && (currentCard.packId === 'perfection-approval-comparison-01' || (currentCard.id && currentCard.id.startsWith('perf-')))) {
      trackMindEvent('perfection_action_select', { cardId: currentCard.id, category: currentCard.category });
    }
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

  // =================================================================
  // 11-1. PACK 04 전용 Curiosity Bridge & 미니 인터랙션 렌더러
  // =================================================================
  function updatePackCuriosityBridge(card) {
    const isPack04 = card && (card.packId === 'perfection-approval-comparison-01' || (card.id && card.id.startsWith('perf-')));
    const bridgeQ = document.getElementById('curiosity-bridge-question');
    const bridgeSub = document.getElementById('curiosity-bridge-sub');
    const bridgeChipsContainer = document.querySelector('.curiosity-preset-chip')?.parentElement;

    if (!bridgeChipsContainer) return;

    if (isPack04) {
      if (bridgeQ) bridgeQ.innerText = '“그런데 나는 무엇을 지키려고 이렇게까지 잘하려고 했을까?”';
      if (bridgeSub) bridgeSub.innerText = '정답을 고르는 검사가 아닙니다. 지금 가장 가까운 표현을 골라도 되고, 직접 써도 됩니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('품질을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">🛡️</span><span>품질</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('존중을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">🤝</span><span>존중</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('유능함을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">⚡</span><span>유능함</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('안전감을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">⚓</span><span>안전감</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('소속감을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">👥</span><span>소속감</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('가치감을 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">💎</span><span>가치감</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('관계를 지키려고 한 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#7C3AED] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">🌱</span><span>관계</span>
        </button>
      `;
    } else {
      if (bridgeQ) bridgeQ.innerText = '“그런데 왜 나는 이 상황에서만 유독 흔들릴까?”';
      if (bridgeSub) bridgeSub.innerText = '같은 행동처럼 보여도 사람마다 지키려는 것은 다를 수 있습니다. 관계일 수도, 존중일 수도, 안전감이나 가치감일 수도 있습니다. 내 경우에는 무엇을 지키려고 이 반응이 시작됐을까요?';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('그런데 내 경우에는 무엇이 가장 먼저 켜질까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#0F6B5B] hover:bg-emerald-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-amber-500">❓</span><span>“내 경우에는 무엇이 먼저 켜질까?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('나는 왜 이 상황에서만 유독 흔들릴까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#0F6B5B] hover:bg-emerald-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-amber-500">❓</span><span>“나는 왜 이 상황에서 유독 흔들릴까?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('이 행동은 무엇을 지키려고 시작됐을까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#0F6B5B] hover:bg-emerald-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-amber-500">❓</span><span>“이 행동은 무엇을 지키려 시작됐을까?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('이 반응이 올라와도 다른 행동을 할 수 있을까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-amber-200 hover:border-[#0F6B5B] hover:bg-emerald-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-amber-500">❓</span><span>“이 반응에도 다른 행동이 가능할까?”</span>
        </button>
      `;
    }
  }

  function renderPack04SpecialInteraction(card) {
    const container = document.getElementById('pack04-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'perfection-approval-comparison-01' && !card.id.startsWith('perf-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');

    if (card.interactionType === 'compare') {
      // 순위에서 방향으로 (비교 전환 인터랙션)
      container.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-slate-50 border-2 border-indigo-200/90 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-indigo-700 font-black text-xs">
              <span>🧭</span>
              <span>순위에서 방향으로 · 비교 전환 인터랙션</span>
            </div>
            <span class="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">방향성 탐색</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            남과의 순위 비교를 내가 진짜 원하는 삶의 방향으로 바꿉니다.
          </p>

          <div class="space-y-2.5">
            <!-- 1단계: 순위 집착 -->
            <div class="p-2.5 rounded-xl bg-white/90 border border-rose-100 text-xs text-rose-950 flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] shrink-0">1단계</span>
              <span class="font-medium line-through text-slate-400">“저 사람보다 내가 앞서 있는가?” (보이지 않는 순위표)</span>
            </div>

            <div class="text-center text-xs text-slate-400 font-black">&darr;</div>

            <!-- 2단계: 내 욕구 찾기 -->
            <div class="p-3 rounded-xl bg-white border border-indigo-200 text-xs shadow-2xs space-y-2">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] shrink-0">2단계</span>
                <span class="font-bold text-slate-800">“저 사람에게 있는 것 중 나는 무엇을 원하는가?”</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <button type="button" onclick="selectDirectionGoal(this, '자유로운 시간')" class="dir-goal-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition">⏰ 자유로운 시간</button>
                <button type="button" onclick="selectDirectionGoal(this, '안정된 경제력')" class="dir-goal-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition">💰 안정된 경제력</button>
                <button type="button" onclick="selectDirectionGoal(this, '전문성 인정')" class="dir-goal-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition">🏆 전문성 인정</button>
                <button type="button" onclick="selectDirectionGoal(this, '내면의 여유')" class="dir-goal-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition">🌿 내면의 여유</button>
              </div>
              <div id="dir-selected-feedback" class="hidden text-[11px] text-indigo-800 font-bold bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">
                💡 <span id="dir-selected-name"></span>을(를) 바라는 마음은 부끄러운 감정이 아니라 내 다음 성장의 훌륭한 나침반입니다.
              </div>
            </div>

            <div class="text-center text-xs text-slate-400 font-black">&darr;</div>

            <!-- 3단계: 오늘의 10% 행동 -->
            <div class="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs">
              <div class="flex items-center gap-1.5 mb-1 text-emerald-800 font-bold">
                <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] shrink-0">3단계</span>
                <span>“그렇다면 내 방향으로 오늘 할 수 있는 10% 행동은?”</span>
              </div>
              <p class="text-slate-800 font-bold text-xs pl-2 border-l-2 border-emerald-500">
                ${card.tenPercentAction}
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // OTHER'S SCORE vs MY STANDARD 미니 인터랙션
      container.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-slate-50 to-indigo-50/70 border-2 border-purple-200/90 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-purple-900 font-black text-xs">
              <span>⚖️</span>
              <span>OTHER'S SCORE vs MY STANDARD (평가 분리)</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">점수화 금지 · 영역 분리</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            타인의 점수표와 내 기준을 분리해봅니다. 타인의 시선은 통제할 수 없지만, 나의 기준은 내가 선택할 수 있습니다.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <!-- 왼쪽: OTHER'S SCORE -->
            <div class="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-black text-slate-500">① OTHER'S SCORE (타인의 평가표)</span>
                <span class="text-[9px] text-slate-400 font-bold">통제 불가</span>
              </div>
              <div class="space-y-1.5">
                <button type="button" onclick="toggleScoreChip(this, 'others')" class="others-score-chip w-full text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                  <span>👥 사람들이 좋아할까?</span>
                  <span class="text-slate-300">○</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'others')" class="others-score-chip w-full text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                  <span>👏 칭찬받을 수 있을까?</span>
                  <span class="text-slate-300">○</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'others')" class="others-score-chip w-full text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                  <span>✨ 나를 선택해줄까?</span>
                  <span class="text-slate-300">○</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'others')" class="others-score-chip w-full text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                  <span>🏆 높게 평가받을까?</span>
                  <span class="text-slate-300">○</span>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 leading-snug">
                * 타인의 반응은 참고할 외부 데이터일 뿐, 내 존재 전체의 점수표가 아닙니다.
              </p>
            </div>

            <!-- 오른쪽: MY STANDARD -->
            <div class="p-3.5 rounded-xl bg-white/90 border-2 border-emerald-300/80 space-y-2.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-black text-emerald-800">② MY STANDARD (나의 내적 기준)</span>
                <span class="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">통제 가능</span>
              </div>
              <div class="space-y-1.5">
                <button type="button" onclick="toggleScoreChip(this, 'my')" class="my-standard-chip w-full text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-[11px] text-emerald-950 font-bold transition flex items-center justify-between">
                  <span>🎯 나는 충분히 준비했나?</span>
                  <span class="text-emerald-500 font-bold">✓</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'my')" class="my-standard-chip w-full text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-[11px] text-emerald-950 font-bold transition flex items-center justify-between">
                  <span>🛡️ 중요하게 여기는 원칙을 지켰나?</span>
                  <span class="text-emerald-500 font-bold">✓</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'my')" class="my-standard-chip w-full text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-[11px] text-emerald-950 font-bold transition flex items-center justify-between">
                  <span>💼 필요한 책임을 다했나?</span>
                  <span class="text-emerald-500 font-bold">✓</span>
                </button>
                <button type="button" onclick="toggleScoreChip(this, 'my')" class="my-standard-chip w-full text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-[11px] text-emerald-950 font-bold transition flex items-center justify-between">
                  <span>🌱 배울 것을 확인했나?</span>
                  <span class="text-emerald-500 font-bold">✓</span>
                </button>
              </div>
              <p class="text-[10px] text-emerald-700 leading-snug">
                * 내가 스스로 확인 가능한 기준에 집중할 때 비로소 자존감이 저장됩니다.
              </p>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-purple-100/60 border border-purple-200 text-center text-[11px] text-purple-900 font-bold">
            💡 “타인의 점수표(OTHER'S SCORE)에 휘둘리지 않고, 내 기준(MY STANDARD)을 확인할 때 성장은 지치지 않습니다.”
          </div>
        </div>
      `;
    }
  }

  window.selectDirectionGoal = function (btn, goalName) {
    document.querySelectorAll('.dir-goal-chip').forEach(b => {
      b.classList.remove('border-indigo-500', 'bg-indigo-100', 'text-indigo-900', 'font-bold');
      b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
    });
    btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700');
    btn.classList.add('border-indigo-500', 'bg-indigo-100', 'text-indigo-900', 'font-bold');

    const fb = document.getElementById('dir-selected-feedback');
    const nameEl = document.getElementById('dir-selected-name');
    if (fb && nameEl) {
      nameEl.innerText = goalName;
      fb.classList.remove('hidden');
    }
    trackMindEvent('perfection_action_select', { type: 'direction_goal', goal: goalName });
  };

  window.toggleScoreChip = function (btn, type) {
    const checkEl = btn.querySelector('span:last-child');
    if (type === 'others') {
      const isSelected = btn.classList.contains('border-rose-400');
      if (isSelected) {
        btn.classList.remove('border-rose-400', 'bg-rose-50', 'font-bold');
        btn.classList.add('border-slate-200', 'bg-slate-50');
        if (checkEl) { checkEl.innerText = '○'; checkEl.classList.remove('text-rose-500', 'font-bold'); checkEl.classList.add('text-slate-300'); }
      } else {
        btn.classList.remove('border-slate-200', 'bg-slate-50');
        btn.classList.add('border-rose-400', 'bg-rose-50', 'font-bold');
        if (checkEl) { checkEl.innerText = '●'; checkEl.classList.remove('text-slate-300'); checkEl.classList.add('text-rose-500', 'font-bold'); }
      }
    } else {
      const isSelected = btn.classList.contains('border-emerald-500');
      if (isSelected) {
        btn.classList.remove('border-emerald-500', 'bg-emerald-100', 'font-bold');
        btn.classList.add('border-emerald-200', 'bg-emerald-50/50');
        if (checkEl) { checkEl.innerText = '○'; checkEl.classList.remove('text-emerald-700'); checkEl.classList.add('text-emerald-400'); }
      } else {
        btn.classList.remove('border-emerald-200', 'bg-emerald-50/50');
        btn.classList.add('border-emerald-500', 'bg-emerald-100', 'font-bold');
        if (checkEl) { checkEl.innerText = '✓'; checkEl.classList.remove('text-emerald-400'); checkEl.classList.add('text-emerald-700', 'font-bold'); }
      }
    }
    trackMindEvent('perfection_action_select', { type: 'score_toggle', domain: type });
  };

  // 12. 요즘 사람들이 많이 마주하는 질문 (관계·불안 PACK 01 대표 6선 캐러셀)
  // =================================================================
  const FEATURED_RELATIONSHIP_IDS = [
    'rel-001', // 답장 대기 모드
    'rel-004', // 좋은 사람 모드
    'rel-005', // 과잉설명 모드
    'rel-002', // 마음읽기 모드 (표정 읽기)
    'rel-016', // 경계 후 죄책감
    'rel-019'  // 자기비난 모드
  ];

  function renderPopularQuestions() {
    const carousel = document.getElementById('popular-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    // 1. 관계·불안 명심카드 대표 6개 최우선 배치 (지정된 순서 엄수)
    const relFeatured = [];
    FEATURED_RELATIONSHIP_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) relFeatured.push(card);
    });

    // 2. 추가 추천 카드 (그 외 featured)
    const otherFeatured = cardsData.filter(c => 
      (c.isFeatured || c.featured) && !FEATURED_RELATIONSHIP_IDS.includes(c.id)
    );

    // 3. 인기순 정렬된 추가 카드
    const remaining = cardsData.filter(c => 
      !c.isFeatured && !c.featured && !FEATURED_RELATIONSHIP_IDS.includes(c.id)
    ).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const curated = [...relFeatured, ...otherFeatured, ...remaining].slice(0, 12);

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
  // 12-1. 돈 문제 앞에서 나는 어떤 모드가 켜질까? (돈·사업 PACK 02 캐러셀)
  // =================================================================
  const FEATURED_MONEY_IDS = [
    'money-002', // 손실 만회 모드
    'money-003', // 사업실패 정체성
    'money-005', // 가격 낮추기 모드
    'money-008', // 빚 수치심
    'money-014', // 매출과 자기 가치
    'money-020'  // 다시 시작 공포
  ];

  function renderMoneyQuestions() {
    const carousel = document.getElementById('money-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    // 1. 돈·사업 명심카드 대표 6개 최우선 배치 (지정된 순서 엄수)
    const moneyFeatured = [];
    FEATURED_MONEY_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) moneyFeatured.push(card);
    });

    // 2. 추가 돈·사업 카드
    const otherMoney = cardsData.filter(c => 
      c.packId === 'money-business-01' && !FEATURED_MONEY_IDS.includes(c.id)
    );

    const list = [...moneyFeatured, ...otherMoney].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#C7A86B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#C7A86B]/15 text-[#9E7B3B] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#9E7B3B] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#C7A86B]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }


  // =================================================================
  // 12-2. 직장·성과·번아웃 PACK 03 캐러셀
  // =================================================================
  const FEATURED_CAREER_IDS = [
    'career-001', // 출근 전 방전 모드
    'career-002', // 퇴사 충동 모드
    'career-006', // 실수 재판 모드
    'career-014', // 퇴근 후 업무 모드
    'career-018', // 바로 YES 모드
    'career-016'  // 번아웃 자기비난 모드
  ];

  function renderCareerQuestions() {
    const carousel = document.getElementById('career-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const careerFeatured = [];
    FEATURED_CAREER_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) careerFeatured.push(card);
    });

    const otherCareer = cardsData.filter(c => 
      c.packId === 'career-burnout-01' && !FEATURED_CAREER_IDS.includes(c.id)
    );

    const list = [...careerFeatured, ...otherCareer].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#0284C7]/10 text-[#0284C7] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0284C7] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#0284C7]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }


  // =================================================================
  // 12-3. 완벽주의·인정·비교 PACK 04 캐러셀
  // =================================================================
  const FEATURED_PERFECTION_IDS = [
    'perf-001', // 끝없는 수정 모드
    'perf-005', // 칭찬 충전 모드
    'perf-008', // 보이지 않는 순위표
    'perf-010', // 친구가 경쟁자 모드
    'perf-011', // 목표선 이동 모드
    'perf-018'  // 자기검사 모드
  ];

  function renderPerfectionQuestions() {
    const carousel = document.getElementById('perfection-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const perfectionFeatured = [];
    FEATURED_PERFECTION_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) perfectionFeatured.push(card);
    });

    const otherPerfection = cardsData.filter(c => 
      c.packId === 'perfection-approval-comparison-01' && !FEATURED_PERFECTION_IDS.includes(c.id)
    );

    const list = [...perfectionFeatured, ...otherPerfection].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#7C3AED] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#7C3AED]">사이다 답변 확인 &rarr;</span>
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
      const terms = query.split(/\s+/).filter(t => t.length >= 2);
      const scored = [];

      cardsData.forEach(c => {
        const kws = Array.isArray(c.searchKeywords) ? c.searchKeywords.map(k => (k || '').toLowerCase()) : [];
        const qText = (c.question || '').toLowerCase();
        const titleText = (c.cardTitle || '').toLowerCase();
        const kwText = (c.keyword || '').toLowerCase();
        const answerText = (c.sodaAnswer || '').toLowerCase();
        const catText = (c.category || '').toLowerCase();

        let score = 0;

        // 정확도 가중치 부여
        if (kws.some(k => k === query || k.includes(query) || query.includes(k))) score += 100;
        if (qText.includes(query)) score += 80;
        if (titleText.includes(query)) score += 60;
        if (kwText.includes(query)) score += 40;

        // 부분 단어(2글자 이상) 매칭
        if (terms.length > 0) {
          terms.forEach(t => {
            if (kws.some(k => k.includes(t))) score += 30;
            if (qText.includes(t)) score += 20;
            if (titleText.includes(t)) score += 15;
            if (answerText.includes(t)) score += 10;
            if (catText.includes(t)) score += 5;
          });
        }

        if (score > 0) {
          scored.push({ card: c, score });
        }
      });

      scored.sort((a, b) => b.score - a.score);
      matched = scored.map(item => item.card).slice(0, 4);
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
