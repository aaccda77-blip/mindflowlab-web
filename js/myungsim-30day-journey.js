/**
 * =================================================================
 * MYUNGSIM 30-DAY JOURNEY ENGINE v1
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * NOTICE → TRY → COMPARE → MAP → RETURN
 * Non-linear, Self-paced Guided Journey without Streaks or Shame
 * NO-AI Production Mode / Zero External AI Calls / 100% Privacy Isolated
 * =================================================================
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------
  // 1. 상수 및 설정 정의
  // -------------------------------------------------------------
  const STORAGE_KEY_JOURNEY_BASE = 'myungsim_30day_journey';

  const JOURNEY_STATUS = {
    NOT_STARTED: 'NOT_STARTED', // 여정 미시작
    ACTIVE: 'ACTIVE',           // 여정 진행 중
    PAUSED: 'PAUSED',           // 일시정지 (실패가 아님, 언제든 재개)
    COMPLETED: 'COMPLETED',     // 30일 윈도우 도달 또는 사용자 완료
    ARCHIVED: 'ARCHIVED'        // 보관됨
  };

  const JOURNEY_PHASE = {
    NOTICE: 'NOTICE',   // 지금 반복되는 장면 보기 (SCAN)
    TRY: 'TRY',         // 10% 다른 행동 하나 해보기 (ACTION)
    COMPARE: 'COMPARE', // 예상과 실제 비교하기 (EXPERIMENT)
    MAP: 'MAP',         // 최근 반복된 작동 보기 (WORKING MAP)
    RETURN: 'RETURN'    // 다음 삶의 장면으로 돌아가기 (RETURN TO LIFE)
  };

  const JOURNEY_INTENTIONS = [
    { id: 'notice', label: '지금 반복되는 장면을 조금 더 알아차리고 싶다' },
    { id: 'divide', label: '충동적인 반응과 실제 행동을 나눠보고 싶다' },
    { id: 'try_small', label: '부담 없는 작은 10% 행동을 시험해보고 싶다' },
    { id: 'see_map', label: '내 삶에서 반복되는 자동 작동지도를 보고 싶다' },
    { id: 'unsure', label: '아직 잘 모르겠지만 가볍게 시작해보고 싶다' }
  ];

  const FOCUS_SCENE_EXAMPLES = [
    '답장이 늦을 때 불안해서 바로 다시 확인하는 것',
    '부탁을 받으면 생각할 겨를 없이 YES부터 하는 것',
    '사소한 실수에도 하루 종일 자책하고 곱씹는 것',
    '완벽하게 준비되지 않으면 시작 자체를 미루는 것',
    '상대 눈치를 보느라 내 일정을 말하지 못하는 것',
    '아직 특정한 것은 없지만 일상 속에서 발견해보기'
  ];

  // -------------------------------------------------------------
  // 2. JourneyStore: 사용자별 네임스페이스 스토리지 & 세션 관리
  // -------------------------------------------------------------
  class JourneyStore {
    static getScopedKey() {
      let uid = 'guest';
      if (typeof window !== 'undefined' && window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) {
        uid = window.MyungsimPersonalHome.Auth.getCurrentUserId() || 'guest';
      }
      return `${STORAGE_KEY_JOURNEY_BASE}_${uid}`;
    }

    static getJourney() {
      try {
        const key = this.getScopedKey();
        let raw = localStorage.getItem(key);
        // 레거시 호환
        if (!raw) raw = localStorage.getItem(STORAGE_KEY_JOURNEY_BASE);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn('[JourneyStore] read error:', e);
        return null;
      }
    }

    static saveJourney(journey) {
      try {
        const key = this.getScopedKey();
        localStorage.setItem(key, JSON.stringify(journey));
        localStorage.setItem(STORAGE_KEY_JOURNEY_BASE, JSON.stringify(journey));
      } catch (e) {
        console.warn('[JourneyStore] save error:', e);
      }
    }

    /**
     * 여정 시작
     */
    static startJourney(options = {}) {
      const now = options.currentDate ? new Date(options.currentDate) : new Date();
      const windowEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30일 윈도우

      const journey = {
        journeyId: 'jrn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId: (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) ? window.MyungsimPersonalHome.Auth.getCurrentUserId() : 'guest',
        startedAt: now.toISOString(),
        windowEndAt: windowEndDate.toISOString(),
        status: JOURNEY_STATUS.ACTIVE,
        intention: options.intention || 'notice',
        focusSceneDescription: options.focusSceneDescription || '일상 속 반복되는 한 장면',
        currentPhase: JOURNEY_PHASE.NOTICE,
        experiences: [], // 30일 동안의 경험 스냅샷 목록
        reviewSnapshot: null,
        updatedAt: now.toISOString()
      };

      this.saveJourney(journey);
      trackSafeJourneyEvent('journey_started', { journeyId: journey.journeyId, intention: journey.intention });
      return journey;
    }

    /**
     * 일시정지 (실패가 아님)
     */
    static pauseJourney() {
      const journey = this.getJourney();
      if (!journey) return null;
      journey.status = JOURNEY_STATUS.PAUSED;
      journey.updatedAt = new Date().toISOString();
      this.saveJourney(journey);
      trackSafeJourneyEvent('journey_paused', { journeyId: journey.journeyId });
      return journey;
    }

    /**
     * 재개 (이어가기)
     */
    static resumeJourney() {
      const journey = this.getJourney();
      if (!journey) return null;
      journey.status = JOURNEY_STATUS.ACTIVE;
      journey.updatedAt = new Date().toISOString();
      this.saveJourney(journey);
      trackSafeJourneyEvent('journey_resumed', { journeyId: journey.journeyId });
      return journey;
    }

    /**
     * 여정 완료 (마치기)
     */
    static completeJourney(reviewSnapshot = null) {
      const journey = this.getJourney();
      if (!journey) return null;
      journey.status = JOURNEY_STATUS.COMPLETED;
      journey.completedAt = new Date().toISOString();
      journey.reviewSnapshot = reviewSnapshot;
      this.saveJourney(journey);
      trackSafeJourneyEvent('journey_completed', { journeyId: journey.journeyId });
      return journey;
    }

    /**
     * 여정 삭제 (Journey만 삭제 vs 기록까지 동시 삭제 지원)
     */
    static deleteJourney(includePersonalRecords = false) {
      const key = this.getScopedKey();
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(STORAGE_KEY_JOURNEY_BASE);

        if (includePersonalRecords) {
          // 세션 및 실험도 동시 삭제 요청 시
          if (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) {
            const sessKey = window.MyungsimPersonalHome.Auth.getScopedKey('myeongsim_personal_sessions');
            const expKey = window.MyungsimPersonalHome.Auth.getScopedKey('myungsim_behavior_experiments');
            localStorage.removeItem(sessKey);
            localStorage.removeItem(expKey);
          }
        }
      } catch (e) {}
      return true;
    }

    /**
     * 경험 항목 추가 (SCAN 또는 실험 연결)
     */
    static recordExperience(entry = {}) {
      const journey = this.getJourney();
      if (!journey || journey.status !== JOURNEY_STATUS.ACTIVE) return;

      const expItem = {
        id: 'jexp_' + Date.now(),
        type: entry.type || 'scan', // 'scan', 'experiment', 'map'
        cardId: entry.cardId || '',
        cardTitle: entry.cardTitle || '',
        action: entry.action || '',
        actualResult: entry.actualResult || '',
        phase: entry.phase || journey.currentPhase,
        recordedAt: new Date().toISOString()
      };

      journey.experiences.unshift(expItem);
      journey.updatedAt = new Date().toISOString();
      this.saveJourney(journey);

      if (expItem.type === 'scan') trackSafeJourneyEvent('journey_scene_added', { cardId: expItem.cardId });
      else if (expItem.type === 'experiment') trackSafeJourneyEvent('journey_experiment_created', { cardId: expItem.cardId });
    }
  }

  // -------------------------------------------------------------
  // 3. JourneyStateMachine: 결정론적 상태 머신 (Deterministic, Zero-AI)
  // -------------------------------------------------------------
  class JourneyStateMachine {
    /**
     * 현재 여정 맥락을 분석하여 다음 액션 상태 도출
     * @param {Object} journey 
     * @param {Array} sessions 
     * @param {Array} experiments 
     * @param {Date|null} currentMockDate (Time Travel Test 지원)
     * @returns {Object} { nextStep, phase, isWindowExpired, daysRemaining, actionPrompt }
     */
    static evaluate(journey, sessions = [], experiments = [], currentMockDate = null) {
      if (!journey || journey.status === JOURNEY_STATUS.NOT_STARTED) {
        return {
          status: JOURNEY_STATUS.NOT_STARTED,
          nextStep: 'OFFER_START',
          phase: JOURNEY_PHASE.NOTICE,
          actionPrompt: '30일 동안 내 작동을 가볍게 관찰해볼까요?'
        };
      }

      if (journey.status === JOURNEY_STATUS.PAUSED) {
        return {
          status: JOURNEY_STATUS.PAUSED,
          nextStep: 'RESUME_OR_PAUSE',
          phase: journey.currentPhase,
          actionPrompt: '잠시 멈춰둔 여정입니다. 준비되셨을 때 언제든 이어가실 수 있습니다.'
        };
      }

      // 날짜 계산 (Time Travel Test Clock 지원)
      const now = currentMockDate ? new Date(currentMockDate) : new Date();
      const end = new Date(journey.windowEndAt);
      const isWindowExpired = now.getTime() >= end.getTime();
      const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // 30일 윈도우 도달 시: 30-Day Review 제안
      if (isWindowExpired || journey.status === JOURNEY_STATUS.COMPLETED) {
        return {
          status: isWindowExpired ? JOURNEY_STATUS.COMPLETED : journey.status,
          nextStep: 'REVIEW_30DAY',
          phase: JOURNEY_PHASE.RETURN,
          isWindowExpired: true,
          daysRemaining: 0,
          actionPrompt: '30일 관찰 기간이 지났습니다. 지난 경험의 흐름을 가볍게 돌아봅니다.'
        };
      }

      // 진행 중인 활성 실험 확인 (PLANNED, TRYING, ACTIVE)
      const activeExp = experiments.find(e => e.status === 'PLANNED' || e.status === 'TRYING' || e.status === 'ACTIVE') || null;
      if (activeExp) {
        return {
          status: JOURNEY_STATUS.ACTIVE,
          nextStep: 'WAIT_OR_FOLLOWUP',
          phase: JOURNEY_PHASE.COMPARE,
          activeExp: activeExp,
          isWindowExpired: false,
          daysRemaining: daysRemaining,
          actionPrompt: '지난번 선택: 실제로 무슨 일이 일어났는지 확인해볼 차례입니다.'
        };
      }

      // 최근 세션 확인
      const hasRecentScene = sessions.length > 0;
      const completedExpCount = experiments.filter(e => e.status === 'DONE' || e.status === 'PARTIAL' || e.status === 'COMPLETED').length;

      // 기록이 3개 이상 누적되어 반복 작동지도가 보일 때
      if (sessions.length >= 3 && completedExpCount >= 1) {
        return {
          status: JOURNEY_STATUS.ACTIVE,
          nextStep: 'MAP',
          phase: JOURNEY_PHASE.MAP,
          isWindowExpired: false,
          daysRemaining: daysRemaining,
          actionPrompt: '최근 기록에서 반복해서 나타난 흐름이 있을까요? 작동지도를 살펴봅니다.'
        };
      }

      // 완료된 실험이 있고 세션이 있는 경우 (MAP 또는 RETURN)
      if (completedExpCount >= 1) {
        return {
          status: JOURNEY_STATUS.ACTIVE,
          nextStep: 'MAP',
          phase: JOURNEY_PHASE.RETURN,
          isWindowExpired: false,
          daysRemaining: daysRemaining,
          actionPrompt: '하나의 실험을 마쳤습니다. 다음 삶의 장면으로 가볍게 돌아가거나 지도를 봅니다.'
        };
      }

      // 최근 세션은 있으나 행동실험이 없는 경우
      if (hasRecentScene) {
        return {
          status: JOURNEY_STATUS.ACTIVE,
          nextStep: 'TRY',
          phase: JOURNEY_PHASE.TRY,
          isWindowExpired: false,
          daysRemaining: daysRemaining,
          actionPrompt: '다음에 비슷한 장면이 오면 10% 다르게 해볼 행동을 품어봅니다.'
        };
      }

      // 새로운 장면 관찰 시작
      return {
        status: JOURNEY_STATUS.ACTIVE,
        nextStep: 'START_SCENE',
        phase: JOURNEY_PHASE.NOTICE,
        isWindowExpired: false,
        daysRemaining: daysRemaining,
        actionPrompt: '오늘 마음에 걸리는 한 장면을 1분 동안 있는 그대로 관찰합니다.'
      };
    }
  }

  // -------------------------------------------------------------
  // 4. JourneyReviewEngine: 30일 회고 엔진 (8대 질문, Before/Recent 비교)
  // (성적표/점수/상향그래프/AI추론 금지 준수)
  // -------------------------------------------------------------
  class JourneyReviewEngine {
    /**
     * 기록에 기반한 8대 회고 질문 응답 및 Before/Recent 비교 생성
     */
    static generateReview(journey, sessions = [], experiments = []) {
      const hasEnough = (sessions.length >= 2 || experiments.length >= 1);

      // 1. 어떤 장면을 자주 봤는가
      const cardCounts = {};
      sessions.forEach(s => {
        const title = s.cardTitle || s.hookName || s.scene || '일상 관찰';
        cardCounts[title] = (cardCounts[title] || 0) + 1;
      });
      let topScene = '기록 없음';
      let maxSceneCnt = 0;
      for (const [k, v] of Object.entries(cardCounts)) {
        if (v > maxSceneCnt) {
          maxSceneCnt = v;
          topScene = `${k} (${v}회 기록됨)`;
        }
      }

      // 2. 어떤 STORY가 반복됐는가
      const topStory = (sessions[0] && sessions[0].tags && sessions[0].tags.story && sessions[0].tags.story[0])
        ? `“${sessions[0].tags.story[0]}” 등 통제/불안 해석`
        : (sessions[0] ? (sessions[0].scene || '상황을 내가 통제해야 한다는 생각') : '기록 없음');

      // 3. 몸에서는 어떤 신호가 나타났는가
      const topBody = (sessions[0] && sessions[0].tags && sessions[0].tags.body && sessions[0].tags.body[0])
        ? sessions[0].tags.body[0]
        : '가슴 답답함 및 호흡 가빠짐';

      // 4. 어떤 URGE가 반복됐는가
      const topUrge = (sessions[0] && sessions[0].tags && sessions[0].tags.urge && sessions[0].tags.urge[0])
        ? sessions[0].tags.urge[0]
        : '즉각 확인하거나 회피하려는 충동';

      // 5. 어떤 행동을 주로 했는가 (Before: 초기 기록)
      const earliestSession = sessions[sessions.length - 1];
      const beforeAction = earliestSession
        ? (earliestSession.chosenAction || earliestSession.action10 || earliestSession.scene || '평소처럼 즉각 반응하기')
        : '기록 없음';

      // 6. 어떤 새로운 선택을 시험했는가 (Recent: 최근 실험)
      const recentDoneExp = experiments.find(e => e.status === 'DONE' || e.status === 'PARTIAL' || e.status === 'COMPLETED');
      const recentAction = recentDoneExp
        ? (recentDoneExp.selectedAction || recentDoneExp.action10 || '10% 작은 행동')
        : (sessions[0] ? (sessions[0].chosenAction || sessions[0].action10) : '기록 없음');

      // 7. 예상과 실제가 어떻게 달랐는가
      let compareSummary = '아직 예상과 실제를 비교한 기록이 없습니다.';
      if (recentDoneExp) {
        const expct = recentDoneExp.expectedResult || recentDoneExp.expectedOutcome || '불안이 커질 것 같음';
        const act = (recentDoneExp.followup && recentDoneExp.followup.actualResult) || recentDoneExp.actualOutcome || recentDoneExp.actualResult || '실제로 버틸 수 있었음';
        compareSummary = `예상: “${expct}” &rarr; 실제: “${act}”`;
      }

      // 8. 다음에도 가져가고 싶은 선택
      const nextChoice = (recentDoneExp && recentDoneExp.followup && recentDoneExp.followup.nextChoice)
        ? formatNextChoiceText(recentDoneExp.followup.nextChoice)
        : '작게 시작하고 잠깐 보류해보는 여유';

      // Before / Recent 사실 비교
      const beforeText = earliestSession
        ? `초기 기록: "${beforeAction}"`
        : '초기 기록 없음';
      const recentText = recentDoneExp
        ? `최근 기록: "${recentAction}" (${(recentDoneExp.followup && recentDoneExp.followup.actualResult) || recentDoneExp.actualOutcome || '시도됨'})`
        : (sessions[0] ? `최근 선택: "${sessions[0].chosenAction || sessions[0].action10}"` : '최근 기록 없음');

      // 변화 요약 문구 (과장 금지, 악화 시 사실 인정)
      let changeSummary = '큰 변화는 아직 확인되지 않았습니다. 그래도 어떤 장면이 반복되는지는 조금 더 분명해졌을 수 있습니다.';
      if (recentDoneExp && (recentDoneExp.status === 'DONE' || recentDoneExp.status === 'COMPLETED')) {
        changeSummary = '초기 기록에서는 즉각 반응하는 습관이 자주 나타났고, 최근에는 잠깐 보류하거나 작게 시작하는 선택도 기록되었습니다.';
      }

      return {
        hasEnoughRecords: hasEnough,
        isEligible: hasEnough,
        totalSessions: sessions.length,
        totalExperiments: experiments.length,
        items: [
          { q: '1. 어떤 장면을 자주 보았나요?', a: topScene },
          { q: '2. 어떤 생각이 자주 스쳤나요?', a: topStory },
          { q: '3. 몸에서는 어떤 신호가 먼저 왔나요?', a: topBody },
          { q: '4. 어떤 충동이 올라왔나요?', a: topUrge },
          { q: '5. 평소 어떤 행동을 주로 했나요?', a: beforeAction },
          { q: '6. 어떤 새로운 10%를 시도해봤나요?', a: recentAction },
          { q: '7. 예상과 실제는 어떻게 달랐나요?', a: compareSummary },
          { q: '8. 다음에도 가져가고 싶은 선택은 무엇인가요?', a: nextChoice }
        ],
        beforeRecentComparison: {
          before: beforeText,
          recent: recentText
        },
        changeSummary: changeSummary
      };
    }

    static generate30DayReview(journey, sessions = [], experiments = []) {
      return this.generateReview(journey, sessions, experiments);
    }
  }

  function formatNextChoiceText(val) {
    const map = {
      same_again: '같은 10% 행동 다시 시도하기',
      smaller: '조금 더 작은 깃털 행동으로 시작하기',
      bigger: '조금 더 넓은 행동으로 확장하기',
      different: '다른 새로운 작은 시도 해보기',
      undecided: '아직 정하지 않고 상황에 맞추기'
    };
    return map[val] || '상황을 보고 선택하기';
  }

  // -------------------------------------------------------------
  // 5. 프라이버시 엄격 분리 분석 트래커 (원문 0건 보장)
  // -------------------------------------------------------------
  function trackSafeJourneyEvent(eventName, payload = {}) {
    const safeData = {
      journeyId: payload.journeyId || undefined,
      phase: payload.phase || undefined,
      status: payload.status || undefined,
      intention: payload.intention || undefined,
      cardId: payload.cardId || undefined,
      daysRemaining: payload.daysRemaining !== undefined ? payload.daysRemaining : undefined,
      timestamp: Date.now()
    };

    // 원문 텍스트 원천 차단 (블랙리스트 엄격 배제)
    delete safeData.sceneText;
    delete safeData.storyText;
    delete safeData.actualResult;
    delete safeData.learning;
    delete safeData.focusSceneDescription;
    delete safeData.secretJournalText;
    delete safeData.privateSceneDetail;

    if (typeof window.trackMindEvent === 'function') {
      window.trackMindEvent(eventName, safeData);
    }
    if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent(eventName, { detail: safeData }));
    }
  }

  // -------------------------------------------------------------
  // 6. JourneyUI: 전용 페이지 렌더러 & Personal Home 위젯
  // -------------------------------------------------------------
  class JourneyUI {
    constructor() {
      this.testMockDate = null; // Time Travel Test 지원
    }

    setTestMockDate(dateStr) {
      this.testMockDate = dateStr ? new Date(dateStr) : null;
    }

    /**
     * Personal Home v2 내에 30일 여정 위젯 주입
     */
    renderHomeWidget() {
      const container = document.getElementById('sec-30day-journey-home');
      if (!container) return;

      const journey = JourneyStore.getJourney();
      const sessions = (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) ? window.MyungsimPersonalHome.Auth.getUserSessions() : [];
      const experiments = (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) ? window.MyungsimPersonalHome.Auth.getUserExperiments() : [];
      const stateEval = JourneyStateMachine.evaluate(journey, sessions, experiments, this.testMockDate);

      // 1) 미시작 상태: 가벼운 시작 제안 카드 (강제하지 않음, 닫기 가능)
      if (stateEval.status === JOURNEY_STATUS.NOT_STARTED) {
        container.innerHTML = `
          <div class="p-5 rounded-3xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-md space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 font-bold border border-teal-400/30">
                🧭 30-Day Guided Journey
              </span>
              <span class="text-slate-400 text-[11px]">자기 속도대로 관찰</span>
            </div>

            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">30일 동안 내 작동을 가볍게 관찰해볼까요?</h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                매일 출석하는 챌린지가 아닙니다. 필요한 순간에 돌아와 한 장면씩 확인하고 내 작동지도를 만들어갑니다.
              </p>
            </div>

            <div class="pt-2 flex items-center gap-2">
              <a href="/my/journey.html" class="flex-1 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs text-center transition shadow-xs">
                30일 여정 시작하기 &rarr;
              </a>
              <button type="button" onclick="document.getElementById('sec-30day-journey-home').style.display='none'" class="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition">
                다음에
              </button>
            </div>
          </div>
        `;
        container.style.display = 'block';
        return;
      }

      // 2) 여정 진행 중 (ACTIVE or PAUSED)
      const isPaused = journey.status === JOURNEY_STATUS.PAUSED;
      const daysLeft = stateEval.daysRemaining;

      container.innerHTML = `
        <div class="p-5 rounded-3xl bg-white border border-teal-200 shadow-2xs space-y-3">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full ${isPaused ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-[#0F766E]'} font-bold">
                ${isPaused ? '⏸️ 30일 여정 일시정지' : '🧭 30일 여정 진행 중'}
              </span>
              <span class="text-slate-400 text-[11px]">약 ${daysLeft}일 남은 관찰 기간</span>
            </div>
            <a href="/my/journey.html" class="text-[#0F766E] font-bold text-[11px] hover:underline">여정 지도 &rarr;</a>
          </div>

          <div class="space-y-1 text-xs">
            <div class="text-slate-500">현재 Phase: <strong>${stateEval.phase}</strong></div>
            <div class="font-bold text-slate-800 text-sm">“${stateEval.actionPrompt}”</div>
          </div>

          <div class="pt-1">
            <a href="/my/journey.html" class="block w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] font-bold text-xs text-center transition border border-teal-200">
              여정으로 이어가기 &rarr;
            </a>
          </div>
        </div>
      `;
      container.style.display = 'block';
    }

    /**
     * 30일 전용 페이지 (/my/journey.html) 렌더러
     */
    renderJourneyPage() {
      const pageRoot = document.getElementById('myungsim-journey-page-root');
      if (!pageRoot) return;

      const journey = JourneyStore.getJourney();
      const sessions = (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) ? window.MyungsimPersonalHome.Auth.getUserSessions() : [];
      const experiments = (window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) ? window.MyungsimPersonalHome.Auth.getUserExperiments() : [];
      const stateEval = JourneyStateMachine.evaluate(journey, sessions, experiments, this.testMockDate);

      // 여정 미시작 시: 온보딩 인트로 렌더링
      if (!journey || journey.status === JOURNEY_STATUS.NOT_STARTED) {
        this.renderOnboarding(pageRoot);
        return;
      }

      // 여정 진행/완료 화면 렌더링
      this.renderActiveJourneyView(pageRoot, journey, sessions, experiments, stateEval);
    }

    // -------------------------------------------------------------
    // 여정 온보딩 (Start Flow)
    // -------------------------------------------------------------
    renderOnboarding(container) {
      container.innerHTML = `
        <div class="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div class="space-y-2">
            <span class="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0F766E] font-bold text-xs">GUIDED JOURNEY</span>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">나의 30일 명심 여정</h1>
            <p class="text-xs text-slate-500 leading-relaxed">
              30일 후 다른 사람이 되는 것이 목표가 아닙니다.<br>
              <strong>그동안 반복해서 나타난 장면과 조금 달라진 선택을 함께 봅니다.</strong>
            </p>
          </div>

          <!-- 1. 의도 선택 -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">이번 기간의 마음에 드는 의도를 하나 골라보세요:</label>
            <div class="space-y-1.5" id="journey-intention-group">
              ${JOURNEY_INTENTIONS.map((item, idx) => `
                <button type="button" class="w-full p-3 rounded-2xl border border-slate-200 text-left text-xs transition intention-btn ${idx === 0 ? 'bg-teal-50 border-teal-300 font-bold text-[#0F766E]' : 'hover:bg-slate-50 text-slate-700'}" data-id="${item.id}">
                  ${item.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 2. 가볍게 볼 장면 예시 -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">요즘 가장 다르게 보고 싶은 장면이 있나요?</label>
            <div class="space-y-1.5">
              ${FOCUS_SCENE_EXAMPLES.slice(0, 4).map((ex, idx) => `
                <button type="button" class="w-full p-2.5 rounded-xl border border-slate-200 text-left text-xs focus-btn ${idx === 0 ? 'bg-teal-50 border-teal-300 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'}" data-val="${ex}">
                  &bull; ${ex}
                </button>
              `).join('')}
            </div>
            <input type="text" id="custom-focus-scene" class="w-full p-3 rounded-xl border border-slate-200 text-xs mt-1" placeholder="직접 한 문장으로 적어도 좋아요..." />
          </div>

          <!-- 철학 안내 문구 -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            💡 <strong>출석 압박 없음:</strong> 매일 하지 않아도 괜찮습니다. 바쁜 날은 쉬고, 마음에 걸리는 일이 생긴 순간에 돌아와 한 장면씩 기록합니다.
          </div>

          <!-- 시작 버튼군 -->
          <div class="space-y-2 pt-2">
            <button type="button" id="btn-start-journey-confirm" class="w-full py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm shadow-xs transition">
              🧭 30일 여정 시작하기
            </button>
            <a href="/my/home.html" class="block text-center text-xs text-slate-400 hover:text-slate-700 font-medium py-1">
              그냥 지금처럼 자유롭게 사용하기 &rarr;
            </a>
          </div>
        </div>
      `;

      let selectedIntention = 'notice';
      let selectedScene = FOCUS_SCENE_EXAMPLES[0];

      container.querySelectorAll('.intention-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.intention-btn').forEach(b => {
            b.className = 'w-full p-3 rounded-2xl border border-slate-200 text-left text-xs transition intention-btn hover:bg-slate-50 text-slate-700';
          });
          btn.className = 'w-full p-3 rounded-2xl border border-teal-300 text-left text-xs transition intention-btn bg-teal-50 font-bold text-[#0F766E]';
          selectedIntention = btn.getAttribute('data-id');
        });
      });

      container.querySelectorAll('.focus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.focus-btn').forEach(b => {
            b.className = 'w-full p-2.5 rounded-xl border border-slate-200 text-left text-xs focus-btn text-slate-600 hover:bg-slate-50';
          });
          btn.className = 'w-full p-2.5 rounded-xl border border-teal-300 text-left text-xs focus-btn bg-teal-50 font-bold text-slate-900';
          selectedScene = btn.getAttribute('data-val');
        });
      });

      document.getElementById('btn-start-journey-confirm').addEventListener('click', () => {
        const customInput = document.getElementById('custom-focus-scene').value.trim();
        const finalScene = customInput || selectedScene;

        JourneyStore.startJourney({
          intention: selectedIntention,
          focusSceneDescription: finalScene
        });

        this.renderJourneyPage();
      });
    }

    // -------------------------------------------------------------
    // 여정 활성 화면 (Active View & 세로 타임라인)
    // -------------------------------------------------------------
    renderActiveJourneyView(container, journey, sessions, experiments, stateEval) {
      const isPaused = journey.status === JOURNEY_STATUS.PAUSED;
      const isCompleted = stateEval.isWindowExpired || journey.status === JOURNEY_STATUS.COMPLETED;
      const daysLeft = stateEval.daysRemaining;

      container.innerHTML = `
        <div class="space-y-6">
          <!-- 상단 윈도우 배너 (출석일수/연속일 없음) -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-[#0F766E] uppercase">나의 30일 명심 여정</span>
              <div class="flex items-center gap-2">
                <button type="button" id="btn-journey-settings" class="text-slate-400 hover:text-slate-700 text-xs font-medium">
                  ⚙️ 여정 관리
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 class="text-xl font-black text-slate-900 tracking-tight">
                  ${isCompleted ? '30일의 관찰을 마쳤습니다' : (isPaused ? '잠시 멈춰둔 여정' : '필요한 순간에 돌아와 한 장면씩 봅니다')}
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">
                  관찰 기간: ${formatDateOnly(journey.startedAt)} ~ ${formatDateOnly(journey.windowEndAt)}
                  ${!isCompleted ? `(약 ${daysLeft}일 남음)` : ''}
                </p>
              </div>

              ${!isCompleted ? `
                <div class="flex items-center gap-2">
                  ${isPaused ? `
                    <button type="button" id="btn-journey-resume" class="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition">
                      ▶️ 다시 이어가기
                    </button>
                  ` : `
                    <button type="button" id="btn-journey-pause" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition">
                      ⏸️ 잠시 멈춤
                    </button>
                  `}
                </div>
              ` : ''}
            </div>

            <!-- 고정 철학 문구 -->
            <div class="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-950 flex items-center gap-2">
              <span>🌿</span>
              <span>“기록을 많이 남기는 것이 목표가 아닙니다. 한 장면을 더 정확히 보고, 한 번 더 선택할 수 있게 되는 것이 목적입니다.”</span>
            </div>
          </div>

          <!-- 5대 Phase 인디케이터 (비선형 안내) -->
          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span class="text-[10px] font-bold text-slate-400 block uppercase">5 Phase Guided Flow (자유 순환)</span>
            <div class="grid grid-cols-5 gap-1 text-center text-[11px] font-bold">
              <div class="py-2 px-1 rounded-xl ${stateEval.phase === 'NOTICE' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-slate-50 text-slate-500'}">
                1. NOTICE<br><span class="text-[9px] font-normal">장면보기</span>
              </div>
              <div class="py-2 px-1 rounded-xl ${stateEval.phase === 'TRY' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-slate-50 text-slate-500'}">
                2. TRY<br><span class="text-[9px] font-normal">10% 시도</span>
              </div>
              <div class="py-2 px-1 rounded-xl ${stateEval.phase === 'COMPARE' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-slate-50 text-slate-500'}">
                3. COMPARE<br><span class="text-[9px] font-normal">예상/실제</span>
              </div>
              <div class="py-2 px-1 rounded-xl ${stateEval.phase === 'MAP' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-slate-50 text-slate-500'}">
                4. MAP<br><span class="text-[9px] font-normal">작동지도</span>
              </div>
              <div class="py-2 px-1 rounded-xl ${stateEval.phase === 'RETURN' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-slate-50 text-slate-500'}">
                5. RETURN<br><span class="text-[9px] font-normal">삶으로 복귀</span>
              </div>
            </div>
          </div>

          <!-- Primary Action Box -->
          <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-md space-y-3">
            <div class="text-[11px] text-teal-300 font-bold uppercase">NEXT BEST STEP</div>
            <div class="text-base font-bold text-white">“${stateEval.actionPrompt}”</div>
            <div class="pt-1 flex items-center gap-2">
              <button type="button" id="btn-journey-primary-action" class="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-xs text-center">
                ${stateEval.nextStep === 'WAIT_OR_FOLLOWUP' ? '실제 결과 기록하기 &rarr;' : (stateEval.nextStep === 'REVIEW_30DAY' ? '30일 회고 보기 &rarr;' : '오늘 장면 확인하기 &rarr;')}
              </button>
              <button type="button" onclick="alert('오늘은 여기까지면 충분합니다. 가벼운 마음으로 일상으로 돌아가세요.')" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
                오늘은 끝내기
              </button>
            </div>
          </div>

          <!-- 세로 타임라인 뷰 -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900 uppercase">여정 타임라인 (누적 경험)</h2>
              <span class="text-xs text-slate-400">총 ${sessions.length}개 장면 관찰됨</span>
            </div>

            <div class="relative pl-6 border-l-2 border-teal-200 space-y-6 text-xs">
              <!-- 시작 노드 -->
              <div class="relative">
                <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs"></div>
                <div class="font-bold text-slate-800">30일 여정 시작 (${formatDateOnly(journey.startedAt)})</div>
                <div class="text-slate-500 text-[11px]">관찰 의도: "${journey.focusSceneDescription}"</div>
              </div>

              <!-- 누적 세션 및 실험 목록 -->
              ${sessions.map((s, idx) => `
                <div class="relative group">
                  <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white"></div>
                  <div class="font-bold text-slate-900">${s.cardTitle} (${formatDateOnly(s.timestamp)})</div>
                  <div class="text-slate-500 text-[11px]">선택: "${s.chosenAction}"</div>
                </div>
              `).join('')}

              <!-- 종료/회고 노드 -->
              <div class="relative">
                <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-slate-300'} border-2 border-white"></div>
                <div class="font-bold text-slate-800">30-Day Review (${formatDateOnly(journey.windowEndAt)})</div>
                <div class="text-slate-400 text-[11px]">${isCompleted ? '회고가 생성되었습니다.' : '기간 만료 후 전체 회고가 열립니다.'}</div>
              </div>
            </div>
          </div>

          <!-- 30-Day Review 섹션 (조항 32번: 8대 질문) -->
          <div class="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4" id="sec-30day-review-box">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span class="text-[10px] font-bold text-[#0F766E] uppercase">30-DAY EXPERIENCE REVIEW</span>
                <h2 class="text-base font-bold text-slate-900">지난 30일 돌아보기</h2>
              </div>
              <button type="button" id="btn-toggle-review-open" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                회고 보기
              </button>
            </div>

            <div id="review-content-area" class="space-y-4 text-xs" style="display:none;">
              <!-- 동적 생성 8대 질문 및 Before/Recent 비교 -->
            </div>
          </div>
        </div>
      `;

      // 1. 이벤트 바인딩: 일시정지 / 재개
      const btnPause = document.getElementById('btn-journey-pause');
      if (btnPause) {
        btnPause.addEventListener('click', () => {
          JourneyStore.pauseJourney();
          this.renderJourneyPage();
        });
      }

      const btnResume = document.getElementById('btn-journey-resume');
      if (btnResume) {
        btnResume.addEventListener('click', () => {
          JourneyStore.resumeJourney();
          this.renderJourneyPage();
        });
      }

      // 2. 이벤트 바인딩: Primary Action 실행
      document.getElementById('btn-journey-primary-action').addEventListener('click', () => {
        if (stateEval.nextStep === 'WAIT_OR_FOLLOWUP' && stateEval.activeExp) {
          if (window.MyungsimExperiment && window.MyungsimExperiment.ui) {
            window.MyungsimExperiment.ui.openFollowupModal(stateEval.activeExp.experimentId);
          }
        } else if (stateEval.nextStep === 'REVIEW_30DAY') {
          this.toggleReviewDisplay(journey, sessions, experiments);
        } else {
          // 새 장면 관찰: 1-Minute Flow 열기
          if (window.myungsimCoreFlow) {
            window.myungsimCoreFlow.open();
          } else {
            window.location.href = '/my/home.html';
          }
        }
      });

      // 3. 이벤트 바인딩: Review 토글
      document.getElementById('btn-toggle-review-open').addEventListener('click', () => {
        this.toggleReviewDisplay(journey, sessions, experiments);
      });

      // 4. 여정 관리 모달
      document.getElementById('btn-journey-settings').addEventListener('click', () => {
        this.openSettingsModal(journey);
      });
    }

    toggleReviewDisplay(journey, sessions, experiments) {
      const area = document.getElementById('review-content-area');
      if (!area) return;

      if (area.style.display === 'block') {
        area.style.display = 'none';
        return;
      }

      const review = JourneyReviewEngine.generateReview(journey, sessions, experiments);

      area.innerHTML = `
        <!-- 변화 요약 문구 (과장 금지) -->
        <div class="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 font-semibold leading-relaxed">
          ${review.changeSummary}
        </div>

        <!-- Before vs Recent 사실 비교 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">초기 선택</span>
            <div class="text-slate-800 font-bold">${review.beforeRecentComparison.before}</div>
          </div>
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span class="text-[10px] font-bold text-emerald-700 uppercase block mb-1">최근 새로운 선택</span>
            <div class="text-emerald-950 font-bold">${review.beforeRecentComparison.recent}</div>
          </div>
        </div>

        <!-- 8대 질문 기록 그리드 -->
        <div class="space-y-2 pt-2">
          ${review.items.map(item => `
            <div class="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <div class="font-bold text-slate-900">${item.q}</div>
              <div class="text-slate-600">${item.a}</div>
            </div>
          `).join('')}
        </div>

        <!-- 기간 만료 후 선택지 -->
        <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <button type="button" onclick="window.MyungsimJourney.ui.completeAndRestart()" class="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-white font-bold text-xs">
            새로운 30일 여정 시작하기
          </button>
          <a href="/my/home.html" class="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs text-center">
            여기서 여정 마치기
          </a>
        </div>
      `;

      area.style.display = 'block';
    }

    completeAndRestart() {
      if (confirm('현재 30일 여정을 마무리하고 새로운 30일을 시작하시겠습니까?')) {
        JourneyStore.completeJourney();
        JourneyStore.startJourney();
        this.renderJourneyPage();
      }
    }

    openSettingsModal(journey) {
      const choice = prompt('여정 관리 메뉴를 선택하세요:\n1: 여정 일시정지\n2: 여정 재개\n3: 이번 여정 마치기\n4: 여정만 삭제 (기록은 보존)\n5: 여정과 관련 기록 모두 삭제\n(취소는 Esc)');
      if (choice === '1') {
        JourneyStore.pauseJourney();
        this.renderJourneyPage();
      } else if (choice === '2') {
        JourneyStore.resumeJourney();
        this.renderJourneyPage();
      } else if (choice === '3') {
        JourneyStore.completeJourney();
        this.renderJourneyPage();
      } else if (choice === '4') {
        if (confirm('30일 여정 그룹핑만 삭제하시겠습니까?\n작성된 SCAN 및 실험 기록은 개인 보관함에 보존됩니다.')) {
          JourneyStore.deleteJourney(false);
          this.renderJourneyPage();
        }
      } else if (choice === '5') {
        if (confirm('30일 여정과 연결된 개인 기록을 모두 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.')) {
          JourneyStore.deleteJourney(true);
          this.renderJourneyPage();
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 유틸리티 함수
  // -------------------------------------------------------------
  function formatDateOnly(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  // -------------------------------------------------------------
  // 7. 전역 네임스페이스 등록
  // -------------------------------------------------------------
  const journeyModule = {
    Store: JourneyStore,
    StateMachine: JourneyStateMachine,
    ReviewEngine: JourneyReviewEngine,
    Status: JOURNEY_STATUS,
    Phase: JOURNEY_PHASE,
    Intentions: JOURNEY_INTENTIONS,
    FocusScenes: FOCUS_SCENE_EXAMPLES,
    trackSafeEvent: trackSafeJourneyEvent,
    ui: new JourneyUI(),
    init: function() {
      this.ui.renderHomeWidget();
      this.ui.renderJourneyPage();
    }
  };

  window.MyungsimJourney = journeyModule;

  // DOM 로드 시 초기화
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', () => journeyModule.init());
    }
  } else if (typeof document !== 'undefined') {
    setTimeout(() => journeyModule.init(), 60);
  }

})(window);
