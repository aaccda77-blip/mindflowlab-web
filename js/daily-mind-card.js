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
          PUBLISHER_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
          DARK_CODE_BOOK_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%8B%A4%ED%81%AC%EC%BD%94%EB%93%9C+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
          NEURAL_CODE_BOOK_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%89%B4%EB%9F%B4%EC%BD%94%EB%93%9C+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
          ZERO_POINT_BOOK_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=ZERO+POINT+%EC%9D%B4%EA%B2%BD%EC%9C%A4+%EC%B2%AD%EB%A5%98',
          BELIEF_BOOK_URL: 'https://www.yes24.com/product/goods/196550353'
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
      return cfg.DARK_CODE_URL || cfg.DARK_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4';
    } else if (bookTitle.includes('뉴럴')) {
      return cfg.NEURAL_CODE_URL || cfg.NEURAL_CODE_BOOK_URL || cfg.PUBLISHER_URL || 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4';
    } else if (bookTitle.includes('제로')) {
      return cfg.ZERO_POINT_URL || cfg.ZERO_POINT_BOOK_URL || cfg.PUBLISHER_URL || 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4';
    } else if (bookTitle.includes('믿는다') || bookTitle.includes('갇히지')) {
      return cfg.BELIEF_BOOK_URL || 'https://www.yes24.com/product/goods/196550353';
    }
    return cfg.PUBLISHER_URL || 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4';
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
    trackMindEvent('family_pack_view', { packId: 'family-boundary-01', source: 'home_load' });
    trackMindEvent('love_pack_view', { packId: 'love-relationship-01', source: 'home_load' });
    trackMindEvent('decision_pack_view', { packId: 'decision-action-01', source: 'home_load' });
    trackMindEvent('emotion_pack_view', { packId: 'emotion-recovery-01', source: 'home_load' });
    trackMindEvent('belief_pack_view', { packId: 'belief-fate-uncertainty-01', source: 'home_load' });
    renderPopularQuestions();
    renderMoneyQuestions();
    renderCareerQuestions();
    renderPerfectionQuestions();
    renderFamilyQuestions();
    renderLoveQuestions();
    renderDecisionQuestions();
    renderEmotionQuestions();
    renderBeliefQuestions();
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
    // 부모·가족·독립 명심카드 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('family_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 결정·미루기·습관·행동 PACK 07 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'decision-action-01' || (currentCard.id && currentCard.id.startsWith('dec-')))) {
      trackMindEvent('decision_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('decision_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 자책·불안·감정회복 PACK 08 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'emotion-recovery-01' || (currentCard.id && currentCard.id.startsWith('emo-')))) {
      trackMindEvent('emotion_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('emotion_card_reveal', { cardId: currentCard.id, category: currentCard.category });
    }
    // 사주·삼재·운명·선택 PACK 09 전용 분석 이벤트
    if (currentCard && (currentCard.packId === 'belief-fate-uncertainty-01' || (currentCard.id && currentCard.id.startsWith('fate-')))) {
      trackMindEvent('belief_card_open', { cardId: currentCard.id, category: currentCard.category });
      trackMindEvent('belief_card_reveal', { cardId: currentCard.id, category: currentCard.category });
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
      PUBLISHER_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
      DARK_CODE_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%8B%A4%ED%81%AC%EC%BD%94%EB%93%9C+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
      NEURAL_CODE_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=%EB%89%B4%EB%9F%B4%EC%BD%94%EB%93%9C+%EC%9D%B4%EA%B2%BD%EC%9C%A4',
      ZERO_POINT_URL: 'https://www.yes24.com/Product/Search?domain=BOOK&query=ZERO+POINT+%EC%9D%B4%EA%B2%BD%EC%9C%A4+%EC%B2%AD%EB%A5%98',
      BELIEF_BOOK_URL: 'https://www.yes24.com/product/goods/196550353'
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

    // PACK 04, 05, 07, 08, 09 전용 Curiosity Bridge 및 특수 인터랙션 분기
    updatePackCuriosityBridge(card);
    renderPack04SpecialInteraction(card);
    renderPack05SpecialInteraction(card);
    renderPack06SpecialInteraction(card);
    renderPack07SpecialInteraction(card);
    renderPack08SpecialInteraction(card);
    renderPack09SpecialInteraction(card);

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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_app_click', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'love-relationship-01' || (currentCard.id && currentCard.id.startsWith('love-')))) {
      trackMindEvent('love_app_click', { source: source || 'app_cta', cardId: currentCard.id });
      trackMindEvent('app_cta_clicked', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'decision-action-01' || (currentCard.id && currentCard.id.startsWith('dec-')))) {
      trackMindEvent('decision_app_click', { source: source || 'app_cta', cardId: currentCard.id });
      trackMindEvent('app_cta_clicked', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'emotion-recovery-01' || (currentCard.id && currentCard.id.startsWith('emo-')))) {
      trackMindEvent('emotion_app_click', { source: source || 'app_cta', cardId: currentCard.id });
      trackMindEvent('app_cta_clicked', { source: source || 'app_cta', cardId: currentCard.id });
    }
    if (currentCard && (currentCard.packId === 'belief-fate-uncertainty-01' || (currentCard.id && currentCard.id.startsWith('fate-')))) {
      trackMindEvent('belief_app_click', { source: source || 'app_cta', cardId: currentCard.id });
      trackMindEvent('app_cta_clicked', { source: source || 'app_cta', cardId: currentCard.id });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'love-relationship-01' || (currentCard.id && currentCard.id.startsWith('love-')))) {
      trackMindEvent('love_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
      trackMindEvent('book_cta_clicked', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'decision-action-01' || (currentCard.id && currentCard.id.startsWith('dec-')))) {
      trackMindEvent('decision_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
      trackMindEvent('book_cta_clicked', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'emotion-recovery-01' || (currentCard.id && currentCard.id.startsWith('emo-')))) {
      trackMindEvent('emotion_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
      trackMindEvent('book_cta_clicked', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
    }
    if (currentCard && (currentCard.packId === 'belief-fate-uncertainty-01' || (currentCard.id && currentCard.id.startsWith('fate-')))) {
      trackMindEvent('belief_book_click', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
      trackMindEvent('book_cta_clicked', { source: source || 'book_cta', cardId: currentCard.id, book: currentCard.relatedBook });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
    }
    if (currentCard && (currentCard.packId === 'love-relationship-01' || (currentCard.id && currentCard.id.startsWith('love-')))) {
      trackMindEvent('love_scan_start', { cardId: currentCard.id, category: currentCard.category, step: 'curiosity' });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'body' });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_scan_start', { cardId: currentCard.id, category: currentCard.category, scanType: 'impulse' });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_scan_complete', { cardId: currentCard.id, category: currentCard.category });
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
    if (currentCard && (currentCard.packId === 'family-boundary-01' || (currentCard.id && currentCard.id.startsWith('fam-')))) {
      trackMindEvent('family_action_select', { cardId: currentCard.id, category: currentCard.category });
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
    const isPack05 = card && (card.packId === 'family-boundary-01' || (card.id && card.id.startsWith('fam-')));
    const isPack06 = card && (card.packId === 'love-relationship-01' || (card.id && card.id.startsWith('love-')));
    const isPack07 = card && (card.packId === 'decision-action-01' || (card.id && card.id.startsWith('dec-')));
    const isPack08 = card && (card.packId === 'emotion-recovery-01' || (card.id && card.id.startsWith('emo-')));
    const isPack09 = card && (card.packId === 'belief-fate-uncertainty-01' || (card.id && card.id.startsWith('fate-')));
    const bridgeQ = document.getElementById('curiosity-bridge-question');
    const bridgeSub = document.getElementById('curiosity-bridge-sub');
    const bridgeChipsContainer = document.querySelector('.curiosity-preset-chip')?.parentElement;

    if (!bridgeChipsContainer) return;

    if (isPack08) {
      if (bridgeQ) bridgeQ.innerText = '“감정을 없애려고 애쓰는 대신, 지금 몸의 신호와 충동을 알아차린다면?”';
      if (bridgeSub) bridgeSub.innerText = '감정은 통제의 대상이 아닌 알아차림의 신호입니다. 두 번째 화살(자기비난)을 멈추고 안전한 회복 지점을 찾아봅니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('실수는 아프지만 자책은 멈출 수 있다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-teal-200 hover:border-[#0D9488] hover:bg-teal-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-teal-600">🛡️</span><span>“실수는 아프지만 자책은 멈추기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('지금 올라온 감정에 이름표를 붙여본다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-teal-200 hover:border-[#0D9488] hover:bg-teal-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-teal-600">🏷️</span><span>“감정에 진짜 이름표 붙이기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('내 몸이 가장 먼저 보내는 신호는 무엇일까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-teal-200 hover:border-[#0D9488] hover:bg-teal-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-teal-600">💓</span><span>“몸이 먼저 보내는 신호 읽기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('자책 대신 지금 할 수 있는 작은 복구는?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-teal-200 hover:border-[#0D9488] hover:bg-teal-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-teal-600">🌱</span><span>“자책 대신 작은 복구(REPAIR)”</span>
        </button>
      `;
      return;
    }

    if (isPack09) {
      if (bridgeQ) bridgeQ.innerText = '“믿음에는 발언권을 주되, 오늘 내 행동의 결재권은 누가 가지고 있는가?”';
      if (bridgeSub) bridgeSub.innerText = '사주나 믿음을 조롱하지도, 맹신하지도 않습니다. 불확실성을 UNKNOWN으로 남겨두고 오늘 내 선택권을 확인합니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('믿음과 실제로 확인된 FACT를 나눈다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-purple-200 hover:border-[#8B5CF6] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">⚖️</span><span>“믿음과 현실 FACT 분리하기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('사주는 자문위원일 뿐 최종 결재권자는 나?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-purple-200 hover:border-[#8B5CF6] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">👑</span><span>“발언권은 주되 결재권은 내가”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('모르는 것이 남아 있어도 오늘 10% 선택은?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-purple-200 hover:border-[#8B5CF6] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">🧭</span><span>“UNKNOWN 남기고 오늘 10% 선택”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('운명이라는 정체성을 구체적 작동으로 본다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-purple-200 hover:border-[#8B5CF6] hover:bg-purple-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-purple-600">🔄</span><span>“정체성 문장 → 작동 문장”</span>
        </button>
      `;
      return;
    }

    if (isPack07) {
      if (bridgeQ) bridgeQ.innerText = '“확신은 없지만, 시험해볼 만큼은 준비되었을까?”';
      if (bridgeSub) bridgeSub.innerText = '완벽한 확신을 기다리기보다, 다음 장면에서 작게 실험해볼 10% 지점을 찾아봅니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('새 정보가 없다면 결정을 다시 재판하지 않는다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-indigo-200 hover:border-[#4F46E5] hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-indigo-600">⚖️</span><span>“새 정보 없으면 재판 멈추기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('완벽한 확신 대신 5분짜리 작은 테스트를 해본다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-indigo-200 hover:border-[#4F46E5] hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-indigo-600">⏱️</span><span>“5분짜리 마이크로 테스트”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('시작이 평가받는 순간이 아니라 착수만 목표로 한다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-indigo-200 hover:border-[#4F46E5] hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-indigo-600">🚀</span><span>“완료 아닌 착수만 목표로”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('‘의지 부족’이 아니라 ‘이 조건에서 중단됐다’로 본다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-indigo-200 hover:border-[#4F46E5] hover:bg-indigo-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-indigo-600">🔄</span><span>“시스템 데이터로 보기”</span>
        </button>
      `;
    } else if (isPack06) {
      if (bridgeQ) bridgeQ.innerText = '“사랑의 미래를 맞히기보다, 지금 이 관계에서 확인된 사실과 내 반응을 나눈다면?”';
      if (bridgeSub) bridgeSub.innerText = '상대나 당신을 ‘불안형’, ‘회피형’으로 규정하지 않습니다. 지금 어떤 장면에서 어떤 STORY와 확인 충동이 켜졌는지 살펴봅니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('답장이 늦는 사실과 내가 쓴 소설을 분리한다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#F43F5E] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">🔍</span><span>“사실(FACT)과 내 상상(STORY) 분리”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('떠보기 대신 직접 맑게 물어볼 수 있을까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#F43F5E] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">💬</span><span>“떠보기 대신 맑게 한 문장 질문”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('불안할 때 휴대폰 확인을 30분 늦춘다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#F43F5E] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">⏱️</span><span>“확인 충동 30분 미루기”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('상대의 반응과 내 온전함을 별개로 본다면?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#F43F5E] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">🛡️</span><span>“상대 감정과 내 존엄 분리하기”</span>
        </button>
      `;
    } else if (isPack05) {
      if (bridgeQ) bridgeQ.innerText = '“가족 안에서 나는 무엇을 지키려다 내 경계를 잃어버렸을까?”';
      if (bridgeSub) bridgeSub.innerText = '정답을 고르는 검사가 아닙니다. 가족 관계에서 가장 먼저 켜지는 내 마음의 브레이크를 살펴봅니다.';
      bridgeChipsContainer.innerHTML = `
        <button type="button" onclick="selectCuriosityQuestion('거절하면 부모님이 상처받을까 봐 두려웠던 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#E11D48] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">💔</span><span>“거절하면 상처받을까 봐?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('인정받지 못하면 내 존재가 부정당할 것 같았을까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#E11D48] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">🏆</span><span>“인정받지 못하면 부정당할까 봐?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('가족의 불행이 다 내 탓처럼 느껴졌던 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#E11D48] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">🌧️</span><span>“가족의 불행이 다 내 탓 같아서?”</span>
        </button>
        <button type="button" onclick="selectCuriosityQuestion('경계를 그으면 나쁜 자식이 될까 봐 무서웠던 걸까?')" class="curiosity-preset-chip text-left p-2 rounded-xl bg-white/90 border border-rose-200 hover:border-[#E11D48] hover:bg-rose-50 text-[11px] font-medium text-slate-700 transition cursor-pointer flex items-center gap-1">
          <span class="text-rose-500">🛡️</span><span>“경계를 그으면 나쁜 자식 될까 봐?”</span>
        </button>
      `;
    } else if (isPack04) {
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


  // =================================================================
  // 11-2. PACK 05 전용 미니 인터랙션 렌더러 (책임 장부 / 경계 vs 통제 / 사랑 AND 경계 / 위기 안전망)
  // =================================================================
  function renderPack05SpecialInteraction(card) {
    const container = document.getElementById('pack05-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'family-boundary-01' && !card.id.startsWith('fam-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');

    const isSafetyAlert = card.interactionType === 'safety_route' || card.id === 'fam-006' || card.id === 'fam-019';
    let safetyHtml = '';
    if (isSafetyAlert) {
      trackMindEvent('safety_route_view', { cardId: card.id });
      safetyHtml = `
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-red-50 to-amber-50 border-2 border-rose-300 text-slate-800 space-y-2 mb-3 shadow-2xs">
          <div class="flex items-center gap-2 text-rose-700 font-black text-xs">
            <span class="text-sm">🚨</span>
            <span>긴급 안내 · 심리적 조언보다 신체적·법적 안전이 최우선입니다</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            지속적인 폭력, 폭언, 심각한 통제나 착취는 마음가짐으로 인내할 문제가 아닙니다. 안전한 물리적 거리와 전문 기관의 보호가 가장 먼저 필요합니다.
          </p>
          <div class="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
            <a href="tel:1366" class="px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1">
              <span>📞 여성긴급전화 1366</span>
            </a>
            <a href="tel:112" class="px-2.5 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition flex items-center gap-1">
              <span>👮 경찰청 112</span>
            </a>
            <a href="tel:132" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1">
              <span>⚖️ 대한법률구조공단 132</span>
            </a>
          </div>
        </div>
      `;
    }

    if (card.interactionType === 'boundary_vs_control') {
      // INTERACTION 2: BOUNDARY vs CONTROL
      container.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-amber-50/60 border-2 border-rose-200 shadow-xs space-y-3.5">
          ${safetyHtml}
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-1.5 text-rose-700 font-black text-xs">
              <span>⚖️</span>
              <span>경계인가, 통제인가? (BOUNDARY vs CONTROL)</span>
            </div>
            <span class="text-[9px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">행동 한계선</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            통제는 상대를 바꾸려 하고, 경계는 내가 무엇을 할지 결정합니다. 상대의 반응 대신 나의 행동 선을 정해봅니다.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <!-- 통제 시도 -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 opacity-80">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-500">❌ 통제 (상대에게 향함)</span>
                <span class="text-[9px] text-slate-400 font-bold">통제 불가</span>
              </div>
              <p class="text-[11px] text-slate-600 line-through">“부모님이 간섭하지 않게 설득해야 해”</p>
              <p class="text-[11px] text-slate-600 line-through">“부모님이 내 결정에 서운해하지 말아야 해”</p>
              <span class="text-[9px] text-slate-400 block pt-1">* 상대의 감정과 반응은 내가 통제할 수 없어 만성 피로를 낳습니다.</span>
            </div>

            <!-- 건강한 경계 -->
            <div class="p-3 rounded-xl bg-rose-50/60 border-2 border-rose-300 text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-rose-800">⭕ 건강한 경계 (나에게 향함)</span>
                <span class="text-[9px] text-rose-700 font-bold bg-white px-1.5 py-0.5 rounded">통제 가능</span>
              </div>
              <p class="text-[11px] text-slate-800 font-bold">“간섭이 길어지면 '제가 결정할게요' 하고 전화를 마친다”</p>
              <p class="text-[11px] text-slate-800 font-bold">“서운해하셔도 내 한계를 넘는 부탁은 정중히 거절한다”</p>
              <span class="text-[9px] text-rose-600 block pt-1">* 내가 할 수 있는 행동의 기준을 세울 때 비로소 평화가 찾아옵니다.</span>
            </div>
          </div>

          <!-- 인터랙티브 경계 선택기 -->
          <div class="p-3 rounded-xl bg-white border border-rose-200 text-xs space-y-2">
            <span class="text-[11px] font-bold text-slate-800 block">🎯 내가 선택할 수 있는 경계 행동 하나 터치하기:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button type="button" onclick="selectBoundaryAction(this, '화를 내시거나 비난하시면 조용히 전화를 마무리하겠습니다.')" class="boundary-chip text-left p-2 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] text-slate-700 transition">
                🚪 “비난이 시작되면 조용히 전화를 마친다”
              </button>
              <button type="button" onclick="selectBoundaryAction(this, '사생활 질문에는 단답 후 다른 일상 화제로 전환합니다.')" class="boundary-chip text-left p-2 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] text-slate-700 transition">
                🧭 “사생활 질문에는 단답 후 화제를 돌린다”
              </button>
              <button type="button" onclick="selectBoundaryAction(this, '통화 시간은 10분 이내로 내가 먼저 알람을 맞춥니다.')" class="boundary-chip text-left p-2 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] text-slate-700 transition">
                ⏱️ “통화 시간은 10분으로 내가 먼저 제한한다”
              </button>
              <button type="button" onclick="selectBoundaryAction(this, '서운해하셔도 사과는 요구하지 않고 내 결정을 지킵니다.')" class="boundary-chip text-left p-2 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] text-slate-700 transition">
                🛡️ “상대의 사과를 기다리지 않고 내 삶에 집중한다”
              </button>
            </div>
            <div id="boundary-selected-feedback" class="hidden text-[11px] text-rose-800 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              💡 <span id="boundary-selected-text"></span>
            </div>
          </div>
        </div>
      `;
    } else if (card.interactionType === 'love_and_boundary') {
      // INTERACTION 3: LOVE AND BOUNDARY
      container.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-rose-50/70 border-2 border-emerald-200/90 shadow-xs space-y-3.5">
          ${safetyHtml}
          <div class="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div class="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
              <span>🌱</span>
              <span>사랑 AND 경계 · 이분법 탈피 인터랙션</span>
            </div>
            <span class="text-[9px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">균형 감각</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            가족을 사랑하는 것과 경계를 두는 것은 반대말이 아닙니다. 지치지 않고 오래 관계를 이어가기 위해 건강한 울타리를 둡니다.
          </p>

          <div class="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2 shadow-2xs">
            <span class="text-[11px] font-bold text-slate-800 block">🌿 나의 마음에 맞는 균형 문장 완성하기:</span>
            <div class="space-y-1.5">
              <button type="button" onclick="selectAffirmationAction(this, '부모님을 사랑하지만, 내 삶의 선택권은 내가 책임집니다.')" class="affirm-chip w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                <span>“가족을 아끼지만, 내 삶의 선택권은 내가 지킵니다.”</span>
                <span class="text-slate-300">○</span>
              </button>
              <button type="button" onclick="selectAffirmationAction(this, '부모님의 기대에 부응하지 않아도, 나는 충분히 가치 있는 존재입니다.')" class="affirm-chip w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                <span>“부모님의 기대를 채우지 못해도, 나는 존중받을 자격이 있습니다.”</span>
                <span class="text-slate-300">○</span>
              </button>
              <button type="button" onclick="selectAffirmationAction(this, '가족을 돕되, 내 재정과 건강이 무너지지 않는 선까지만 돕습니다.')" class="affirm-chip w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] text-slate-700 transition flex items-center justify-between">
                <span>“가족을 돕되, 내 재정과 건강을 해치지 않는 선까지만 합니다.”</span>
                <span class="text-slate-300">○</span>
              </button>
            </div>
            <div id="affirm-selected-feedback" class="hidden text-[11px] text-emerald-900 font-bold bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
              💚 <span id="affirm-selected-text"></span>
            </div>
          </div>
        </div>
      `;
    } else {
      // INTERACTION 1 (DEFAULT): RESPONSIBILITY LEDGER (책임 장부)
      container.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-slate-50 to-indigo-50/60 border-2 border-rose-200/90 shadow-xs space-y-3.5">
          ${safetyHtml}
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-1.5 text-rose-800 font-black text-xs">
              <span>📋</span>
              <span>이 짐은 누구의 것인가? · 책임 장부 (Responsibility Ledger)</span>
            </div>
            <span class="text-[9px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">4대 영역 분리</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            가족이라는 이유로 상대방의 감정과 인생까지 짊어질 필요는 없습니다. 짐의 주인을 나누어 봅니다.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <!-- 1. 내 책임 -->
            <div class="p-3 rounded-xl bg-white border-2 border-emerald-300 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-emerald-800">① 내 책임 (통제 가능 ⭕)</span>
                <span class="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">내 몫</span>
              </div>
              <ul class="text-[10px] text-slate-600 space-y-1 pl-1">
                <li>• 나의 솔직한 말과 공손한 태도</li>
                <li>• 내 삶의 선택과 진로·결혼 결정</li>
                <li>• 내 신체 건강과 마음 안정 돌보기</li>
              </ul>
            </div>

            <!-- 2. 가족 공동 책임 -->
            <div class="p-3 rounded-xl bg-white border border-indigo-200 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-indigo-800">② 가족 공동 책임 (협의 🤝)</span>
                <span class="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">합의 필요</span>
              </div>
              <ul class="text-[10px] text-slate-600 space-y-1 pl-1">
                <li>• 명절·행사 방문 일정 조율</li>
                <li>• 부모님 부양에 대한 현실적 대화</li>
                <li>• 비상 연락망 및 안전 확인</li>
              </ul>
            </div>

            <!-- 3. 상대방의 책임 -->
            <div class="p-3 rounded-xl bg-white border-2 border-rose-300 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-rose-800">③ 상대방의 책임 (통제 불가 ❌)</span>
                <span class="text-[9px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">부모님 몫</span>
              </div>
              <ul class="text-[10px] text-slate-600 space-y-1 pl-1">
                <li>• 거절당했을 때 부모님의 서운함과 분노</li>
                <li>• 부모님 본인의 인생 행복과 만족감</li>
                <li>• 부모님의 선택과 생활 습관</li>
              </ul>
            </div>

            <!-- 4. 통제할 수 없는 영역 -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-500">④ 통제 불가능한 영역 (거리두기 ⚓)</span>
                <span class="text-[9px] text-slate-400 font-bold">수용/단절</span>
              </div>
              <ul class="text-[10px] text-slate-600 space-y-1 pl-1">
                <li>• 부모님의 오랜 성격과 성향</li>
                <li>• 어린 시절 지나간 양육 방식</li>
                <li>• 내 경계를 상대가 이해해줄지 여부</li>
              </ul>
            </div>
          </div>

          <!-- 터치 확인 칩 -->
          <div class="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
            <span class="text-[10px] font-bold text-rose-900 block">💡 내가 대신 짊어지려 했던 상대방의 짐 터치해보기:</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button type="button" onclick="selectLedgerItem(this, '부모님의 서운함')" class="ledger-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-[11px] font-medium text-slate-700 transition">부모님의 서운함</button>
              <button type="button" onclick="selectLedgerItem(this, '가족의 경제적 문제')" class="ledger-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-[11px] font-medium text-slate-700 transition">가족의 빚/경제</button>
              <button type="button" onclick="selectLedgerItem(this, '부모님의 노후 만족')" class="ledger-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-[11px] font-medium text-slate-700 transition">부모님의 노후만족</button>
              <button type="button" onclick="selectLedgerItem(this, '가족 갈등 해결')" class="ledger-chip py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-[11px] font-medium text-slate-700 transition">가족 갈등 중재</button>
            </div>
            <div id="ledger-feedback-box" class="hidden text-[11px] text-rose-950 font-bold bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs">
              ✨ <span id="ledger-feedback-text"></span>
            </div>
          </div>
        </div>
      `;
    }
  }

  window.selectLedgerItem = function (btn, itemName) {
    document.querySelectorAll('.ledger-chip').forEach(b => {
      b.classList.remove('border-rose-500', 'bg-rose-100', 'text-rose-900', 'font-bold');
      b.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
    });
    btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
    btn.classList.add('border-rose-500', 'bg-rose-100', 'text-rose-900', 'font-bold');

    const fbBox = document.getElementById('ledger-feedback-box');
    const fbText = document.getElementById('ledger-feedback-text');
    if (fbBox && fbText) {
      fbText.innerText = `'${itemName}'은(는) 부모님 본인이 다루어야 할 고유한 삶의 몫입니다. 자식이 대신 해결해 줄 수 없음을 인정할 때, 진정한 성인 대 성인의 존중이 시작됩니다.`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('family_action_select', { type: 'ledger_select', item: itemName });
  };

  window.selectBoundaryAction = function (btn, actionText) {
    document.querySelectorAll('.boundary-chip').forEach(b => {
      b.classList.remove('border-rose-500', 'bg-rose-100', 'text-rose-900', 'font-bold');
      b.classList.add('border-slate-200', 'text-slate-700');
    });
    btn.classList.remove('border-slate-200', 'text-slate-700');
    btn.classList.add('border-rose-500', 'bg-rose-100', 'text-rose-900', 'font-bold');

    const fbBox = document.getElementById('boundary-selected-feedback');
    const fbText = document.getElementById('boundary-selected-text');
    if (fbBox && fbText) {
      fbText.innerText = `“${actionText}” — 상대를 비난하거나 바꾸려 하지 않고, 내가 지킬 수 있는 명확한 행동 선을 세웠습니다.`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('family_action_select', { type: 'boundary_select', action: actionText });
  };

  window.selectAffirmationAction = function (btn, affirmText) {
    document.querySelectorAll('.affirm-chip').forEach(b => {
      b.classList.remove('border-emerald-500', 'bg-emerald-50', 'font-bold');
      b.classList.add('border-slate-200');
      const dot = b.querySelector('span:last-child');
      if (dot) { dot.innerText = '○'; dot.classList.remove('text-emerald-600', 'font-bold'); dot.classList.add('text-slate-300'); }
    });
    btn.classList.remove('border-slate-200');
    btn.classList.add('border-emerald-500', 'bg-emerald-50', 'font-bold');
    const dot = btn.querySelector('span:last-child');
    if (dot) { dot.innerText = '✓'; dot.classList.remove('text-slate-300'); dot.classList.add('text-emerald-600', 'font-bold'); }

    const fbBox = document.getElementById('affirm-selected-feedback');
    const fbText = document.getElementById('affirm-selected-text');
    if (fbBox && fbText) {
      fbText.innerText = `${affirmText} — 거절은 배신이 아니라 건강한 독립의 시작입니다.`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('family_action_select', { type: 'affirmation_select', text: affirmText });
  };


  // =================================================================
  // 11-2B. PACK 06 전용 3대 연애·친밀감 인터랙션 렌더러
  // ① 30-SECOND LOVE FACT CHECK (사실 vs 소설 vs 모르는 것)
  // ② FUTURE PREDICTION → CURRENT DATA (미래예측 → 현재데이터, 점수/확률 없음)
  // ③ INTIMACY AUTO → MANUAL (친밀감 자동반응 → 수동조율)
  // + DATING SAFETY ROUTE (데이트 폭력·스토킹 긴급 안전망)
  // =================================================================
  window.currentPack06Tool = null;

  window.switchPack06Tool = function (toolName) {
    window.currentPack06Tool = toolName;
    trackMindEvent('love_tool_tab_switch', { tool: toolName });
    if (currentCard) {
      renderPack06SpecialInteraction(currentCard, toolName);
    }
  };

  const LOVE_FACT_PRESETS = {
    'msg_delay': {
      fact: '답장이 3시간 동안 도착하지 않았다.',
      story: '마음이 식었거나 나를 귀찮아하고 있다. 날 만만하게 본다.',
      unknown: '지금 회의 중인지, 아픈지, 휴대폰을 못 보는 상황인지 모른다.'
    },
    'meet_postpone': {
      fact: '상대가 오늘 일정을 다음 주로 미루자고 메시지를 보냈다.',
      story: '나를 만나는 게 귀찮아졌거나 우선순위에서 밀려났다.',
      unknown: '상대의 실제 체력, 업무 강도, 가족 사정이 어떤지 모른다.'
    },
    'short_reply': {
      fact: '상대의 답장이 "응", "ㅇㅇ"으로 짧게 왔다.',
      story: '나한테 삐쳤거나 서운한 게 있다. 정이 떨어졌다.',
      unknown: '상대가 지금 이동 중인지, 단순히 바쁜 상황인지 모른다.'
    },
    'sns_active': {
      fact: 'SNS에는 10분 전 게시물이 올라왔는데 내 카톡은 1시간째 읽지 않았다.',
      story: '의도적으로 내 연락을 피하고 무시하고 있다.',
      unknown: '어떤 상황에서 SNS를 봤는지, 메시지에 정성껏 답하려고 아껴둔 건지 모른다.'
    }
  };

  window.selectLoveFactPreset = function (presetKey) {
    const data = LOVE_FACT_PRESETS[presetKey];
    if (!data) return;
    trackMindEvent('love_fact_preset_select', { preset: presetKey });

    const fEl = document.getElementById('love-fact-display');
    const sEl = document.getElementById('love-story-display');
    const uEl = document.getElementById('love-unknown-display');
    if (fEl) fEl.innerText = data.fact;
    if (sEl) sEl.innerText = data.story;
    if (uEl) uEl.innerText = data.unknown;

    document.querySelectorAll('.love-fact-chip').forEach(btn => {
      btn.classList.remove('border-[#F43F5E]', 'bg-rose-50', 'text-[#F43F5E]', 'font-bold');
      btn.classList.add('border-rose-200', 'bg-white', 'text-slate-700');
    });
    if (event && event.currentTarget) {
      event.currentTarget.classList.remove('border-rose-200', 'bg-white', 'text-slate-700');
      event.currentTarget.classList.add('border-[#F43F5E]', 'bg-rose-50', 'text-[#F43F5E]', 'font-bold');
    }
  };

  window.triggerLoveFactComplete = function () {
    const fb = document.getElementById('love-fact-feedback');
    if (fb) fb.classList.remove('hidden');
    trackMindEvent('love_fact_complete', { cardId: currentCard ? currentCard.id : null });
  };

  window.toggleLoveDataCheck = function (checkbox) {
    trackMindEvent('love_data_check', { checked: checkbox.checked, cardId: currentCard ? currentCard.id : null });
    const fb = document.getElementById('love-data-feedback');
    if (fb) {
      fb.innerHTML = '✨ <strong>관찰 완료:</strong> 미래를 점치지 않고 사실에 집중할 때, 불안한 상상 대신 건강한 소통이 가능해집니다.';
    }
  };

  const LOVE_MANUAL_ACTIONS = {
    'distance': '🏃 잠수나 회피 대신: "지금은 혼자 생각할 시간이 필요해, 내일 저녁 7시에 다시 이야기하자"라고 기한을 남겨봅니다.',
    'cling': '🧲 거듭확인 대신: 핸드폰 화면을 엎어두고, 따뜻한 물 한 컵 마시며 30분간 산책이나 방 정리를 해봅니다.',
    'test': '🎯 떠보기 대신: 비꼬거나 떠보지 않고, "어제 답장이 늦어서 조금 서운했어"라고 내 감정을 맑고 짧게 전해봅니다.',
    'sns_stalk': '🕵️ SNS 탐색 대신: 전 연인의 계정을 닫고, 오늘 하루 나를 위해 따뜻하고 맛있는 한 끼를 선물해봅니다.'
  };

  window.selectLoveManualMode = function (modeKey) {
    trackMindEvent('love_manual_mode_select', { mode: modeKey });
    const actionText = LOVE_MANUAL_ACTIONS[modeKey] || '선택한 수동 조율 행동을 실천합니다.';
    const textEl = document.getElementById('love-manual-action-text');
    if (textEl) textEl.innerText = actionText;

    document.querySelectorAll('.love-manual-card').forEach(card => {
      card.classList.remove('border-[#F43F5E]', 'bg-rose-50/70');
      card.classList.add('border-slate-200', 'bg-white');
    });
    if (event && event.currentTarget) {
      event.currentTarget.classList.remove('border-slate-200', 'bg-white');
      event.currentTarget.currentTarget = event.currentTarget;
      event.currentTarget.classList.add('border-[#F43F5E]', 'bg-rose-50/70');
    }
  };

  window.applyLoveManualToStep5 = function () {
    const textEl = document.getElementById('love-manual-action-text');
    if (!textEl) return;
    const action = textEl.innerText.replace(/^.*?:\s*/, '');
    const mainActionText = document.getElementById('ten-percent-action-text');
    if (mainActionText) {
      mainActionText.innerText = action;
      showToastNotification('⚡ 친밀감 수동 조율 행동이 STEP 5 실천으로 반영되었습니다!');
      const step5El = document.querySelector('#ten-percent-action-check')?.closest('.rounded-2xl');
      if (step5El) {
        step5El.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    trackMindEvent('love_manual_applied_to_action', { action });
  };

  function renderPack06SpecialInteraction(card, activeToolOverride) {
    const container = document.getElementById('pack06-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'love-relationship-01' && !card.id.startsWith('love-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');

    const defaultTool = card.interactionType || 'love_fact_check';
    const activeTool = activeToolOverride || window.currentPack06Tool || defaultTool;
    window.currentPack06Tool = activeTool;

    // Safety Alert (데이트 폭력, 스토킹, 심각한 위협)
    const isSafetyAlert = card.id === 'love-011' || card.safetyRoute === true;
    let safetyHtml = '';
    if (isSafetyAlert) {
      trackMindEvent('dating_safety_route_view', { cardId: card.id });
      safetyHtml = `
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-red-50 to-amber-50 border-2 border-rose-300 text-slate-800 space-y-2 mb-3 shadow-2xs">
          <div class="flex items-center gap-2 text-rose-700 font-black text-xs">
            <span class="text-sm">🚨</span>
            <span>긴급 안전 안내 · 데이트 폭력·협박·스토킹은 소통이 아닌 안전 보호 대상입니다</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            신체적 폭력, 지속적인 폭언, 협박, 위치 추적 및 감금 등은 대화나 심리 조율로 참아낼 일이 아닙니다. 당신의 물리적·신체적 안전 확보가 가장 먼저입니다.
          </p>
          <div class="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
            <a href="tel:1366" class="px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1">
              <span>📞 여성긴급전화 1366</span>
            </a>
            <a href="tel:112" class="px-2.5 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition flex items-center gap-1">
              <span>👮 경찰청 112</span>
            </a>
            <a href="tel:132" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1">
              <span>⚖️ 대한법률구조공단 132</span>
            </a>
            <a href="tel:15770199" class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1">
              <span>🧠 정신건강 1577-0199</span>
            </a>
          </div>
        </div>
      `;
    }

    // 3 Navigation Tabs
    const toolTabsHtml = `
      <div class="flex items-center gap-1 overflow-x-auto pb-1 mb-3 text-[11px] font-bold border-b border-rose-100 scrollbar-none">
        <button type="button" onclick="switchPack06Tool('love_fact_check')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'love_fact_check' ? 'bg-[#F43F5E] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🔍 30초 사실점검
        </button>
        <button type="button" onclick="switchPack06Tool('prediction_to_data')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'prediction_to_data' ? 'bg-[#F43F5E] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          📊 미래예측 → 현재데이터
        </button>
        <button type="button" onclick="switchPack06Tool('auto_to_manual')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'auto_to_manual' ? 'bg-[#F43F5E] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🎛️ 친밀감 AUTO → MANUAL
        </button>
      </div>
    `;

    let toolBodyHtml = '';

    if (activeTool === 'love_fact_check') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#F43F5E] font-black text-xs sm:text-sm">
              <span>🔍</span>
              <span>30-SECOND LOVE FACT CHECK (연애 사실점검)</span>
            </div>
            <span class="text-[9px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">해석 분리</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            불안이 올라올 때 뇌는 초고속으로 소설을 씁니다. 실제로 확인된 <strong>FACT</strong>와 내 머릿속의 <strong>STORY</strong>, 그리고 아직 모르는 <strong>UNKNOWN</strong>을 분명히 나눕니다.
          </p>

          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="text-[10px] font-bold text-slate-500 mb-1">지금 가장 비슷한 장면을 선택해 보세요:</div>
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <button type="button" onclick="selectLoveFactPreset('msg_delay')" class="love-fact-chip p-2 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-slate-700 text-[11px] text-left transition cursor-pointer">
                📱 답장이 3시간째 없음
              </button>
              <button type="button" onclick="selectLoveFactPreset('meet_postpone')" class="love-fact-chip p-2 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-slate-700 text-[11px] text-left transition cursor-pointer">
                📅 데이트 약속 연기 요청
              </button>
              <button type="button" onclick="selectLoveFactPreset('short_reply')" class="love-fact-chip p-2 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-slate-700 text-[11px] text-left transition cursor-pointer">
                💬 '응', 'ㅇㅇ' 단답형 답장
              </button>
              <button type="button" onclick="selectLoveFactPreset('sns_active')" class="love-fact-chip p-2 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-slate-700 text-[11px] text-left transition cursor-pointer">
                👀 SNS 접속 중인데 안 읽음
              </button>
            </div>
          </div>

          <div id="love-fact-breakdown-box" class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span class="text-[10px] font-black text-emerald-800 block mb-0.5">① FACT (확인된 사실)</span>
              <p id="love-fact-display" class="text-[11px] text-slate-800 font-bold leading-snug">
                ${card.factQuestion || '답장이 3시간 동안 도착하지 않았다.'}
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <span class="text-[10px] font-black text-rose-800 block mb-0.5">② STORY (내 뇌의 소설)</span>
              <p id="love-story-display" class="text-[11px] text-slate-800 font-bold leading-snug">
                ${card.storyQuestion || '마음이 식었거나 나를 귀찮아하고 있다.'}
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span class="text-[10px] font-black text-amber-800 block mb-0.5">③ UNKNOWN (모르는 것)</span>
              <p id="love-unknown-display" class="text-[11px] text-slate-800 font-bold leading-snug">
                ${card.unknownQuestion || '지금 회의 중인지, 이동 중인지, 피곤한지 모른다.'}
              </p>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white border border-rose-200 flex items-center justify-between">
            <span class="text-[11px] text-slate-600 font-medium">💡 사실과 소설을 분리하셨나요?</span>
            <button type="button" onclick="triggerLoveFactComplete()" class="px-3 py-1.5 rounded-lg bg-[#F43F5E] hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer">
              소설 멈추고 10초 숨고르기
            </button>
          </div>
          <div id="love-fact-feedback" class="hidden p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center">
            🌿 "모르는 것을 억지로 확신하려 하지 않을 때, 마음의 과열이 가라앉습니다."
          </div>
        </div>
      `;
    } else if (activeTool === 'prediction_to_data') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#F43F5E] font-black text-xs sm:text-sm">
              <span>📊</span>
              <span>FUTURE PREDICTION → CURRENT DATA (미래예측 → 현재데이터)</span>
            </div>
            <span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">점수·확률 없음</span>
          </div>

          <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            <strong>⚠️ Zero Divination (미래 점술 금지 원칙):</strong><br />
            이 관계가 잘될지, 헤어질지, 재회할 수 있을지의 미래 확률을 점치지 않습니다. 미래를 점칠수록 현재 대화는 왜곡됩니다. 대신 <strong>지금 관찰 가능한 실제 데이터</strong>를 확인합니다.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-80">
              <span class="text-[10px] font-black text-slate-500 block">❌ 머릿속 미래 점치기 (추측 데이터)</span>
              <p class="text-[11px] text-slate-600 line-through">“결국 얜 나를 버리고 떠날 거야”</p>
              <p class="text-[11px] text-slate-600 line-through">“지금 당장 따지지 않으면 만만하게 볼 거야”</p>
              <p class="text-[11px] text-slate-600 line-through">“다시 연락하면 내가 지는 게임이야”</p>
            </div>
            <div class="p-3 rounded-xl bg-rose-50/70 border-2 border-rose-300 space-y-1.5">
              <span class="text-[10px] font-black text-rose-800 block">⭕ 지금 관찰 가능한 현재 데이터 (검증 데이터)</span>
              <div class="space-y-1 text-[11px] text-slate-800 font-bold">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" onchange="toggleLoveDataCheck(this)" class="rounded text-rose-600" />
                  <span>최근 1주일간 우리가 직접 마주보고 대화한 시간</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" onchange="toggleLoveDataCheck(this)" class="rounded text-rose-600" />
                  <span>갈등 시 비난 없이 내 바람을 한 문장으로 전한 적이 있는가</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" onchange="toggleLoveDataCheck(this)" class="rounded text-rose-600" />
                  <span>상대의 감정 변화와 별개로 지킨 내 수면/일상 리듬</span>
                </label>
              </div>
            </div>
          </div>

          <div id="love-data-feedback" class="p-3 rounded-xl bg-white border border-rose-200 text-xs text-slate-700 leading-relaxed">
            💡 <strong>핵심 안내:</strong> 관계의 다음 걸음은 미래 점괘가 아니라, 오늘 두 사람이 실제로 나누는 <strong>'맑고 짧은 한 번의 솔직한 대화'</strong> 데이터에서 시작됩니다.
          </div>
        </div>
      `;
    } else if (activeTool === 'auto_to_manual') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-rose-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#F43F5E] font-black text-xs sm:text-sm">
              <span>🎛️</span>
              <span>INTIMACY AUTO → MANUAL (친밀감 자동반응 → 수동조율)</span>
            </div>
            <span class="text-[9px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">기어 전환</span>
          </div>

          <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            가까워질수록 혹은 멀어질수록 뇌가 자동으로 밟는 브레이크나 가속 페달이 있습니다. 자동 반응을 멈추고 <strong>수동 기어(MANUAL)</strong>로 전환해 보세요.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div onclick="selectLoveManualMode('distance')" class="love-manual-card p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 transition cursor-pointer">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-black text-rose-700">🏃 거리두기·도망 모드</span>
                <span class="text-[9px] text-slate-400">가까워지면 불안</span>
              </div>
              <p class="text-[11px] text-slate-600 mb-1.5">갑자기 답장을 늦추거나 약속을 취소하고 싶을 때</p>
              <div class="p-2 rounded-lg bg-rose-50 text-[10px] font-bold text-rose-900">
                🔧 수동 전환: "잠수 타지 않고 '오늘 혼자 충전할 시간이 필요해'라고 전하기"
              </div>
            </div>

            <div onclick="selectLoveManualMode('cling')" class="love-manual-card p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 transition cursor-pointer">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-black text-rose-700">🧲 거듭확인·매달림 모드</span>
                <span class="text-[9px] text-slate-400">멀어지면 불안</span>
              </div>
              <p class="text-[11px] text-slate-600 mb-1.5">답장이 늦으면 바로 전화를 걸거나 메시지를 연타할 때</p>
              <div class="p-2 rounded-lg bg-rose-50 text-[10px] font-bold text-rose-900">
                🔧 수동 전환: "휴대폰을 내려두고 30분간 내 산책이나 물 한 컵 마시기"
              </div>
            </div>

            <div onclick="selectLoveManualMode('test')" class="love-manual-card p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 transition cursor-pointer">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-black text-rose-700">🎯 떠보기·비꼬기 모드</span>
                <span class="text-[9px] text-slate-400">서운함 간접표현</span>
              </div>
              <p class="text-[11px] text-slate-600 mb-1.5">"너 나한테 관심 없지?", "바쁘신 분이 웬일이야?"</p>
              <div class="p-2 rounded-lg bg-rose-50 text-[10px] font-bold text-rose-900">
                🔧 수동 전환: "비꼬는 대신 '오늘 보고 싶었는데 서운했어' 맑게 말하기"
              </div>
            </div>

            <div onclick="selectLoveManualMode('sns_stalk')" class="love-manual-card p-3 rounded-xl bg-white border-2 border-slate-200 hover:border-rose-400 transition cursor-pointer">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-black text-rose-700">🕵️ 전 연인 SNS 탐색 모드</span>
                <span class="text-[9px] text-slate-400">이별 후 불안</span>
              </div>
              <p class="text-[11px] text-slate-600 mb-1.5">이별 후 상대의 계정을 검색하며 하루 종일 얽매일 때</p>
              <div class="p-2 rounded-lg bg-rose-50 text-[10px] font-bold text-rose-900">
                🔧 수동 전환: "SNS 검색창을 닫고 오늘 나를 위한 따뜻한 식사 챙기기"
              </div>
            </div>
          </div>

          <div id="love-manual-action-box" class="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-xs flex items-center justify-between">
            <span id="love-manual-action-text" class="text-rose-900 font-bold">🎯 원하는 수동 전환 카드를 터치해 보세요.</span>
            <button type="button" onclick="applyLoveManualToStep5()" class="px-3 py-1.5 rounded-lg bg-[#F43F5E] hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer shrink-0">
              오늘의 10% 실천으로 담기
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/60 via-white to-pink-50/50 border-2 border-rose-200/90 shadow-xs space-y-3">
        ${safetyHtml}
        ${toolTabsHtml}
        ${toolBodyHtml}
      </div>
    `;
  }

  // =================================================================
  // 11-3. PACK 07 전용 5대 행동실험 인터랙션 렌더러
  // ① 10-SECOND DIRECTION CHECK
  // ② 10% EXPERIMENT
  // ③ EXPECTED → ACTUAL
  // ④ RESTART, NOT RESET
  // ⑤ REWARD / COST
  // + SAFETY ROUTE (현실적 위험 방지)
  // =================================================================
  let holdTimerInterval = null;
  let holdTimerSeconds = 10;
  window.currentPack07Tool = null;

  function renderPack07SpecialInteraction(card, activeToolOverride) {
    const container = document.getElementById('pack07-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'decision-action-01' && !card.id.startsWith('dec-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      if (holdTimerInterval) { clearInterval(holdTimerInterval); holdTimerInterval = null; }
      return;
    }

    container.classList.remove('hidden');

    // Determine active tool
    const defaultTool = card.interactionType || 'direction_check';
    const activeTool = activeToolOverride || window.currentPack07Tool || defaultTool;
    window.currentPack07Tool = activeTool;

    // Safety check for extreme risks
    const isSafetyAlert = card.safetyLevel === 'CAUTION' || card.id === 'dec-015_safety';
    let safetyHtml = '';
    if (isSafetyAlert) {
      safetyHtml = `
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-2 border-red-300 text-slate-800 space-y-2 mb-3 shadow-2xs">
          <div class="flex items-center gap-2 text-red-700 font-black text-xs">
            <span class="text-sm">🚨</span>
            <span>긴급 안내 · 심리 실험으로 다룰 수 없는 현실적 안전 영역입니다</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            폭력, 신체적 위협, 중대한 금전적 손실 가능성, 회복하기 어려운 법적·건강 문제는 '10% 작게 시도하기'의 대상이 아닙니다. 현실적인 보호와 전문 기관의 상담을 최우선으로 진행해야 합니다.
          </p>
          <div class="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
            <a href="tel:112" class="px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition">👮 경찰청 112</a>
            <a href="tel:1332" class="px-2.5 py-1 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition">💰 금융감독원 1332</a>
            <a href="tel:15770199" class="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition">🧠 정신건강 1577-0199</a>
            <a href="tel:132" class="px-2.5 py-1 rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 transition">⚖️ 법률구조공단 132</a>
          </div>
        </div>
      `;
    }

    // 5 Tool navigation tabs
    const toolTabsHtml = `
      <div class="flex items-center gap-1 overflow-x-auto pb-1 mb-3 text-[11px] font-bold border-b border-indigo-100 scrollbar-none">
        <button type="button" onclick="switchPack07Tool('direction_check')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'direction_check' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          ⏱️ 10초 방향확인
        </button>
        <button type="button" onclick="switchPack07Tool('ten_percent_experiment')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'ten_percent_experiment' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🧪 10% 행동실험
        </button>
        <button type="button" onclick="switchPack07Tool('expected_vs_actual')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'expected_vs_actual' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          📊 예상 vs 실제
        </button>
        <button type="button" onclick="switchPack07Tool('restart_not_reset')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'restart_not_reset' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🔄 리셋 없는 재시작
        </button>
        <button type="button" onclick="switchPack07Tool('reward_and_cost')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'reward_and_cost' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          ⚖️ 보상과 비용
        </button>
      </div>
    `;

    let toolBodyHtml = '';

    if (activeTool === 'direction_check') {
      // TOOL 1: 10-SECOND DIRECTION CHECK
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#4F46E5] font-black text-xs sm:text-sm">
              <span>⏱️</span>
              <span>10-SECOND DIRECTION CHECK (10초 방향 확인)</span>
            </div>
            <span class="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">충동 멈춤 회로</span>
          </div>

          <div class="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
            <strong class="text-indigo-900 block mb-1">💡 핵심 원리:</strong>
            10초는 감정을 억누르거나 참는 시간이 아닙니다. 뇌가 자동으로 켜버린 충동적 행동 앞에서 <strong>“내가 지금 가려는 방향이 진짜 맞나?”</strong>를 확인하는 공간입니다.
          </div>

          <!-- 10초 인터랙티브 카운트다운 타이머 -->
          <div class="p-4 rounded-xl bg-white border-2 border-indigo-200 shadow-2xs text-center space-y-2.5">
            <div class="flex items-center justify-center gap-2">
              <span id="hold-timer-display" class="text-3xl sm:text-4xl font-black text-[#4F46E5] font-mono tracking-tight">10.0</span>
              <span class="text-xs text-slate-400 font-bold">초 HOLD</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div id="hold-timer-bar" class="bg-[#4F46E5] h-full transition-all duration-200" style="width: 100%;"></div>
            </div>
            <div class="pt-1 flex items-center justify-center gap-2">
              <button id="hold-timer-btn" type="button" onclick="start10SecHoldTimer()" class="py-2 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-black transition shadow-2xs flex items-center gap-1.5">
                <span>▶️ 10초 HOLD 시작</span>
              </button>
              <button type="button" onclick="reset10SecHoldTimer()" class="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                초기화
              </button>
            </div>
            <p id="hold-timer-status" class="text-[11px] text-slate-500">버튼을 누르고 깊은 숨을 들이마시며 10초간 잠시 멈춰보세요.</p>
          </div>

          <!-- 질문 1: 지금 내가 원하는 결과는 무엇이지? -->
          <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
            <div class="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>질문: “지금 내가 진짜 원하는 결과는 무엇이지?”</span>
              <span class="text-[10px] text-slate-400">하나 선택</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button type="button" onclick="selectDirectionResult(this, '정보를 얻고 싶다')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 정보를 얻고 싶다
              </button>
              <button type="button" onclick="selectDirectionResult(this, '문제를 해결하고 싶다')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 문제를 해결하고 싶다
              </button>
              <button type="button" onclick="selectDirectionResult(this, '경계를 말하고 싶다')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 경계를 말하고 싶다
              </button>
              <button type="button" onclick="selectDirectionResult(this, '마음을 표현하고 싶다')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 마음을 표현하고 싶다
              </button>
              <button type="button" onclick="selectDirectionResult(this, '불안을 빨리 끝내고 싶다')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 불안을 빨리 끝내고 싶다
              </button>
              <button type="button" onclick="selectDirectionResult(this, '내가 틀리지 않았음을 증명')" class="dir-opt-btn p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] text-slate-700 font-medium text-left transition">
                • 내 옳음을 증명하고 싶다
              </button>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <input id="dir-custom-input" type="text" placeholder="직접 입력: 내가 원하는 결과" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50" />
              <button type="button" onclick="selectDirectionCustom()" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition">확인</button>
            </div>
            <div id="dir-feedback-box" class="hidden p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs space-y-1">
              <strong class="text-indigo-950 block">🎯 방향 확인 피드백:</strong>
              <p id="dir-feedback-text" class="text-slate-700 leading-relaxed"></p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'ten_percent_experiment') {
      // TOOL 2: 10% EXPERIMENT
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#4F46E5] font-black text-xs sm:text-sm">
              <span>🧪</span>
              <span>10% EXPERIMENT (다음 장면 10% 행동실험)</span>
            </div>
            <span class="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">마이크로 루프</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            인생을 완전히 바꾸는 100점짜리 거대한 행동 말고, <strong>다음 장면에서 10%만 다르게 해볼 실험</strong>을 선택합니다.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button type="button" onclick="selectTenPercentExperiment(this, '5번 확인 → 4번 확인', '불확실성을 견디는 10% 실험')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">확인 줄이기</div>
              <div class="text-xs font-black text-slate-900">5번 확인 → 4번 확인</div>
              <div class="text-[10px] text-slate-500">한 번 덜 확인하고 불안이 스스로 가라앉는지 관찰합니다.</div>
            </button>

            <button type="button" onclick="selectTenPercentExperiment(this, '바로 YES → “확인하고 답할게요”', '시간 벌기 10% 실험')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">시간 벌기</div>
              <div class="text-xs font-black text-slate-900">바로 YES → “확인하고 답할게요”</div>
              <div class="text-[10px] text-slate-500">즉각 승낙 대신 1분의 시간을 벌어 내 경계를 지킵니다.</div>
            </button>

            <button type="button" onclick="selectTenPercentExperiment(this, '완벽하게 시작 → 5분 시작', '착수 저항 낮추기')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">저항 낮추기</div>
              <div class="text-xs font-black text-slate-900">완벽하게 시작 → 5분 시작</div>
              <div class="text-[10px] text-slate-500">결과물 완성 대신 타이머 5분만 켜두고 착수합니다.</div>
            </button>

            <button type="button" onclick="selectTenPercentExperiment(this, '하루 포기 → 저녁에 10분 재시작', '부분 복구 실험')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">부분 복구</div>
              <div class="text-xs font-black text-slate-900">하루 포기 → 저녁에 10분 재시작</div>
              <div class="text-[10px] text-slate-500">아침이 깨졌어도 저녁에 가장 작은 1개를 복구합니다.</div>
            </button>

            <button type="button" onclick="selectTenPercentExperiment(this, '바로 반박 → 질문 하나 먼저', '자동반응 늦추기')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">질문 먼저</div>
              <div class="text-xs font-black text-slate-900">바로 반박 → 질문 하나 먼저</div>
              <div class="text-[10px] text-slate-500">공격이나 방어 대신 “어떤 의미로 말씀하셨나요?”라고 묻습니다.</div>
            </button>

            <button type="button" onclick="selectTenPercentExperiment(this, '연락 끊기 → 필요한 시간을 말하기', '안전한 경계')" class="exp-card-btn p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition shadow-2xs space-y-1">
              <div class="text-[10px] text-indigo-700 font-bold">명확한 경계</div>
              <div class="text-xs font-black text-slate-900">연락 끊기 → 필요한 시간을 말하기</div>
              <div class="text-[10px] text-slate-500">잠수 대신 “생각할 시간이 1시간 필요해요”라고 알립니다.</div>
            </button>
          </div>

          <!-- 직접 입력 -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div class="text-[11px] font-bold text-slate-700">✍️ 나만의 10% 행동 직접 입력:</div>
            <div class="flex gap-2">
              <input id="custom-exp-input" type="text" placeholder="예: 첫 줄만 쓰기, 파일 열고 2분 보기" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-indigo-500" />
              <button type="button" onclick="submitCustomExperiment()" class="px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs transition">선택</button>
            </div>
          </div>

          <div id="exp-selected-feedback" class="hidden p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-1">
            <strong class="text-indigo-900 block">✨ 선택된 10% 실험:</strong>
            <p id="exp-selected-text" class="text-indigo-950 font-bold"></p>
            <span class="text-[10px] text-slate-500 block">오늘 이 행동을 시험해보고, 아래 '예상 vs 실제'에 경험 데이터를 기록해보세요.</span>
          </div>
        </div>
      `;
    } else if (activeTool === 'expected_vs_actual') {
      // TOOL 3: EXPECTED → ACTUAL
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#4F46E5] font-black text-xs sm:text-sm">
              <span>📊</span>
              <span>EXPECTED → ACTUAL (예상과 실제 비교)</span>
            </div>
            <span class="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">신경망 재학습</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            점수를 매기지 않습니다. AI가 “틀렸다”고 판정하지 않습니다. <strong>내 머릿속의 최악 예상(EXPECTED)과 실제 경험(ACTUAL)이 어떻게 달랐는지</strong>를 데이터로 봅니다.
          </p>

          <!-- 1단계: 내 예상은? -->
          <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span class="text-xs font-bold text-indigo-900 block">1. 행동실험 전, 내 머릿속 EXPECTED(예상)는?</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              <button type="button" onclick="selectExpectedOption(this, '거절하면 상대가 크게 화낼 것이다.')" class="expected-chip p-2 rounded-lg border border-slate-200 text-left hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 transition">
                • 거절하면 상대가 크게 화낼 것이다.
              </button>
              <button type="button" onclick="selectExpectedOption(this, '질문하면 무능해 보일 것이다.')" class="expected-chip p-2 rounded-lg border border-slate-200 text-left hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 transition">
                • 질문하면 무능해 보일 것이다.
              </button>
              <button type="button" onclick="selectExpectedOption(this, '완벽하지 않으면 전부 실패할 것이다.')" class="expected-chip p-2 rounded-lg border border-slate-200 text-left hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 transition">
                • 완벽하지 않으면 전부 실패할 것이다.
              </button>
              <button type="button" onclick="selectExpectedOption(this, '하루 쉬면 모든 루틴이 무너질 것이다.')" class="expected-chip p-2 rounded-lg border border-slate-200 text-left hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 transition">
                • 하루 쉬면 모든 루틴이 무너질 것이다.
              </button>
            </div>
            <input id="expected-custom-input" type="text" placeholder="직접 입력: 내 머릿속 예상 파국 시나리오" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-indigo-500" />
          </div>

          <!-- 2단계: 실제로는? -->
          <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span class="text-xs font-bold text-emerald-900 block">2. 행동 후, ACTUAL(실제 결과)은 어땠나요?</span>
            <textarea id="actual-result-input" rows="2" placeholder="예: 실제로 거절했더니 상대가 '알겠다'며 다른 방법을 찾았다. 생각보다 아무 일도 없었다." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"></textarea>
          </div>

          <!-- 3단계: 비교 -->
          <div class="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
            <span class="text-xs font-bold text-indigo-950 block">3. 예상과 실제는 어땠나요?</span>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="compareActualResult('different')" class="actual-compare-btn p-2 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 text-center text-xs font-bold text-slate-700 transition">
                🟢 완전히 달랐다
              </button>
              <button type="button" onclick="compareActualResult('partial')" class="actual-compare-btn p-2 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-400 text-center text-xs font-bold text-slate-700 transition">
                🟡 일부만 맞았다
              </button>
              <button type="button" onclick="compareActualResult('same_recoverable')" class="actual-compare-btn p-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-400 text-center text-xs font-bold text-slate-700 transition">
                🔵 감당할 수 있었다
              </button>
            </div>
            <div id="actual-feedback-box" class="hidden p-3 rounded-lg bg-white border border-indigo-200 text-xs space-y-1 mt-2">
              <strong class="text-indigo-950 block">💡 신경망 재학습 인사이트:</strong>
              <p id="actual-feedback-text" class="text-slate-700 leading-relaxed"></p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'restart_not_reset') {
      // TOOL 4: RESTART, NOT RESET
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#4F46E5] font-black text-xs sm:text-sm">
              <span>🔄</span>
              <span>RESTART, NOT RESET (리셋 없는 재시작)</span>
            </div>
            <span class="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">연속성 보존</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1 leading-relaxed">
            <p class="text-emerald-400 font-black">“다시 예전 길을 걸었다고 해서, 배운 길이 사라진 것은 아닙니다.”</p>
            <p class="text-slate-300 text-[11px]">명심코칭에는 '연속 기록 실패'나 '0일로 리셋' 같은 패배자 UI가 없습니다. 핸들을 다시 돌리면 됩니다.</p>
          </div>

          <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <span class="text-xs font-bold text-slate-900 block">질문: “어디에서 다시 선택할 수 있을까?” (5대 관찰)</span>
            
            <div class="space-y-1.5 text-[11px]">
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span class="font-bold text-slate-700">1. 이번 Trigger는?</span>
                <span class="text-indigo-600 font-medium">피로 / 눈치 / 막막함 / 충동</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span class="font-bold text-slate-700">2. 언제 알아차렸나?</span>
                <span class="text-indigo-600 font-medium">시작 30분 후 / 다음 날 아침</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span class="font-bold text-slate-700">3. 즉각적 보상은?</span>
                <span class="text-indigo-600 font-medium">순간의 안도감 / 회피 편안함</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span class="font-bold text-slate-700">4. 나중 장기비용은?</span>
                <span class="text-rose-600 font-medium">자책감 / 만성 피로 / 시간</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span class="font-bold text-emerald-900">5. 다음 10% 다르게 할 지점은?</span>
                <span class="text-emerald-800 font-bold">10초 멈추기 / 2분 착수</span>
              </div>
            </div>

            <div class="pt-2 text-center">
              <button type="button" onclick="confirmRestart()" class="w-full py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs transition shadow-2xs">
                🔄 오늘 이 지점에서 다시 10% 시작하기
              </button>
            </div>
            <div id="restart-feedback-box" class="hidden p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
              🌱 축하합니다. 재발을 자책으로 끝내지 않고 '새로운 데이터'로 다루어 재출발했습니다.
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'reward_and_cost') {
      // TOOL 5: REWARD / COST
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#4F46E5] font-black text-xs sm:text-sm">
              <span>⚖️</span>
              <span>REWARD vs COST (반복행동의 보상과 비용)</span>
            </div>
            <span class="text-[9px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">뇌의 타당성</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            “왜 못 끊지?”라며 자책하지 않습니다. <strong>“이 행동이 주는 당장의 보상이 무엇이길래 뇌가 반복했는지”</strong>를 이해합니다.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <!-- 보상 -->
            <div class="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-black text-indigo-900 text-xs">🎁 이 행동이 당장 주는 것 (보상)</span>
                <span class="text-[9px] text-indigo-700 font-bold">즉각적</span>
              </div>
              <div class="grid grid-cols-2 gap-1 text-[11px]">
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 순간적 안심</button>
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 불편함 회피</button>
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 가짜 통제감</button>
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 시간 벌기</button>
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 갈등 감소</button>
                <button type="button" onclick="toggleRewardChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 text-left transition">• 실패 노출 방지</button>
              </div>
            </div>

            <!-- 비용 -->
            <div class="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-black text-rose-900 text-xs">💸 나중에 치르는 대가 (비용)</span>
                <span class="text-[9px] text-rose-700 font-bold">장기적</span>
              </div>
              <div class="grid grid-cols-2 gap-1 text-[11px]">
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 시간 낭비</button>
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 만성 피로</button>
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 기회 상실</button>
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 신뢰 저하</button>
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 집중력 분산</button>
                <button type="button" onclick="toggleCostChip(this)" class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-left transition">• 자기효능감 하락</button>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white border border-indigo-200 text-xs space-y-1">
            <strong class="text-indigo-900 block">💡 전환 결론:</strong>
            <p class="text-slate-700 leading-relaxed">
              반복 행동은 내가 게을러서가 아니라, 뇌가 <strong>'즉각적 보상'</strong>을 위해 선택한 생존 알고리즘이었습니다. 이제 그 보상을 채워줄 수 있는 <strong>더 안전하고 비용이 적은 '오늘의 10% 행동'</strong>으로 교체합니다.
            </p>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border-2 border-indigo-200 shadow-xs space-y-3">
        ${safetyHtml}
        ${toolTabsHtml}
        ${toolBodyHtml}
      </div>
    `;
  }

  window.switchPack07Tool = function (toolName) {
    if (currentCard) {
      renderPack07SpecialInteraction(currentCard, toolName);
    }
  };

  // Tool 1: 10초 카운트다운 타이머
  window.start10SecHoldTimer = function () {
    const btn = document.getElementById('hold-timer-btn');
    const disp = document.getElementById('hold-timer-display');
    const bar = document.getElementById('hold-timer-bar');
    const status = document.getElementById('hold-timer-status');
    if (!disp || !bar || !btn) return;

    if (holdTimerInterval) {
      clearInterval(holdTimerInterval);
      holdTimerInterval = null;
    }

    holdTimerSeconds = 10.0;
    trackMindEvent('hold_started', { cardId: currentCard ? currentCard.id : null });

    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    if (status) status.innerText = '숨을 천천히 내쉬며 10초간 잠시 머물러 봅니다...';

    const startTime = Date.now();
    const duration = 10000;

    holdTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      disp.innerText = remaining.toFixed(1);
      bar.style.width = `${(remaining / 10) * 100}%`;

      if (remaining <= 0) {
        clearInterval(holdTimerInterval);
        holdTimerInterval = null;
        disp.innerText = '0.0';
        bar.style.width = '0%';
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        if (status) status.innerHTML = '✨ <strong>10초 HOLD 완료!</strong> 충동의 파도가 조금 가라앉았습니다. 이제 아래에서 원하는 결과를 확인해보세요.';
        trackMindEvent('hold_completed', { cardId: currentCard ? currentCard.id : null });
      }
    }, 100);
  };

  window.reset10SecHoldTimer = function () {
    if (holdTimerInterval) {
      clearInterval(holdTimerInterval);
      holdTimerInterval = null;
    }
    const btn = document.getElementById('hold-timer-btn');
    const disp = document.getElementById('hold-timer-display');
    const bar = document.getElementById('hold-timer-bar');
    const status = document.getElementById('hold-timer-status');
    if (disp) disp.innerText = '10.0';
    if (bar) bar.style.width = '100%';
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (status) status.innerText = '버튼을 누르고 깊은 숨을 들이마시며 10초간 잠시 멈춰보세요.';
  };

  window.selectDirectionResult = function (btn, resultName) {
    document.querySelectorAll('.dir-opt-btn').forEach(b => {
      b.classList.remove('border-indigo-600', 'bg-indigo-100', 'text-indigo-900', 'font-bold');
      b.classList.add('border-slate-200', 'text-slate-700');
    });
    btn.classList.remove('border-slate-200', 'text-slate-700');
    btn.classList.add('border-indigo-600', 'bg-indigo-100', 'text-indigo-900', 'font-bold');

    const fbBox = document.getElementById('dir-feedback-box');
    const fbText = document.getElementById('dir-feedback-text');
    if (fbBox && fbText) {
      if (resultName.includes('불안') || resultName.includes('증명')) {
        fbText.innerText = `‘${resultName}’이(가) 목적이라면, 지금 하려던 충동적 행동(재검색·폭식·포기 등)은 불안을 잠시 가릴 뿐 결과를 주지 못합니다. 5분만 결정을 보류해보세요.`;
      } else {
        fbText.innerText = `‘${resultName}’이(가) 목적이라면, 반복 검색이나 고민 대신 그 목적에 직접 닿는 가장 작은 1단계(자료 첫 줄 쓰기, 확인 질문하기)를 실행하는 것이 훨씬 빠릅니다.`;
      }
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('ten_percent_action_selected', { type: 'direction_choice' });
  };

  window.selectDirectionCustom = function () {
    const input = document.getElementById('dir-custom-input');
    if (!input || !input.value.trim()) return;
    const fbBox = document.getElementById('dir-feedback-box');
    const fbText = document.getElementById('dir-feedback-text');
    if (fbBox && fbText) {
      fbText.innerText = `원하는 결과가 명확해졌습니다. 지금 자동 시작하려던 행동이 이 결과에 도움을 주는지 3초만 확인하고 다음 행동으로 나아가세요.`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('ten_percent_action_selected', { type: 'direction_custom' });
  };

  // Tool 2: 10% 실험 선택
  window.selectTenPercentExperiment = function (btn, expTitle, note) {
    document.querySelectorAll('.exp-card-btn').forEach(b => {
      b.classList.remove('border-indigo-500', 'bg-indigo-50/80', 'ring-2', 'ring-indigo-300');
      b.classList.add('border-slate-200', 'bg-white');
    });
    btn.classList.remove('border-slate-200', 'bg-white');
    btn.classList.add('border-indigo-500', 'bg-indigo-50/80', 'ring-2', 'ring-indigo-300');

    const fbBox = document.getElementById('exp-selected-feedback');
    const fbText = document.getElementById('exp-selected-text');
    if (fbBox && fbText) {
      fbText.innerText = `“${expTitle}” (${note})`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('experiment_created', { cardId: currentCard ? currentCard.id : null });
    trackMindEvent('ten_percent_action_selected', { cardId: currentCard ? currentCard.id : null });
  };

  window.submitCustomExperiment = function () {
    const input = document.getElementById('custom-exp-input');
    if (!input || !input.value.trim()) return;
    const fbBox = document.getElementById('exp-selected-feedback');
    const fbText = document.getElementById('exp-selected-text');
    if (fbBox && fbText) {
      fbText.innerText = `“${input.value.trim()}” (나만의 10% 실험)`;
      fbBox.classList.remove('hidden');
    }
    trackMindEvent('experiment_created', { cardId: currentCard ? currentCard.id : null, custom: true });
    trackMindEvent('ten_percent_action_selected', { cardId: currentCard ? currentCard.id : null, custom: true });
  };

  // Tool 3: 예상 vs 실제
  window.selectExpectedOption = function (btn, expText) {
    document.querySelectorAll('.expected-chip').forEach(b => {
      b.classList.remove('border-indigo-500', 'bg-indigo-100', 'text-indigo-950', 'font-bold');
      b.classList.add('border-slate-200', 'text-slate-700');
    });
    btn.classList.remove('border-slate-200', 'text-slate-700');
    btn.classList.add('border-indigo-500', 'bg-indigo-100', 'text-indigo-950', 'font-bold');
    trackMindEvent('expected_recorded', { cardId: currentCard ? currentCard.id : null });
  };

  window.compareActualResult = function (type) {
    document.querySelectorAll('.actual-compare-btn').forEach(b => {
      b.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-100');
    });
    const fbBox = document.getElementById('actual-feedback-box');
    const fbText = document.getElementById('actual-feedback-text');
    if (!fbBox || !fbText) return;

    if (type === 'different') {
      fbText.innerText = '뇌의 편도체는 최악의 시나리오를 그려 행동을 막으려 했지만, 실제 현실 데이터는 훨씬 안전했습니다. 이 경험이 뇌에 새로운 안전 신경망을 새깁니다.';
    } else if (type === 'partial') {
      fbText.innerText = '불편함은 있었지만, 머릿속에서 상상했던 파국은 일어나지 않았습니다. 뇌는 이제 "불편해도 버틸 수 있다"는 회복 탄력성을 배웠습니다.';
    } else {
      fbText.innerText = '예상했던 일이 일어났더라도 감당하고 해결할 수 있었습니다. 이제 이 상황은 더 이상 알 수 없는 공포가 아니라 다룰 수 있는 현실 데이터가 되었습니다.';
    }
    fbBox.classList.remove('hidden');
    trackMindEvent('actual_recorded', { cardId: currentCard ? currentCard.id : null, type });
    trackMindEvent('experiment_completed', { cardId: currentCard ? currentCard.id : null });
  };

  // Tool 4: 리셋 없는 재시작
  window.confirmRestart = function () {
    const fb = document.getElementById('restart-feedback-box');
    if (fb) fb.classList.remove('hidden');
    trackMindEvent('restart_used', { cardId: currentCard ? currentCard.id : null });
  };

  // Tool 5: 보상과 비용
  window.toggleRewardChip = function (btn) {
    btn.classList.toggle('bg-indigo-100');
    btn.classList.toggle('border-indigo-500');
    btn.classList.toggle('font-bold');
    trackMindEvent('ten_percent_action_selected', { type: 'reward_select' });
  };

  window.toggleCostChip = function (btn) {
    btn.classList.toggle('bg-rose-100');
    btn.classList.toggle('border-rose-500');
    btn.classList.toggle('font-bold');
    trackMindEvent('ten_percent_action_selected', { type: 'cost_select' });
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
  // 12-4. 부모·가족·독립 PACK 05 캐러셀
  // =================================================================
  const FEATURED_FAMILY_IDS = [
    'fam-001', // 부탁 거절 죄책감
    'fam-002', // 효도 기준 부채감
    'fam-005', // 독립 배신감
    'fam-014', // 사과 인정 대기
    'fam-016', // 부모 구원자 모드
    'fam-020'  // 사랑과 경계 공존
  ];

  function renderFamilyQuestions() {
    const carousel = document.getElementById('family-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const familyFeatured = [];
    FEATURED_FAMILY_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) familyFeatured.push(card);
    });

    const otherFamily = cardsData.filter(c => 
      c.packId === 'family-boundary-01' && !FEATURED_FAMILY_IDS.includes(c.id)
    );

    const list = [...familyFeatured, ...otherFamily].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#E11D48] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#E11D48]/10 text-[#E11D48] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#E11D48] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#E11D48]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // 12-4B. 연애·친밀감·이별 PACK 06 캐러셀
  // =================================================================
  const FEATURED_LOVE_IDS = [
    'love-001', // 답장 늦어짐 불안 모드
    'love-009', // 전 연인 SNS 염탐 모드
    'love-010', // 재회 충동 모드
    'love-012', // 마음읽기 판정 모드
    'love-017', // 애착유형 라벨링 모드
    'love-020'  // 성숙한 친밀감 모드
  ];

  function renderLoveQuestions() {
    const carousel = document.getElementById('love-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const loveFeatured = [];
    FEATURED_LOVE_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) loveFeatured.push(card);
    });

    const otherLove = cardsData.filter(c => 
      c.packId === 'love-relationship-01' && !FEATURED_LOVE_IDS.includes(c.id)
    );

    const list = [...loveFeatured, ...otherLove].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#F43F5E] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#F43F5E]/10 text-[#F43F5E] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#F43F5E] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#F43F5E]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // 12-5. 결정·미루기·습관 PACK 07 캐러셀
  // =================================================================
  const FEATURED_DECISION_IDS = [
    'dec-001', // 결정 후 재검색 모드
    'dec-002', // 확신 대기 모드
    'dec-004', // 완벽한 계획 모드
    'dec-011', // 0 아니면 100 모드
    'dec-018', // 재발 판결 모드
    'dec-020'  // 다시 선택 모드
  ];

  function renderDecisionQuestions() {
    const carousel = document.getElementById('decision-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const decisionFeatured = [];
    FEATURED_DECISION_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) decisionFeatured.push(card);
    });

    const otherDecision = cardsData.filter(c => 
      c.packId === 'decision-action-01' && !FEATURED_DECISION_IDS.includes(c.id)
    );

    const list = [...decisionFeatured, ...otherDecision].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#4F46E5] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#4F46E5]/10 text-[#4F46E5] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#4F46E5] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#4F46E5]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // 12-6. 자책·불안·감정회복 PACK 08 캐러셀
  // =================================================================
  const FEATURED_EMOTION_IDS = [
    'emo-001', // 실수 후 자책 모드
    'emo-002', // 신체 과각성 불안 모드
    'emo-003', // 분노 폭발 후 자괴감 모드
    'emo-004', // 수치심 은폐 모드
    'emo-007', // 서운함 억압 모드
    'emo-015'  // 멘탈 자책 정체성 모드
  ];

  function renderEmotionQuestions() {
    const carousel = document.getElementById('emotion-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const emotionFeatured = [];
    FEATURED_EMOTION_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) emotionFeatured.push(card);
    });

    const otherEmotion = cardsData.filter(c => 
      c.packId === 'emotion-recovery-01' && !FEATURED_EMOTION_IDS.includes(c.id)
    );

    const list = [...emotionFeatured, ...otherEmotion].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0D9488] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#0D9488]/10 text-[#0D9488] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0D9488] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#0D9488]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // 12-7. 사주·삼재·운명·선택 PACK 09 캐러셀
  // =================================================================
  const FEATURED_BELIEF_IDS = [
    'fate-001', // 삼재 결론 모드
    'fate-002', // 돈복 판결 모드
    'fate-004', // 궁합 결재 모드
    'fate-009', // 운세 검색 모드
    'fate-018', // 운명 vs 패턴 모드
    'fate-020'  // 믿지만 갇히지 않는 모드
  ];

  function renderBeliefQuestions() {
    const carousel = document.getElementById('belief-questions-carousel');
    if (!carousel || !cardsData || cardsData.length === 0) return;

    const beliefFeatured = [];
    FEATURED_BELIEF_IDS.forEach(id => {
      const card = cardsData.find(c => c.id === id);
      if (card) beliefFeatured.push(card);
    });

    const otherBelief = cardsData.filter(c => 
      c.packId === 'belief-fate-uncertainty-01' && !FEATURED_BELIEF_IDS.includes(c.id)
    );

    const list = [...beliefFeatured, ...otherBelief].slice(0, 12);

    carousel.innerHTML = list.map((card, idx) => `
      <div onclick="pickMindCard(0, '${card.id}')" class="shrink-0 w-64 sm:w-72 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#8B5CF6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] font-black text-[10px]">
              ${card.category}
            </span>
            <span class="text-[10px] text-slate-400 font-bold">#0${idx + 1}</span>
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#8B5CF6] transition-colors leading-snug line-clamp-2 mb-2">
            ${card.question}
          </h5>
          <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            ${card.sodaAnswer}
          </p>
        </div>
        <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span class="text-[#8B5CF6]">사이다 답변 확인 &rarr;</span>
          <span>${card.cardTitle}</span>
        </div>
      </div>
    `).join('');
  }

  // =================================================================
  // PACK 08 전용 5대 감정회복 인터랙션
  // =================================================================
  window.currentPack08Tool = null;

  function renderPack08SpecialInteraction(card, activeToolOverride) {
    const container = document.getElementById('pack08-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'emotion-recovery-01' && !card.id.startsWith('emo-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');

    const defaultTool = card.interactionType || 'body_signal';
    const activeTool = activeToolOverride || window.currentPack08Tool || defaultTool;
    window.currentPack08Tool = activeTool;

    // 위기 안전망 안내
    const crisisSafetyHtml = `
      <div class="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-slate-800 space-y-1.5 mb-3 text-xs shadow-2xs">
        <div class="flex items-center justify-between text-rose-800 font-bold">
          <span class="flex items-center gap-1.5"><span>🛡️</span> <span>마음 돌봄 긴급 안전망 안내</span></span>
          <span class="text-[10px] text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">24시간 무료</span>
        </div>
        <p class="text-[11px] text-slate-600 leading-relaxed">
          극심한 자책, 자해 충동, 감당하기 어려운 불안이 이어질 때는 혼자 버티지 마세요. 전문 상담사와 지금 바로 통화할 수 있습니다.
        </p>
        <div class="flex flex-wrap gap-2 pt-0.5 font-bold text-[10px]">
          <a href="tel:109" class="px-2.5 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition">📞 자살예방 상담전화 109</a>
          <a href="tel:15770199" class="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition">🧠 정신건강 위기상담 1577-0199</a>
          <a href="tel:129" class="px-2.5 py-1 rounded-lg bg-indigo-700 text-white hover:bg-indigo-800 transition">🤝 보건복지상담 129</a>
        </div>
      </div>
    `;

    // 5대 도구 탭
    const tabsHtml = `
      <div class="flex items-center gap-1 overflow-x-auto pb-1 mb-3 text-[11px] font-bold border-b border-teal-100 scrollbar-none">
        <button type="button" onclick="switchPack08Tool('body_signal')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'body_signal' ? 'bg-[#0D9488] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          💓 몸의 신호 체크
        </button>
        <button type="button" onclick="switchPack08Tool('emotion_split')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'emotion_split' ? 'bg-[#0D9488] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🧩 감정·충동·행동 분리
        </button>
        <button type="button" onclick="switchPack08Tool('second_arrow')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'second_arrow' ? 'bg-[#0D9488] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🎯 두 번째 화살 멈추기
        </button>
        <button type="button" onclick="switchPack08Tool('body_signature')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'body_signature' ? 'bg-[#0D9488] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🗺️ 감정 몸 시그니처
        </button>
        <button type="button" onclick="switchPack08Tool('prevention_to_response')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'prevention_to_response' ? 'bg-[#0D9488] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🌱 회복 대응(REPAIR)
        </button>
      </div>
    `;

    let toolBodyHtml = '';

    if (activeTool === 'body_signal') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-teal-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#0D9488] font-black text-xs sm:text-sm">
              <span>💓</span>
              <span>BODY SIGNAL CHECK · 몸의 신호 체크</span>
            </div>
            <span class="text-[9px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">생리적 신호 관찰</span>
          </div>

          <div class="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-slate-700 leading-relaxed">
            <strong class="text-teal-900 block mb-1">💡 핵심 통찰:</strong>
            감정은 머릿속의 잘못된 생각이 아니라, <strong>몸이 먼저 켜낸 생리적 알람</strong>입니다. 지금 내 몸 어디에서 신호가 오고 있나요?
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button type="button" onclick="selectBodySignal(this, '가슴 답답함', '가슴 안쪽에 4초 들이마시고 6초 내쉬며 숨길을 내어줍니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">🧊 가슴 답답함 / 턱 막힘</span>
              <span class="text-[10px] text-slate-500">호흡이 얕아짐</span>
            </button>
            <button type="button" onclick="selectBodySignal(this, '심장 두근거림', '손을 가슴 위에 얹고 심장의 박동을 판단 없이 느껴봅니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">💓 심장 박동 빨라짐</span>
              <span class="text-[10px] text-slate-500">쿵쾅거리는 긴장</span>
            </button>
            <button type="button" onclick="selectBodySignal(this, '목과 어깨 결림', '어깨를 귀까지 3초간 바짝 올렸다가 툭 떨어뜨려 이완합니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">⚡ 목·어깨 경직</span>
              <span class="text-[10px] text-slate-500">돌처럼 굳은 근육</span>
            </button>
            <button type="button" onclick="selectBodySignal(this, '명치와 위장 조임', '따뜻한 물 한 모금을 천천히 마시듯 위장의 긴장을 알아차립니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">🌪️ 명치·위장 쥐어짜임</span>
              <span class="text-[10px] text-slate-500">체한 듯한 답답함</span>
            </button>
            <button type="button" onclick="selectBodySignal(this, '손발 차가움', '양손을 비벼 따뜻한 온기를 손바닥에 모아봅니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">❄️ 손발 차가움 / 식은땀</span>
              <span class="text-[10px] text-slate-500">혈액이 중심으로 수축</span>
            </button>
            <button type="button" onclick="selectBodySignal(this, '머리 멍함 / 두통', '관자놀이를 가볍게 지그시 누르며 바깥 소리에 귀를 기울여봅니다.')" class="body-signal-chip p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-0.5">
              <span class="font-bold text-slate-800 block">🧠 머리 띵함 / 과부하</span>
              <span class="text-[10px] text-slate-500">생각의 소용돌이</span>
            </button>
          </div>

          <div id="body-signal-feedback" class="hidden p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-bold leading-relaxed">
            🌿 <span id="body-signal-desc"></span>
          </div>
        </div>
      `;
    } else if (activeTool === 'emotion_split') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-teal-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#0D9488] font-black text-xs sm:text-sm">
              <span>🧩</span>
              <span>CIRCUIT SPLIT · 감정 회로 4단계 분리</span>
            </div>
            <span class="text-[9px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">덩어리 해체</span>
          </div>

          <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
            <p class="text-xs text-slate-600 leading-relaxed">
              뇌는 <strong>몸의 신호 &rarr; 감정 &rarr; 충동 &rarr; 행동</strong>을 순식간에 하나로 묶어버립니다. 4개 층위로 분리해보세요.
            </p>

            <div class="space-y-2">
              <div class="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 flex items-start gap-2 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-teal-600 text-white font-black text-[10px] shrink-0">1. BODY</span>
                <div>
                  <strong class="text-teal-950">몸의 감각:</strong>
                  <span class="text-slate-600">${card.bodyQuestion || "가슴이 조여오고 호흡이 얕아지는 신체 반응"}</span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-start gap-2 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-black text-[10px] shrink-0">2. EMOTION</span>
                <div>
                  <strong class="text-indigo-950">감정의 진짜 이름:</strong>
                  <span class="text-slate-600">${card.keyword} (불안, 수치심, 죄책감, 서운함, 두려움)</span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-start gap-2 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-amber-600 text-white font-black text-[10px] shrink-0">3. URGE</span>
                <div>
                  <strong class="text-amber-950">자동 충동:</strong>
                  <span class="text-slate-600">빨리 확인하기 / 도망치기 / 숨어버리기 / 나를 공격(자책)하기</span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-300 flex items-start gap-2 text-xs">
                <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] shrink-0">4. ACTION</span>
                <div>
                  <strong class="text-emerald-950">오늘의 10% 선택:</strong>
                  <span class="text-slate-800 font-bold">${card.tenPercentAction}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'second_arrow') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-teal-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#0D9488] font-black text-xs sm:text-sm">
              <span>🎯</span>
              <span>SECOND ARROW STOP · 두 번째 화살 내려놓기</span>
            </div>
            <span class="text-[9px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">자기공격 정지</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            살면서 실수나 거절이라는 <strong>첫 번째 화살</strong>은 피할 수 없습니다. 하지만 그 뒤에 '난 왜 이 모양일까'라며 내 심장에 <strong>두 번째 화살을 꽂는 자기비난</strong>은 멈출 수 있습니다.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div class="p-3 rounded-xl bg-white border border-rose-200 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-rose-700">🏹 첫 번째 화살 (일어난 아픔)</span>
                <span class="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">피할 수 없음</span>
              </div>
              <p class="text-[11px] text-slate-600">
                실수, 약속 지연, 거절, 원치 않았던 결과. 아프고 속상한 것은 자연스러운 감정입니다.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-white border-2 border-red-300 space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-red-700">🎯 두 번째 화살 (자기비난)</span>
                <span class="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">내가 멈출 수 있음</span>
              </div>
              <p class="text-[11px] text-slate-600">
                “난 왜 이따위일까”, “평생 바보처럼 살 거야”, “다 내 탓이야”라는 가혹한 자기공격.
              </p>
            </div>
          </div>

          <div class="pt-1 text-center">
            <button type="button" onclick="dropSecondArrow(this)" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D9488] to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-xs transition shadow-2xs flex items-center justify-center gap-1.5">
              <span>🛑 두 번째 화살(자책) 내려놓기</span>
            </button>
            <div id="second-arrow-feedback" class="hidden mt-2 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 font-bold">
              ✨ 두 번째 화살을 내려놓았습니다. 실수는 아프지만, 나를 더 이상 처벌하지 않고 수습 행동으로 나아갑니다.
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'body_signature') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-teal-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#0D9488] font-black text-xs sm:text-sm">
              <span>🗺️</span>
              <span>BODY SIGNATURE MAP · 감정 몸 시그니처</span>
            </div>
            <span class="text-[9px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">조기경보 센서</span>
          </div>

          <div class="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-slate-700 leading-relaxed">
            스트레스나 감정 폭발이 시작되기 직전, 내 몸에서 <strong>가장 먼저 1초 만에 알람을 울리는 부위</strong>를 알아두면 감정에 휩쓸리기 전에 멈출 수 있습니다.
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="selectBodySignature(this, '턱과 목', '이를 악물거나 목에 힘이 들어갈 때 바로 혀를 입천장에서 떼어보세요.')" class="sig-chip p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-1">
              <span class="font-black text-slate-800 block">🦷 턱 악물기 & 목 경직</span>
              <span class="text-[10px] text-slate-500">참고 버티는 분노의 신호</span>
            </button>
            <button type="button" onclick="selectBodySignature(this, '가슴 중앙', '가슴 한가운데에 손을 얹고 깊은 날숨을 길게 내쉬어보세요.')" class="sig-chip p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-1">
              <span class="font-black text-slate-800 block">🫀 가슴 조임 & 답답함</span>
              <span class="text-[10px] text-slate-500">불안과 거절 공포의 신호</span>
            </button>
            <button type="button" onclick="selectBodySignature(this, '명치와 복부', '배꼽 주변을 살살 시계 방향으로 쓸어주며 긴장을 풉니다.')" class="sig-chip p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-1">
              <span class="font-black text-slate-800 block">🌀 명치 찌름 & 뱃속 긴장</span>
              <span class="text-[10px] text-slate-500">책임감과 죄책감의 신호</span>
            </button>
            <button type="button" onclick="selectBodySignature(this, '호흡 멈춤', '내쉬는 숨을 평소보다 2초 더 길게 유지해보세요.')" class="sig-chip p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left text-xs transition space-y-1">
              <span class="font-black text-slate-800 block">💨 숨 멈춤 & 얕은 호흡</span>
              <span class="text-[10px] text-slate-500">동결(Freeze) 긴급 신호</span>
            </button>
          </div>

          <div id="sig-feedback" class="hidden p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-bold leading-relaxed">
            📍 <span id="sig-desc"></span>
          </div>
        </div>
      `;
    } else if (activeTool === 'prevention_to_response') {
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-teal-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#0D9488] font-black text-xs sm:text-sm">
              <span>🌱</span>
              <span>RESPONSE & REPAIR · 통제 대신 회복 프로토콜</span>
            </div>
            <span class="text-[9px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">회복력 가동</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            감정을 미리 완벽하게 차단하려는 '예방'은 불가능합니다. 파도가 친 뒤 <strong>물기를 털고 빠르게 복구(REPAIR)하는 3단계</strong>를 실행합니다.
          </div>

          <div class="space-y-2">
            <div class="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span class="font-black text-slate-800 block">1단계: 5분 멈춤 (PAUSE)</span>
                <span class="text-[10px] text-slate-500">즉각적인 반응(문자 폭탄, 회피, 충동 구매) 5분 지연</span>
              </div>
              <span class="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">5min</span>
            </div>

            <div class="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span class="font-black text-slate-800 block">2단계: 자막 내리기 (DROP SUBTITLE)</span>
                <span class="text-[10px] text-slate-500">‘인생 끝났다’는 뇌의 파국 자막을 FACT와 분리</span>
              </div>
              <span class="text-teal-600 font-bold text-xs">FACT 분리</span>
            </div>

            <div class="p-3 rounded-xl bg-teal-50/80 border border-teal-300 text-xs flex items-center justify-between">
              <div>
                <span class="font-black text-teal-950 block">3단계: 수습 행동 하나 (10% REPAIR)</span>
                <span class="text-[10px] text-teal-800 font-medium">${card.tenPercentAction}</span>
              </div>
              <button type="button" onclick="runRepairAction(this)" class="px-2.5 py-1 rounded-lg bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-[10px] transition">
                실행완료
              </button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-slate-50 to-emerald-50/70 border-2 border-teal-200/90 shadow-xs space-y-3.5">
        ${crisisSafetyHtml}
        ${tabsHtml}
        ${toolBodyHtml}
      </div>
    `;
  }

  window.switchPack08Tool = function(toolName) {
    window.currentPack08Tool = toolName;
    trackMindEvent('emotion_tool_switch', { tool: toolName, cardId: currentCard ? currentCard.id : null });
    renderPack08SpecialInteraction(currentCard, toolName);
  };

  window.selectBodySignal = function(btn, label, desc) {
    document.querySelectorAll('.body-signal-chip').forEach(el => el.classList.remove('border-teal-500', 'bg-teal-50', 'ring-2', 'ring-teal-200'));
    btn.classList.add('border-teal-500', 'bg-teal-50', 'ring-2', 'ring-teal-200');
    const fb = document.getElementById('body-signal-feedback');
    const d = document.getElementById('body-signal-desc');
    if (fb && d) {
      d.innerText = `[${label}] ${desc}`;
      fb.classList.remove('hidden');
    }
    trackMindEvent('body_signal_selected', { signal: label, cardId: currentCard ? currentCard.id : null });
  };

  window.dropSecondArrow = function(btn) {
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');
    const fb = document.getElementById('second-arrow-feedback');
    if (fb) fb.classList.remove('hidden');
    trackMindEvent('second_arrow_dropped', { cardId: currentCard ? currentCard.id : null });
    showToastNotification("✨ 두 번째 화살(자기비난)을 내려놓았습니다.");
  };

  window.selectBodySignature = function(btn, zone, desc) {
    document.querySelectorAll('.sig-chip').forEach(el => el.classList.remove('border-teal-500', 'bg-teal-50', 'ring-2', 'ring-teal-200'));
    btn.classList.add('border-teal-500', 'bg-teal-50', 'ring-2', 'ring-teal-200');
    const fb = document.getElementById('sig-feedback');
    const d = document.getElementById('sig-desc');
    if (fb && d) {
      d.innerText = `내 조기경보 센서는 [${zone}]입니다. ${desc}`;
      fb.classList.remove('hidden');
    }
    trackMindEvent('body_signature_selected', { zone, cardId: currentCard ? currentCard.id : null });
  };

  window.runRepairAction = function(btn) {
    btn.innerText = '✓ 복구 완료';
    btn.classList.remove('bg-[#0D9488]', 'hover:bg-teal-700');
    btn.classList.add('bg-emerald-600');
    trackMindEvent('repair_action_completed', { cardId: currentCard ? currentCard.id : null });
    showToastNotification("🌱 10% 회복(REPAIR) 행동이 기록되었습니다!");
  };

  // =================================================================
  // PACK 09 전용 5대 운명·믿음·선택 인터랙션
  // =================================================================
  window.currentPack09Tool = null;

  function renderPack09SpecialInteraction(card, activeToolOverride) {
    const container = document.getElementById('pack09-special-interaction-container');
    if (!container) return;

    if (!card || (card.packId !== 'belief-fate-uncertainty-01' && !card.id.startsWith('fate-'))) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');

    const defaultTool = card.interactionType || 'belief_fact_split';
    const activeTool = activeToolOverride || window.currentPack09Tool || defaultTool;
    window.currentPack09Tool = activeTool;

    // 1. 공통 고정 원칙 배너 (운세 예언 차단 선언)
    const fixedBannerHtml = `
      <div class="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 text-slate-800 space-y-1.5 mb-3 shadow-2xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-purple-900 font-black text-xs">
            <span>🔮</span>
            <span>명심코칭 원칙 · 미래를 맞히지 않습니다</span>
          </div>
          <span class="text-[10px] text-purple-700 font-bold bg-white px-2 py-0.5 rounded-full border border-purple-200">발언권 vs 결재권</span>
        </div>
        <p class="text-xs text-purple-950 font-black leading-relaxed">
          “믿음에는 발언권을 줄 수 있다. 그러나 행동의 결재권까지 자동으로 넘기지는 않는다.”
        </p>
        <p class="text-[11px] text-purple-900/85 leading-relaxed">
          오늘의 카드는 당신의 미래를 맞히지 않습니다. 그 이야기를 들은 지금, 당신 안에서 무엇이 작동하고 있는지 살펴봅니다.
        </p>
      </div>
    `;

    // 2. 현실 위험 안전 안내 (의료, 법률, 투자 등)
    const safetyHtml = `
      <div class="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 space-y-1 mb-3 text-[11px] leading-relaxed shadow-2xs">
        <div class="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
          <span>⚖️</span>
          <span>현실 정보와 전문적 판단 안내</span>
        </div>
        <p>
          의료, 법률, 투자, 대출, 이혼, 폭력관계, 중대한 재정결정 등은 사주, 운세, 명심카드, 징크스만으로 결정하지 않습니다. 현실 데이터와 공인 전문 기관의 상담을 우선 진행하세요.
        </p>
        <div class="flex flex-wrap gap-2 pt-1 font-bold text-[10px]">
          <a href="tel:112" class="px-2 py-0.5 rounded bg-slate-800 text-white hover:bg-slate-900 transition">👮 경찰청 112</a>
          <a href="tel:1332" class="px-2 py-0.5 rounded bg-amber-700 text-white hover:bg-amber-800 transition">💰 금융감독원 1332</a>
          <a href="tel:132" class="px-2 py-0.5 rounded bg-indigo-700 text-white hover:bg-indigo-800 transition">⚖️ 법률구조공단 132</a>
          <a href="tel:15770199" class="px-2 py-0.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 transition">🧠 정신건강 1577-0199</a>
        </div>
      </div>
    `;

    // 3. 5대 도구 탭
    const tabsHtml = `
      <div class="flex items-center gap-1 overflow-x-auto pb-1 mb-3 text-[11px] font-bold border-b border-purple-100 scrollbar-none">
        <button type="button" onclick="switchPack09Tool('belief_fact_split')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'belief_fact_split' ? 'bg-[#8B5CF6] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🎴 BELIEF · FACT · UNKNOWN · CHOICE
        </button>
        <button type="button" onclick="switchPack09Tool('authority_split')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'authority_split' ? 'bg-[#8B5CF6] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          👑 발언권 vs 결재권
        </button>
        <button type="button" onclick="switchPack09Tool('saju_life_bridge')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'saju_life_bridge' ? 'bg-[#8B5CF6] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🌉 사주 → 삶 BRIDGE
        </button>
        <button type="button" onclick="switchPack09Tool('certainty_to_participation')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'certainty_to_participation' ? 'bg-[#8B5CF6] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🧭 확실성 → 삶의 참여
        </button>
        <button type="button" onclick="switchPack09Tool('identity_to_operation')" class="px-2.5 py-1 rounded-lg whitespace-nowrap transition cursor-pointer ${activeTool === 'identity_to_operation' ? 'bg-[#8B5CF6] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
          🔄 정체성 문장 → 작동 문장
        </button>
      </div>
    `;

    let toolBodyHtml = '';

    if (activeTool === 'belief_fact_split') {
      // TOOL 1: BELIEF / FACT / UNKNOWN / CHOICE (4 Cards, No scoring)
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#8B5CF6] font-black text-xs sm:text-sm">
              <span>🎴</span>
              <span>BELIEF / FACT / UNKNOWN / CHOICE (4분할 프레임)</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">점수화 금지 · 영역 분리</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- 1. BELIEF -->
            <div class="p-3 rounded-xl bg-white border border-purple-200 space-y-1 shadow-2xs">
              <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-[10px]">1. BELIEF</span>
              <h6 class="text-xs font-bold text-slate-800">내가 들었거나 믿고 있는 이야기는?</h6>
              <p class="text-[11px] text-slate-500 leading-relaxed">${card.question}</p>
            </div>

            <!-- 2. FACT -->
            <div class="p-3 rounded-xl bg-white border border-blue-200 space-y-1 shadow-2xs">
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px]">2. FACT</span>
              <h6 class="text-xs font-bold text-slate-800">현재 실제로 확인된 것은?</h6>
              <p class="text-[11px] text-slate-500 leading-relaxed">${card.factQuestion || "객관적으로 기록 가능한 사실과 숫자"}</p>
            </div>

            <!-- 3. UNKNOWN -->
            <div class="p-3 rounded-xl bg-white border border-amber-200 space-y-1 shadow-2xs">
              <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[10px]">3. UNKNOWN</span>
              <h6 class="text-xs font-bold text-slate-800">미래에 대해 아직 모르는 것은?</h6>
              <p class="text-[11px] text-slate-500 leading-relaxed">${card.unknownQuestion || "아직 일어나지 않은 모든 가능성과 결과"}</p>
            </div>

            <!-- 4. CHOICE -->
            <div class="p-3 rounded-xl bg-white border-2 border-emerald-300 space-y-1 shadow-2xs">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">4. CHOICE</span>
              <h6 class="text-xs font-bold text-slate-800">모르는 것이 남아 있어도 오늘 선택할 것은?</h6>
              <p class="text-[11px] text-slate-700 font-bold leading-relaxed">${card.tenPercentAction}</p>
            </div>
          </div>

          <div class="pt-1 text-center">
            <button type="button" onclick="saveUnknownChoice(this)" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-xs transition shadow-2xs flex items-center justify-center gap-1.5">
              <span>🧭 UNKNOWN을 남겨두고 오늘 내 선택 확인하기</span>
            </button>
            <div id="belief-split-feedback" class="hidden mt-2 p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 font-bold">
              ✨ 미래의 모든 것을 다 알지 못해도 괜찮습니다. 오늘 내가 영향 줄 수 있는 10%의 선택에 집중합니다.
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'authority_split') {
      // TOOL 2: 발언권 vs 결재권
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#8B5CF6] font-black text-xs sm:text-sm">
              <span>👑</span>
              <span>VOICE vs AUTHORITY · 발언권 vs 결재권</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">주권 회복</span>
          </div>

          <div class="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
            <div class="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>아래의 모든 요소는 ‘발언권’을 가질 수 있습니다:</span>
              <span class="text-[10px] text-purple-600 font-bold">참고자료</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">🔮 사주·운세</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">👨‍👩‍👧 부모 조언</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">👥 친구 의견</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">⚡ 내 안의 불안</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">💡 내 직감</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">📊 전문가 정보</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">📋 실제 데이터</div>
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">⚖️ 현실 위험</div>
            </div>
            <p class="text-[10px] text-slate-400 text-center">
              * 각 요소는 의견을 낼 자격(발언권)이 있습니다. 하지만 내 인생의 CEO 자리는 비워둘 수 없습니다.
            </p>
          </div>

          <!-- 결재권 강조 박스 -->
          <div class="p-4 rounded-xl bg-gradient-to-br from-purple-50 via-white to-amber-50 border-2 border-purple-300 text-center space-y-2.5 shadow-xs">
            <h5 class="text-sm font-black text-purple-950">
              “그렇다면, 이 결정의 최종 결재권은 누가 가지고 있나요?”
            </h5>
            <button type="button" onclick="claimDecisionAuthority(this)" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2">
              <span>👑 “최종 선택의 결재권은 내가 가진다”</span>
            </button>
            <div id="authority-feedback" class="hidden text-xs text-purple-900 font-bold bg-white p-3 rounded-lg border border-purple-200 leading-relaxed">
              🎉 축하합니다! 모든 조언과 두려움에 발언권은 충분히 주되, 내 삶의 최종 결재 도장은 내가 쥐고 있음을 선언했습니다.
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'saju_life_bridge') {
      // TOOL 3: 사주 → 삶 BRIDGE
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#8B5CF6] font-black text-xs sm:text-sm">
              <span>🌉</span>
              <span>BRIDGE TO LIFE · 사주에서 삶으로 건너가는 브리지</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">삶으로의 복귀</span>
          </div>

          <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs text-xs">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
              <div>
                <strong class="text-slate-800">사주 / 믿음:</strong>
                <span class="text-slate-600">“이 믿음이 어떤 내 반복 패턴을 보게 해줬나?”</span>
              </div>
            </div>
            <div class="text-center text-slate-300 font-black text-[10px]">&darr;</div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
              <div>
                <strong class="text-slate-800">알아차림 (AWARENESS):</strong>
                <span class="text-slate-600">내 취약점과 자동 반응의 지도를 발견함</span>
              </div>
            </div>
            <div class="text-center text-slate-300 font-black text-[10px]">&darr;</div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-black flex items-center justify-center text-[10px] shrink-0">3</span>
              <div>
                <strong class="text-slate-800">수용 (ACCEPTANCE):</strong>
                <span class="text-slate-600">“이 반응을 나쁜 팔자가 아닌 자연스러운 내 한 조각으로 받아들임”</span>
              </div>
            </div>
            <div class="text-center text-slate-300 font-black text-[10px]">&darr;</div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center text-[10px] shrink-0">4</span>
              <div>
                <strong class="text-slate-800">최적화 (OPTIMIZATION):</strong>
                <span class="text-slate-600">“오늘 내 환경과 조건을 어떻게 조율해서 쓸 것인가?”</span>
              </div>
            </div>
            <div class="text-center text-slate-300 font-black text-[10px]">&darr;</div>
            <div class="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">5</span>
              <div>
                <strong class="text-emerald-950">삶 (LIFE):</strong>
                <span class="text-emerald-800 font-bold">실제 현실로 건너와 책임과 기쁨을 누리기</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-center space-y-2">
            <p class="text-xs text-purple-950 font-bold leading-relaxed">
              “브리지의 목적은 브리지 위에서 평생 머무는 것이 아니라,<br />삶으로 건너가는 것입니다.”
            </p>
            <button type="button" onclick="completeBridge(this)" class="py-2 px-4 rounded-xl bg-[#8B5CF6] hover:bg-purple-700 text-white font-black text-xs transition shadow-2xs">
              🚶 삶으로 건너가기 (브리지 완료)
            </button>
          </div>
        </div>
      `;
    } else if (activeTool === 'certainty_to_participation') {
      // TOOL 4: CERTAINTY → PARTICIPATION
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#8B5CF6] font-black text-xs sm:text-sm">
              <span>🧭</span>
              <span>CERTAINTY → PARTICIPATION · 확실성에서 참여로</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">삶의 주도권</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- 왼쪽: 확실성 집착 -->
            <div class="p-3 rounded-xl bg-white border border-rose-200 space-y-1.5 shadow-2xs text-xs">
              <span class="text-[10px] font-black text-rose-700 block">🛑 확실성 집착 (정지 상태)</span>
              <ul class="space-y-1 text-[11px] text-slate-600">
                <li>• “확실히 알아야 움직일 수 있어.”</li>
                <li>• “미래가 안전하다는 보장이 필요해.”</li>
                <li>• “틀리지 않는 완벽한 선택을 찾아야 해.”</li>
              </ul>
              <div class="text-[10px] text-rose-500 pt-1 font-medium">&rarr; 결정 지연, 점집 순회, 삶의 동결</div>
            </div>

            <!-- 오른쪽: 삶의 참여 -->
            <div class="p-3 rounded-xl bg-white border-2 border-emerald-300 space-y-1.5 shadow-2xs text-xs">
              <span class="text-[10px] font-black text-emerald-800 block">🌱 삶의 참여 (진행 상태)</span>
              <ul class="space-y-1 text-[11px] text-slate-700 font-medium">
                <li>• “충분한 정보를 현실에서 확인한다.”</li>
                <li>• “모르는 것은 UNKNOWN으로 남긴다.”</li>
                <li>• “현재의 가치와 책임 안에서 선택한다.”</li>
                <li>• “결과를 보고 다시 조정한다.”</li>
              </ul>
              <div class="text-[10px] text-emerald-600 pt-1 font-bold">&rarr; SCAN &rarr; SYNC &rarr; SHIFT &rarr; 다시 조정</div>
            </div>
          </div>
        </div>
      `;
    } else if (activeTool === 'identity_to_operation') {
      // TOOL 5: 정체성 문장 → 작동 문장
      toolBodyHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5 text-[#8B5CF6] font-black text-xs sm:text-sm">
              <span>🔄</span>
              <span>OPERATION SENTENCE · 정체성 문장 &rarr; 작동 문장</span>
            </div>
            <span class="text-[9px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-full border border-purple-200">장면으로의 전환</span>
          </div>

          <div class="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-slate-700 leading-relaxed">
            AI가 새로운 사주 해석을 만들지 않습니다. '나는 원래 팔자가 세' 같은 운명적 낙인을 <strong>구체적으로 관찰 가능한 행동 장면의 문장</strong>으로 바꿉니다.
          </div>

          <div class="space-y-2">
            <button type="button" onclick="selectIdentityExample('나는 원래 팔자가 세', '나는 갈등 상황에서 빠르게 방어막을 치는 반응이 나타날 때가 있다')" class="id-ex-btn w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-left text-xs transition space-y-1">
              <div class="flex items-center justify-between text-slate-400 line-through text-[11px]">
                <span>“나는 원래 팔자가 세.”</span>
                <span class="text-[9px] text-rose-500 font-bold no-underline">정체성 라벨</span>
              </div>
              <div class="font-bold text-purple-950 text-xs">
                &rarr; “나는 갈등 상황에서 빠르게 방어막을 치는 반응이 나타날 때가 있다.”
              </div>
            </button>

            <button type="button" onclick="selectIdentityExample('나는 돈복이 없어', '돈과 관련된 불확실성에서 결정을 오래 미루는 장면이 있다')" class="id-ex-btn w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-left text-xs transition space-y-1">
              <div class="flex items-center justify-between text-slate-400 line-through text-[11px]">
                <span>“나는 돈복이 없어.”</span>
                <span class="text-[9px] text-rose-500 font-bold no-underline">정체성 라벨</span>
              </div>
              <div class="font-bold text-purple-950 text-xs">
                &rarr; “돈과 관련된 불확실성에서 결정을 오래 미루는 장면이 있다.”
              </div>
            </button>

            <button type="button" onclick="selectIdentityExample('나는 사람복이 없어', '관계에서 반복해서 허용하고 있는 상대의 행동이 있는지 살펴본다')" class="id-ex-btn w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-left text-xs transition space-y-1">
              <div class="flex items-center justify-between text-slate-400 line-through text-[11px]">
                <span>“나는 사람복이 없어.”</span>
                <span class="text-[9px] text-rose-500 font-bold no-underline">정체성 라벨</span>
              </div>
              <div class="font-bold text-purple-950 text-xs">
                &rarr; “관계에서 반복해서 허용하고 있는 상대의 행동이 있는지 살펴본다.”
              </div>
            </button>
          </div>

          <div id="id-transform-output" class="hidden p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1">
            <span class="text-[10px] text-purple-700 font-black block">💡 재정의된 내 삶의 작동 문장:</span>
            <p id="id-transformed-text" class="text-purple-950 font-black leading-relaxed"></p>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-slate-50 to-indigo-50/70 border-2 border-purple-200/90 shadow-xs space-y-3.5">
        ${fixedBannerHtml}
        ${safetyHtml}
        ${tabsHtml}
        ${toolBodyHtml}
      </div>
    `;
  }

  window.switchPack09Tool = function(toolName) {
    window.currentPack09Tool = toolName;
    trackMindEvent('belief_tool_switch', { tool: toolName, cardId: currentCard ? currentCard.id : null });
    renderPack09SpecialInteraction(currentCard, toolName);
  };

  window.saveUnknownChoice = function(btn) {
    const fb = document.getElementById('belief-split-feedback');
    if (fb) fb.classList.remove('hidden');
    trackMindEvent('belief_fact_split', { cardId: currentCard ? currentCard.id : null });
    trackMindEvent('unknown_saved', { cardId: currentCard ? currentCard.id : null });
    trackMindEvent('choice_action_selected', { cardId: currentCard ? currentCard.id : null });
    showToastNotification("🧭 UNKNOWN을 남겨두고 오늘의 선택을 확인했습니다.");
  };

  window.claimDecisionAuthority = function(btn) {
    const fb = document.getElementById('authority-feedback');
    if (fb) fb.classList.remove('hidden');
    trackMindEvent('decision_authority_view', { cardId: currentCard ? currentCard.id : null });
    trackMindEvent('decision_authority_selected', { cardId: currentCard ? currentCard.id : null });
    showToastNotification("👑 최종 선택의 결재권을 확인했습니다!");
  };

  window.completeBridge = function(btn) {
    btn.innerText = '✓ 삶으로 복귀 완료';
    btn.classList.add('bg-emerald-600');
    trackMindEvent('bridge_completed', { cardId: currentCard ? currentCard.id : null });
    showToastNotification("🚶 브리지를 건너 오늘의 삶과 실천으로 돌아왔습니다.");
  };

  window.selectIdentityExample = function(orig, transformed) {
    const out = document.getElementById('id-transform-output');
    const txt = document.getElementById('id-transformed-text');
    if (out && txt) {
      txt.innerText = transformed;
      out.classList.remove('hidden');
    }
    trackMindEvent('identity_to_operation_converted', { original: orig, cardId: currentCard ? currentCard.id : null });
  };



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

        // PACK 06: 14대 연애·친밀감 자연어 쿼리 부스팅
        const PACK06_BOOSTS = {
          '답장 불안': ['love-001', 'love-004', 'love-012'],
          '읽씹': ['love-001', 'love-004', 'love-012'],
          '안읽씹': ['love-001', 'love-004'],
          '연락 텀': ['love-001', 'love-004', 'love-016'],
          '잠수': ['love-008', 'love-007', 'love-014'],
          '회피': ['love-007', 'love-008', 'love-017'],
          '매달림': ['love-005', 'love-010', 'love-017'],
          '질투': ['love-006', 'love-009', 'love-003'],
          '전애인': ['love-009', 'love-010', 'love-018'],
          '재회': ['love-010', 'love-009', 'love-018'],
          '이별': ['love-008', 'love-018', 'love-010'],
          '권태기': ['love-015', 'love-014', 'love-020'],
          '집착': ['love-004', 'love-005', 'love-009'],
          '애착유형': ['love-017', 'love-005', 'love-007']
        };

        for (const [natQuery, boostedIds] of Object.entries(PACK06_BOOSTS)) {
          if (query.includes(natQuery) || natQuery.includes(query)) {
            if (boostedIds.includes(c.id)) {
              score += 260;
            }
          }
        }

        // PACK 07: 13대 자연어 쿼리 부스팅
        const PACK07_BOOSTS = {
          '결정을 못하겠어요': ['dec-007', 'dec-014', 'dec-001'],
          '결정하고 다시 검색해요': ['dec-001', 'dec-008'],
          '자꾸 미뤄요': ['dec-005', 'dec-003', 'dec-006'],
          '계획만 세워요': ['dec-004', 'dec-003'],
          '작심삼일이에요': ['dec-010', 'dec-009', 'dec-018'],
          '의지가 약한 것 같아요': ['dec-010', 'dec-012', 'dec-005'],
          '시작하기가 너무 어려워요': ['dec-006', 'dec-002', 'dec-003'],
          '확신이 없어요': ['dec-002', 'dec-001', 'dec-019'],
          '또 실패했어요': ['dec-018', 'dec-010', 'dec-015'],
          '한 번 놓치면 다 포기해요': ['dec-011', 'dec-017'],
          '습관을 못 만들어요': ['dec-009', 'dec-017', 'dec-010'],
          '생각만 많고 행동을 못해요': ['dec-014', 'dec-003', 'dec-006'],
          '완벽하게 준비하고 싶어요': ['dec-003', 'dec-004', 'dec-002']
        };

        for (const [natQuery, boostedIds] of Object.entries(PACK07_BOOSTS)) {
          if (query.includes(natQuery) || natQuery.includes(query)) {
            if (boostedIds.includes(c.id)) {
              score += 250;
            }
          }
        }

        // PACK 08: 14대 감정회복 자연어 쿼리 부스팅
        const PACK08_BOOSTS = {
          '자책을 멈추고 싶어요': ['emo-001', 'emo-008', 'emo-015'],
          '제가 다 망친 것 같아요': ['emo-001', 'emo-003', 'emo-010'],
          '왜 이렇게 멘탈이 약할까요': ['emo-015', 'emo-017', 'emo-002'],
          '실수하고 너무 괴로워요': ['emo-001', 'emo-005', 'emo-008'],
          '감정이 주체가 안 돼요': ['emo-003', 'emo-007', 'emo-009'],
          '불안해서 심장이 뛰어요': ['emo-002', 'emo-012', 'emo-019'],
          '사소한 말에 상처받아요': ['emo-004', 'emo-011', 'emo-014'],
          '화를 참을 수가 없어요': ['emo-003', 'emo-007', 'emo-016'],
          '자꾸 후회돼요': ['emo-008', 'emo-001', 'emo-010'],
          '내가 너무 한심해요': ['emo-015', 'emo-001', 'emo-004'],
          '죄책감이 들어요': ['emo-010', 'emo-001', 'emo-008'],
          '수치스러워요': ['emo-004', 'emo-013', 'emo-014'],
          '확인하고 싶어 미치겠어요': ['emo-009', 'emo-002', 'emo-018'],
          '도망치고 싶어요': ['emo-006', 'emo-002', 'emo-017']
        };

        for (const [natQuery, boostedIds] of Object.entries(PACK08_BOOSTS)) {
          if (query.includes(natQuery) || natQuery.includes(query)) {
            if (boostedIds.includes(c.id)) {
              score += 260;
            }
          }
        }

        // PACK 09: 14대 운명·믿음 자연어 쿼리 부스팅
        const PACK09_BOOSTS = {
          '삼재라는데 무서워요': ['fate-001', 'fate-008', 'fate-010'],
          '사주가 안 좋아요': ['fate-001', 'fate-008', 'fate-016'],
          '돈복이 없대요': ['fate-002', 'fate-010', 'fate-015'],
          '결혼운이 안 좋대요': ['fate-003', 'fate-004', 'fate-015'],
          '궁합이 안 좋아요': ['fate-004', 'fate-003', 'fate-017'],
          '대운은 언제 오나요': ['fate-013', 'fate-005', 'fate-019'],
          '올해 운이 안 좋대요': ['fate-001', 'fate-014', 'fate-008'],
          '나쁜 꿈을 꿨어요': ['fate-006', 'fate-012', 'fate-008'],
          '징크스가 있어요': ['fate-012', 'fate-011', 'fate-006'],
          '점을 계속 보게 돼요': ['fate-007', 'fate-009', 'fate-019'],
          '운세를 계속 확인해요': ['fate-009', 'fate-007', 'fate-019'],
          '팔자가 센 것 같아요': ['fate-016', 'fate-018', 'fate-020'],
          '사람복이 없어요': ['fate-016', 'fate-004', 'fate-018'],
          '사주를 믿어도 되나요': ['fate-020', 'fate-017', 'fate-015']
        };

        for (const [natQuery, boostedIds] of Object.entries(PACK09_BOOSTS)) {
          if (query.includes(natQuery) || natQuery.includes(query)) {
            if (boostedIds.includes(c.id)) {
              score += 270;
            }
          }
        }

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

    // 1. 위기 신호 감지 (자살, 자해, 극심한 절망)
    const isCrisisQuery = /자살|죽고\s*싶|자해|살기\s*싫|끝내고\s*싶|모든\s*걸\s*놓고/.test(query);
    let crisisBannerHtml = '';
    if (isCrisisQuery) {
      crisisBannerHtml = `
        <div class="p-3.5 rounded-xl bg-red-600/30 border-2 border-red-500 text-white mb-3 space-y-2 text-xs shadow-lg">
          <div class="flex items-center gap-1.5 font-black text-red-200 text-sm">
            <span>🚨</span>
            <span>24시간 긴급 마음 돌봄 안전망</span>
          </div>
          <p class="leading-relaxed text-slate-100">
            지금 겪고 계신 고통은 혼자 감당하지 않아도 됩니다. 24시간 언제든 무료로 이야기 나눌 수 있는 전문 상담사가 기다리고 있습니다.
          </p>
          <div class="flex flex-wrap gap-2 pt-1 font-bold text-[11px]">
            <a href="tel:109" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-sm">📞 자살예방 상담전화 109</a>
            <a href="tel:15770199" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm">🧠 정신건강 위기상담 1577-0199</a>
          </div>
        </div>
      `;
    }

    // 2. 운세 예측 질문 감지 (대운, 재물운, 결혼운 등) & 운세 생성 차단 배너
    const isFortuneQuery = /대운|운세|점괘|올해\s*운|재물운|결혼운|사주\s*봐|점\s*봐|운이\s*좋|운이\s*나/.test(query);
    let fortuneBannerHtml = '';
    if (isFortuneQuery) {
      fortuneBannerHtml = `
        <div class="p-3.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 mb-3 space-y-1.5 text-xs shadow-md">
          <div class="flex items-center gap-1.5 font-black text-amber-300">
            <span>🔮</span>
            <span>명심코칭 운세 질문 안내 · 미래를 맞히지 않습니다</span>
          </div>
          <p class="leading-relaxed text-amber-100 font-bold">
            “명심코칭은 미래 운세를 판정하지 않습니다.<br />대신 그 질문이 지금 왜 중요해졌는지 함께 볼 수 있습니다.”
          </p>
          <p class="text-[11px] text-amber-200/80 leading-relaxed">
            “그 답을 알아야 지금 무엇을 할 수 있을 것 같나요?<br />미래를 맞히기보다 오늘 내 행동의 결재권을 되찾아주는 카드들을 추천합니다.”
          </p>
        </div>
      `;
    }

    // 3. 데이트 폭력 / 스토킹 / 협박 신호 감지
    const isDatingViolenceQuery = /데이트\s*폭력|폭력|폭언|스토킹|감금|신체적\s*위협|협박|위치\s*추적/.test(query);
    let datingViolenceBannerHtml = '';
    if (isDatingViolenceQuery) {
      datingViolenceBannerHtml = `
        <div class="p-3.5 rounded-xl bg-rose-600/30 border-2 border-rose-500 text-white mb-3 space-y-2 text-xs shadow-lg">
          <div class="flex items-center gap-1.5 font-black text-rose-200 text-sm">
            <span>🚨</span>
            <span>데이트 폭력·위협 긴급 안전망 · 심리 조언보다 안전이 최우선입니다</span>
          </div>
          <p class="leading-relaxed text-slate-100">
            지속적인 폭력, 폭언, 협박, 스토킹, 강제 통제는 심리적 소통이나 마음가짐으로 해결할 문제가 아닙니다. 신체적·법적 안전 확보가 가장 먼저입니다.
          </p>
          <div class="flex flex-wrap gap-2 pt-1 font-bold text-[11px]">
            <a href="tel:1366" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm">📞 여성긴급전화 1366</a>
            <a href="tel:112" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm">👮 경찰청 112</a>
            <a href="tel:132" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm">⚖️ 대한법률구조공단 132</a>
          </div>
        </div>
      `;
    }

    // 4. 애착유형 라벨링 질문 감지 (불안형, 회피형 등) & 비진단 안내 배너
    const isAttachmentLabelQuery = /애착|불안형|회피형|공포회피|나르시|가스라이팅/.test(query);
    let attachmentBannerHtml = '';
    if (isAttachmentLabelQuery) {
      attachmentBannerHtml = `
        <div class="p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 mb-3 space-y-1 text-xs shadow-md">
          <div class="flex items-center gap-1.5 font-black text-rose-300">
            <span>🏷️</span>
            <span>애착유형 라벨링 안내 · 당신이나 상대를 유형 상자에 가두지 않습니다</span>
          </div>
          <p class="leading-relaxed text-rose-100 font-bold">
            “상대를 '회피형', 나를 '불안형'이라 규정하는 것은 이해의 시작일 수 있지만 고정된 꼬리표가 되어서는 안 됩니다.”
          </p>
          <p class="text-[11px] text-rose-200/80 leading-relaxed">
            성격 유형 대신, 지금 이 순간 두 사람 사이에서 어떤 자극(Trigger)과 STORY, 방어행동이 반복되는지 작동 과정으로 살펴봅니다.
          </p>
        </div>
      `;
    }

    // 5. 관계 결정 질문 감지 (재회할까, 헤어질까 등) & 미래예측 차단 배너
    const isRelationshipDecisionQuery = /재회할까|헤어질까|다시\s*만날|끝낼까|헤어져야|이별해야|다시\s*연락할까|잡아야\s*할까/.test(query);
    let relationshipDecisionBannerHtml = '';
    if (isRelationshipDecisionQuery) {
      relationshipDecisionBannerHtml = `
        <div class="p-3.5 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 mb-3 space-y-1 text-xs shadow-md">
          <div class="flex items-center gap-1.5 font-black text-pink-300">
            <span>🧭</span>
            <span>관계 결정 안내 · 재회나 이별 결정을 대신 내려주지 않습니다</span>
          </div>
          <p class="leading-relaxed text-pink-100 font-bold">
            “헤어질지, 다시 만날지의 미래를 점치거나 대신 결정하지 않습니다.”
          </p>
          <p class="text-[11px] text-pink-200/80 leading-relaxed">
            불확실한 상대의 속마음을 추측하기보다, 지금까지 확인된 FACT와 오늘 내 삶의 10% 선택권을 스스로 세울 수 있도록 돕습니다.
          </p>
        </div>
      `;
    }

    // 헤더: “사람을 몇 개의 유형 상자에 가두지 않습니다. 지금 켜진 상태(동사)부터 가볍게 골라보세요.”
    let html = `
      ${crisisBannerHtml}
      ${datingViolenceBannerHtml}
      ${fortuneBannerHtml}
      ${attachmentBannerHtml}
      ${relationshipDecisionBannerHtml}
      <div class="mb-2">
        <div class="text-xs sm:text-sm font-black text-[#E2CF9F] leading-snug">
          “사람을 몇 개의 유형 상자에 가두지 않습니다.<br class="sm:hidden" /> 지금 내 안에서 켜진 상태(동사)부터 가볍게 골라보세요.”
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">고정된 꼬리표 대신, 상황에 맞는 사이다 통찰과 1분 SCAN으로 조율합니다.</div>
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

“이것은 성격진단이 아니라 오늘의 작동기록입니다. (고정된 라벨 대신 지금 켜진 상태를 조율합니다)”
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
