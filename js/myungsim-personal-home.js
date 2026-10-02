/**
 * =================================================================
 * MYUNGSIM PERSONAL HOME ENGINE v2
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * PAST (지난번 선택) → PRESENT (오늘의 장면) → NEXT (다음 10% 행동)
 * Single Screen Personal Continuity Hub
 * NO-AI Production Mode / Zero External AI Calls / Shared Device Isolation
 * =================================================================
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------
  // 1. 상수 및 설정 정의
  // -------------------------------------------------------------
  const STORAGE_KEY_AUTH = 'myungsim_current_user';
  const DEFAULT_USER_ID = 'demo_member';
  const DEFAULT_USER_NAME = '명심 여행자';

  // 상태 코드
  const HOME_STATE = {
    START_NEW_SCAN: 'START_NEW_SCAN',             // 기본: 오늘 새 장면부터 시작
    FOLLOW_UP_EXPERIMENT: 'FOLLOW_UP_EXPERIMENT', // 활성 실험 결과 확인 우선
    VIEW_WORKING_MAP: 'VIEW_WORKING_MAP',         // 최근 작동지도 갱신 확인
    CHOOSE_NEW_ACTION: 'CHOOSE_NEW_ACTION',       // 새 10% 행동 선택
    REVIEW_HISTORY: 'REVIEW_HISTORY',             // 이전 기록 돌아보기
    DRAW_DAILY_CARD: 'DRAW_DAILY_CARD',           // 오늘의 카드 한 장 뽑기
    LONG_ABSENCE: 'LONG_ABSENCE'                  // 30~90일 미접속 후 복귀 (No-Guilt)
  };

  // -------------------------------------------------------------
  // 2. MyungsimAuth: 프라이버시 세션 & 다중 사용자 격리 스토리지
  // -------------------------------------------------------------
  class MyungsimAuth {
    static getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    static isLoggedIn() {
      return this.getCurrentUser() !== null;
    }

    static getCurrentUserId() {
      const user = this.getCurrentUser();
      return user ? user.id : null;
    }

    static login(userId = DEFAULT_USER_ID, name = DEFAULT_USER_NAME) {
      const user = {
        id: userId,
        name: name,
        loginAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      } catch (e) {}

      if (typeof window.trackMindEvent === 'function') {
        window.trackMindEvent('personal_home_login', { userId: user.id });
      }
      return user;
    }

    static logout() {
      try {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        // 세션스토리지 캐시 클린업
        sessionStorage.removeItem('myungsim_home_cache');
      } catch (e) {}

      if (typeof window.trackMindEvent === 'function') {
        window.trackMindEvent('personal_home_logout', {});
      }
      return true;
    }

    // 사용자별 격리 스토리지 키 생성기 (Shared Device 완벽 격리)
    static getScopedKey(baseKey) {
      const uid = this.getCurrentUserId() || 'guest';
      return `${baseKey}_${uid}`;
    }

    // 세션 기록 가져오기 (User Scoped)
    static getUserSessions() {
      try {
        const scopedKey = this.getScopedKey('myeongsim_personal_sessions');
        let raw = localStorage.getItem(scopedKey);
        // 기존 레거시 키 호환
        if (!raw) raw = localStorage.getItem('myeongsim_personal_sessions');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    // 행동실험 기록 가져오기 (User Scoped)
    static getUserExperiments() {
      try {
        const scopedKey = this.getScopedKey('myungsim_behavior_experiments');
        let raw = localStorage.getItem(scopedKey);
        if (!raw) raw = localStorage.getItem('myungsim_behavior_experiments');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    // 실험 데이터 저장 (User Scoped)
    static saveUserExperiments(list) {
      try {
        const scopedKey = this.getScopedKey('myungsim_behavior_experiments');
        localStorage.setItem(scopedKey, JSON.stringify(list));
        // 기본 키 동시 동기화
        localStorage.setItem('myungsim_behavior_experiments', JSON.stringify(list));
      } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // 3. PersonalHomeRuleEngine: 100% NO-AI 결정 조건문 엔진
  // -------------------------------------------------------------
  class PersonalHomeRuleEngine {
    /**
     * 개인화 상태 및 단 하나의 Primary CTA 결정
     * @param {Object} context 
     * @returns {Object} { state, primaryCTA, secondaryCTA, bannerNotice, sourceHint }
     */
    static decideState(context = {}) {
      const {
        hasActiveExperiment = false,
        activeExperiment = null,
        historyCount = 0,
        workingMapReady = false,
        workingMapUpdated = false,
        daysSinceLastActivity = 0,
        lastCardTitle = ''
      } = context;

      // 1) 30일 이상 미방문 사용자: No-Guilt 상태
      if (daysSinceLastActivity >= 30) {
        return {
          state: HOME_STATE.LONG_ABSENCE,
          primaryCTA: {
            id: 'btn-primary-new-scene',
            label: '오늘 장면부터 다시 시작하기',
            action: 'start_new_scan'
          },
          secondaryCTA: {
            id: 'btn-secondary-daily-card',
            label: '오늘의 카드 한 장',
            action: 'draw_daily_card'
          },
          bannerNotice: '오늘 새 장면부터 다시 시작해도 괜찮습니다. 이전의 발견은 언제든 보실 수 있습니다.',
          sourceHint: '오랜만의 방문을 환영하는 선택'
        };
      }

      // 2) 활성 행동실험(Active Experiment)이 대기 중인 경우: Follow-up 우선 제안
      if (hasActiveExperiment && activeExperiment) {
        return {
          state: HOME_STATE.FOLLOW_UP_EXPERIMENT,
          primaryCTA: {
            id: 'btn-primary-followup',
            label: '지난 선택 돌아보기 &rarr;',
            action: 'follow_up_experiment',
            targetId: activeExperiment.experimentId
          },
          secondaryCTA: {
            id: 'btn-secondary-new-scene',
            label: '오늘 새 고민 입력하기',
            action: 'start_new_scan'
          },
          bannerNotice: '아직 결과를 확인하지 않은 선택이 하나 남아 있습니다.',
          sourceHint: '지난번 10% 행동실험에서 가져온 선택'
        };
      }

      // 3) 최근 작동지도가 새롭게 갱신된 경우
      if (workingMapReady && workingMapUpdated) {
        return {
          state: HOME_STATE.VIEW_WORKING_MAP,
          primaryCTA: {
            id: 'btn-primary-map',
            label: '나의 최근 작동지도 확인 &rarr;',
            action: 'view_working_map'
          },
          secondaryCTA: {
            id: 'btn-secondary-new-scene',
            label: '오늘 새 장면 보기',
            action: 'start_new_scan'
          },
          bannerNotice: '최근 기록에서는 기존 행동 외에 다른 선택도 나타나기 시작했습니다.',
          sourceHint: '나의 작동지도 변화에서 가져온 선택'
        };
      }

      // 4) 신규 사용자 또는 기본 활동 상태
      return {
        state: HOME_STATE.START_NEW_SCAN,
        primaryCTA: {
          id: 'btn-primary-find-question',
          label: '가까운 질문 찾기 &rarr;',
          action: 'start_new_scan'
        },
        secondaryCTA: {
          id: 'btn-secondary-daily-card',
          label: '오늘의 카드 한 장',
          action: 'draw_daily_card'
        },
        bannerNotice: historyCount > 0 ? '오늘 마음에 걸리는 장면 하나부터 가볍게 시작합니다.' : '아직 기록이 없습니다. 지금 마음에 걸리는 장면 하나부터 시작해볼까요?',
        sourceHint: historyCount > 0 ? (lastCardTitle ? `최근 카드 "${lastCardTitle}" 이후의 다음 걸음` : '오늘의 새로운 시작') : '첫 시작을 위한 선택'
      };
    }
  }

  // -------------------------------------------------------------
  // 4. 비민감 안전 분석 디스패처 (원문 0건 전송 보장)
  // -------------------------------------------------------------
  function trackSafeHomeEvent(eventName, payload = {}) {
    const safeData = {
      state: payload.state || undefined,
      primaryAction: payload.primaryAction || undefined,
      cardId: payload.cardId || undefined,
      hasActiveExp: payload.hasActiveExp !== undefined ? payload.hasActiveExp : undefined,
      historyCount: payload.historyCount !== undefined ? payload.historyCount : undefined,
      timestamp: Date.now()
    };

    // 개인 원문 텍스트 원천 삭제
    delete safeData.query;
    delete safeData.text;
    delete safeData.expectedResult;
    delete safeData.actualResult;
    delete safeData.memo;

    if (typeof window.trackMindEvent === 'function') {
      window.trackMindEvent(eventName, safeData);
    }
  }

  // -------------------------------------------------------------
  // 5. MyungsimPersonalHomeUI (7대 핵심 섹션 통합 렌더러)
  // -------------------------------------------------------------
  class MyungsimPersonalHomeUI {
    constructor() {
      this.continuityMode = false; // 기본 OFF (사용자 선택 시만 연결)
      this.currentUser = null;
      this.homeState = null;
    }

    init() {
      // 1. 로그인 상태 확인 (없으면 데모 멤버로 안전 자동 세팅)
      this.currentUser = MyungsimAuth.getCurrentUser();
      if (!this.currentUser) {
        this.currentUser = MyungsimAuth.login(DEFAULT_USER_ID, DEFAULT_USER_NAME);
      }

      this.renderHeaderUserBadge();
      this.loadAndRenderHome();
      this.attachEvents();

      trackSafeHomeEvent('personal_home_view', {
        state: this.homeState ? this.homeState.state : 'INITIAL',
        hasActiveExp: this.hasActiveExperiment,
        historyCount: this.historyCount
      });
    }

    // 상단 네비게이션 사용자 뱃지 & 로그아웃 버튼
    renderHeaderUserBadge() {
      const badgeBox = document.getElementById('mf-home-header-user-badge');
      if (!badgeBox) return;

      badgeBox.innerHTML = `
        <div class="flex items-center gap-2 text-xs">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#0F766E] border border-emerald-200/80 font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${this.currentUser.name}</span>
          </div>
          <button type="button" id="btn-home-logout" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition text-[11px] font-medium">
            로그아웃
          </button>
        </div>
      `;

      const logoutBtn = document.getElementById('btn-home-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (confirm('로그아웃하시겠습니까?\n공용 기기 보호를 위해 개인 데이터가 안전하게 정리되고 메인 홈으로 이동합니다.')) {
            MyungsimAuth.logout();
            window.location.href = '/';
          }
        });
      }
    }

    // 메인 데이터 로드 및 7대 섹션 렌더링
    loadAndRenderHome() {
      const sessions = MyungsimAuth.getUserSessions();
      const experiments = MyungsimAuth.getUserExperiments();

      // 활성 실험 확인
      const activeExp = experiments.find(e => e.status === 'PLANNED') || null;
      const recentSession = sessions[0] || null;
      const completedExpCount = experiments.filter(e => e.status === 'DONE' || e.status === 'PARTIAL').length;
      const workingMapReady = (sessions.length >= 2 || completedExpCount >= 2);

      // 경과 일수 계산
      let daysSinceLast = 0;
      if (recentSession && recentSession.timestamp) {
        const lastTime = new Date(recentSession.timestamp).getTime();
        daysSinceLast = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
      }

      const context = {
        hasActiveExperiment: activeExp !== null,
        activeExperiment: activeExp,
        historyCount: sessions.length,
        workingMapReady: workingMapReady,
        workingMapUpdated: completedExpCount >= 2,
        daysSinceLastActivity: daysSinceLast,
        lastCardTitle: recentSession ? recentSession.cardTitle : ''
      };

      this.hasActiveExperiment = activeExp !== null;
      this.historyCount = sessions.length;
      this.homeState = PersonalHomeRuleEngine.decideState(context);

      // 1. 상태 배너 & Primary CTA 트래킹
      trackSafeHomeEvent('primary_cta_shown', {
        state: this.homeState.state,
        primaryAction: this.homeState.primaryCTA.action
      });

      // 2. 각 섹션 렌더링
      this.renderSection1TodayScene(recentSession);
      this.renderSection2PastChoice(activeExp);
      this.renderSection3RecentDiscovery(recentSession, experiments);
      this.renderSection4WorkingMapPreview(sessions, experiments, workingMapReady);
      this.renderSection5DailyCard();
      this.renderSection6RecentHistory(sessions, experiments);
      this.renderSection7DeepDive(recentSession);
    }

    // -------------------------------------------------------------
    // SECTION 1: 오늘 무엇이 마음에 걸리나요? (Today's Scene)
    // -------------------------------------------------------------
    renderSection1TodayScene(recentSession) {
      const sec1 = document.getElementById('sec-today-scene');
      if (!sec1) return;

      const primary = this.homeState.primaryCTA;
      const secondary = this.homeState.secondaryCTA;

      sec1.innerHTML = `
        <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <!-- 헤더 & 온화한 인사 -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black text-[#0F766E] tracking-wider uppercase">PAST &rarr; PRESENT &rarr; NEXT</span>
              <span class="text-[11px] text-slate-400 font-medium">${this.homeState.sourceHint}</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              오늘은 어떤 장면이 가장 마음에 걸리나요?
            </h1>
            <p class="text-xs text-slate-500">
              ${this.homeState.bannerNotice}
            </p>
          </div>

          <!-- 고민 입력창 (민감 고민 자동채움 절대 금지) -->
          <div class="space-y-2">
            <label for="home-concern-input" class="sr-only">오늘 마음에 걸리는 장면</label>
            <textarea id="home-concern-input" rows="3" class="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 outline-none transition" placeholder="예: 회의에서 의견을 말하지 못하고 계속 후회 중이에요..."></textarea>

            <!-- Continuity Mode 토글 (지난 장면에서 이어보기 - 기본 OFF) -->
            ${recentSession ? `
              <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-slate-400">🔗</span>
                  <span class="text-slate-600 font-medium">지난 발견(“${recentSession.cardTitle}”)과 연결해서 볼까요?</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="toggle-continuity-mode" class="sr-only peer" ${this.continuityMode ? 'checked' : ''}>
                  <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0F766E]"></div>
                </label>
              </div>
            ` : ''}
          </div>

          <!-- 액션 버튼군 (One Primary CTA 원칙) -->
          <div class="flex flex-col sm:flex-row gap-2 pt-1">
            <button type="button" id="btn-home-start-flow" class="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-1.5">
              <span>${primary.label}</span>
            </button>
            <button type="button" id="btn-home-daily-card" class="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition">
              ${secondary.label}
            </button>
          </div>
        </div>
      `;

      // 이벤트 바인딩
      const continuityToggle = document.getElementById('toggle-continuity-mode');
      if (continuityToggle) {
        continuityToggle.addEventListener('change', (e) => {
          this.continuityMode = e.target.checked;
          trackSafeHomeEvent('continue_previous_clicked', { enabled: this.continuityMode });
        });
      }

      // 플로우 시작 버튼
      document.getElementById('btn-home-start-flow').addEventListener('click', () => {
        const query = (document.getElementById('home-concern-input').value || '').trim();
        this.handleStartFlow(query, primary.action, primary.targetId);
      });

      // 오늘의 카드 버튼
      document.getElementById('btn-home-daily-card').addEventListener('click', () => {
        this.openDailyCard();
      });
    }

    // -------------------------------------------------------------
    // SECTION 2: 지난번 선택 (Active Experiment)
    // -------------------------------------------------------------
    renderSection2PastChoice(activeExp) {
      const sec2 = document.getElementById('sec-past-choice');
      if (!sec2) return;

      // 활성 실험이 없으면 섹션을 억지로 채우지 않고 숨기거나 아주 가볍게 안내
      if (!activeExp) {
        sec2.style.display = 'none';
        return;
      }

      sec2.style.display = 'block';
      sec2.innerHTML = `
        <div class="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                🌱 지난번 선택
              </span>
              <span class="text-slate-400 text-[11px]">아직 결과를 확인하지 않은 선택</span>
            </div>
            <span class="text-slate-400 text-[11px]">${formatSimpleDate(activeExp.createdAt)}</span>
          </div>

          <div class="space-y-1">
            <div class="text-xs text-slate-300">내 예상: "${escapeHtml(activeExp.expectedResult)}"</div>
            <div class="text-sm sm:text-base font-bold text-white">행동: "${escapeHtml(activeExp.selectedAction)}"</div>
          </div>

          <div class="pt-2 flex items-center justify-between border-t border-slate-700/60">
            <span class="text-[11px] text-slate-400">결과를 바꾸기보다 일어나는 일을 봅니다.</span>
            <button type="button" id="btn-sec2-followup" class="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-xs">
              어떻게 됐는지 기록하기 &rarr;
            </button>
          </div>
        </div>
      `;

      const btnFollowup = document.getElementById('btn-sec2-followup');
      if (btnFollowup) {
        btnFollowup.addEventListener('click', () => {
          trackSafeHomeEvent('active_experiment_opened', { experimentId: activeExp.experimentId });
          if (window.MyungsimExperiment && window.MyungsimExperiment.ui) {
            window.MyungsimExperiment.ui.openFollowupModal(activeExp.experimentId);
          }
        });
      }
    }

    // -------------------------------------------------------------
    // SECTION 3: 최근 발견 (Recent Discovery)
    // -------------------------------------------------------------
    renderSection3RecentDiscovery(recentSession, experiments) {
      const sec3 = document.getElementById('sec-recent-discovery');
      if (!sec3) return;

      if (!recentSession) {
        sec3.innerHTML = `
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase">최근 발견</span>
            <div class="text-xs text-slate-600 leading-relaxed">
              아직 저장된 발견이 없습니다. 오늘 마음에 걸리는 질문 하나를 1분 동안 관찰해보세요.
            </div>
          </div>
        `;
        return;
      }

      // 개인 원문은 감추고 공개 질문 및 10% 행동 위주로 표시
      sec3.innerHTML = `
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#0F766E] uppercase">💡 최근 발견</span>
            <span class="text-[11px] text-slate-400">${formatSimpleDate(recentSession.timestamp)}</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-900">${escapeHtml(recentSession.cardTitle)}</h3>
            <p class="text-xs text-slate-600">"${escapeHtml(recentSession.question)}"</p>
          </div>

          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <div class="text-slate-700">
              선택한 10%: <strong>"${escapeHtml(recentSession.chosenAction)}"</strong>
            </div>
            <a href="/my/experiments.html" class="text-[#0F766E] hover:underline font-bold text-[11px] shrink-0 ml-2">
              기록 보기 &rarr;
            </a>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // SECTION 4: 내 작동지도 프리뷰 (Working Map Compact)
    // -------------------------------------------------------------
    renderSection4WorkingMapPreview(sessions, experiments, workingMapReady) {
      const sec4 = document.getElementById('sec-working-map');
      if (!sec4) return;

      if (!workingMapReady) {
        sec4.innerHTML = `
          <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase">내 작동지도</span>
            <div class="text-xs text-slate-600 leading-relaxed">
              반복을 말하기에는 아직 기록이 충분하지 않습니다.
            </div>
            <div class="pt-1">
              <button type="button" onclick="document.getElementById('home-concern-input').focus()" class="text-[#0F766E] hover:underline font-bold text-xs">
                오늘 장면 하나 기록하기 &rarr;
              </button>
            </div>
          </div>
        `;
        return;
      }

      const activeOrDone = experiments.find(e => e.status === 'DONE' || e.status === 'PARTIAL');
      const trigger = sessions[0] ? sessions[0].cardTitle : '마음의 긴장';
      const actual = activeOrDone && activeOrDone.followup ? activeOrDone.followup.actualResult : '불안은 있었지만 버틸 수 있었음';

      sec4.innerHTML = `
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-[#0F766E] uppercase">🗺️ 최근 내 작동지도</span>
            <a href="/my/working-map.html" class="text-xs text-slate-500 hover:text-[#0F766E] font-bold">전체 지도 &rarr;</a>
          </div>

          <!-- 컴팩트 파이프라인 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">TRIGGER</span>
              <div class="font-bold text-slate-800 text-[11px] truncate mt-0.5">${escapeHtml(trigger)}</div>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">STORY</span>
              <div class="font-bold text-slate-800 text-[11px] truncate mt-0.5">통제 불가능 공포</div>
            </div>
            <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
              <span class="text-[9px] font-bold text-teal-700 block uppercase">NEW ACTION</span>
              <div class="font-bold text-[11px] truncate mt-0.5">10% 작은 시도</div>
            </div>
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span class="text-[9px] font-bold text-emerald-700 block uppercase">ACTUAL</span>
              <div class="font-bold text-[11px] truncate mt-0.5">실제 데이터 확보</div>
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 text-[11px] text-teal-950 flex items-center gap-2">
            <span>🌿</span>
            <span>최근에는 바로 확인하지 않고 잠깐 기다리거나 작게 시작하는 선택도 나타났습니다.</span>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // SECTION 5: 오늘의 명심카드 (Daily Card)
    // -------------------------------------------------------------
    renderSection5DailyCard() {
      const sec5 = document.getElementById('sec-daily-card');
      if (!sec5) return;

      sec5.innerHTML = `
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase">오늘의 명심카드</span>
            <span class="text-[10px] text-slate-400">가벼운 1분 만남</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-900">오늘은 질문 하나만 가볍게 만나보고 싶다면</h3>
            <p class="text-xs text-slate-500">
              미래를 맞히는 카드가 아닙니다. 지금의 나를 잠깐 비추어보는 질문입니다.
            </p>
          </div>

          <button type="button" id="btn-draw-daily-card" class="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5">
            <span>🎴 오늘의 카드 한 장 뽑기</span>
          </button>
        </div>
      `;

      document.getElementById('btn-draw-daily-card').addEventListener('click', () => {
        this.openDailyCard();
      });
    }

    // -------------------------------------------------------------
    // SECTION 6: 최근 기록 (Recent History)
    // -------------------------------------------------------------
    renderSection6RecentHistory(sessions, experiments) {
      const sec6 = document.getElementById('sec-recent-history');
      if (!sec6) return;

      if (sessions.length === 0 && experiments.length === 0) {
        sec6.innerHTML = '';
        return;
      }

      const recentItems = sessions.slice(0, 3);

      sec6.innerHTML = `
        <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase">최근 기록</span>
            <a href="/my/experiments.html" class="text-xs text-[#0F766E] hover:underline font-bold">전체 기록 보기 &rarr;</a>
          </div>

          <div class="space-y-2">
            ${recentItems.map(item => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div class="space-y-0.5 truncate pr-2">
                  <div class="font-bold text-slate-900 truncate">${escapeHtml(item.cardTitle)}</div>
                  <div class="text-[11px] text-slate-500 truncate">선택: "${escapeHtml(item.chosenAction)}"</div>
                </div>
                <span class="text-[10px] text-slate-400 shrink-0">${formatSimpleDate(item.timestamp)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // SECTION 7: 책 / 앱 Deep Dive (맥락형 자연스러운 연결)
    // -------------------------------------------------------------
    renderSection7DeepDive(recentSession) {
      const sec7 = document.getElementById('sec-deep-dive');
      if (!sec7) return;

      sec7.innerHTML = `
        <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">31권 시리즈 Deep Dive</span>
            <span class="text-[10px] text-slate-400">원리 탐독</span>
          </div>
          <h3 class="text-xs sm:text-sm font-bold text-white">
            “알고 있는데 왜 반복될까요?” 원리를 더 깊게 만나보기
          </h3>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            나를 평가하거나 고치는 것이 아니라, 몸과 뇌의 자동 반응을 이해할 때 선택의 공간이 열립니다.
          </p>
          <div class="pt-1">
            <a href="/library" class="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white transition">
              <span>명심 도서 라이브러리 둘러보기</span> &rarr;
            </a>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // 플로우 핸들러 (Safety 우선순위 적용)
    // -------------------------------------------------------------
    handleStartFlow(query, actionType, targetId) {
      trackSafeHomeEvent('primary_cta_clicked', {
        primaryAction: actionType,
        hasQuery: query.length > 0
      });

      // 1. 만약 활성 실험 팔로업 버튼을 눌렀다면
      if (actionType === 'follow_up_experiment' && targetId) {
        if (window.MyungsimExperiment && window.MyungsimExperiment.ui) {
          window.MyungsimExperiment.ui.openFollowupModal(targetId);
        }
        return;
      }

      // 2. 만약 지도 확인을 눌렀다면
      if (actionType === 'view_working_map') {
        window.location.href = '/my/working-map.html';
        return;
      }

      // 3. 새 고민 또는 1-Minute SCAN
      // ⚠️ Safety 우선순위 검사 (과거 패턴이나 지도를 완전히 덮고 Safety Route 최우선)
      if (query && window.MyeongsimAIRouter) {
        const safetyResult = window.MyeongsimAIRouter.checkSafety(query);
        if (safetyResult && !safetyResult.isSafe) {
          alert('🛡️ 긴급 안전망 안내:\n' + (safetyResult.message || '전문 상담 기관의 도움을 권장합니다.'));
          return;
        }
      }

      // 1-Minute Core Flow 열기
      if (window.myungsimCoreFlow) {
        window.myungsimCoreFlow.open(query);
      } else {
        window.location.href = `/?q=${encodeURIComponent(query)}`;
      }
    }

    openDailyCard() {
      trackSafeHomeEvent('daily_card_opened', {});
      // 랜덤 카드 1장 열기
      if (window.MIND_CARDS_DATA && window.MIND_CARDS_DATA.length > 0) {
        const randIdx = Math.floor(Math.random() * window.MIND_CARDS_DATA.length);
        const card = window.MIND_CARDS_DATA[randIdx];
        if (window.myungsimCoreFlow) {
          window.myungsimCoreFlow.open(card.cardTitle);
        } else {
          window.location.href = `/?card=${card.id}`;
        }
      } else {
        window.location.href = '/';
      }
    }

    attachEvents() {
      // Bottom Navigation 액션
      const navHome = document.getElementById('bnav-home');
      const navDiscover = document.getElementById('bnav-discover');
      const navHistory = document.getElementById('bnav-history');
      const navMap = document.getElementById('bnav-map');

      if (navHistory) {
        navHistory.addEventListener('click', () => trackSafeHomeEvent('history_opened', {}));
      }
      if (navMap) {
        navMap.addEventListener('click', () => trackSafeHomeEvent('working_map_opened', {}));
      }
    }
  }

  // -------------------------------------------------------------
  // 유틸리티 함수
  // -------------------------------------------------------------
  function formatSimpleDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // 6. 전역 네임스페이스 등록
  // -------------------------------------------------------------
  const personalHomeModule = {
    Auth: MyungsimAuth,
    RuleEngine: PersonalHomeRuleEngine,
    States: HOME_STATE,
    trackSafeEvent: trackSafeHomeEvent,
    ui: new MyungsimPersonalHomeUI(),
    init: function() {
      this.ui.init();
    }
  };

  window.MyungsimPersonalHome = personalHomeModule;

  // DOM 로드 시 자동 초기화
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', () => personalHomeModule.init());
    }
  } else if (typeof document !== 'undefined') {
    // 자동 호출 지연 (필요 요소가 준비된 후)
    setTimeout(() => personalHomeModule.init(), 50);
  }

})(window);
