/**
 * =================================================================
 * MYUNGSIM BEHAVIOR EXPERIMENT LOOP ENGINE v1
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * EXPECTED → 10% ACTION → ACTUAL → COMPARE → LEARNING → NEXT CHOICE
 * NO-AI Production Mode / Zero External AI Calls / 100% Privacy-Isolated
 * =================================================================
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------
  // 1. 상수 및 설정 정의
  // -------------------------------------------------------------
  const STORAGE_KEY_EXPERIMENTS = 'myungsim_behavior_experiments';
  const STORAGE_KEY_SESSIONS = 'myeongsim_personal_sessions';

  const EXPERIMENT_STATUS = {
    PLANNED: 'PLANNED',         // 계획됨 (행동 대기 중)
    DONE: 'DONE',               // 완료 (해봤어요)
    PARTIAL: 'PARTIAL',         // 부분완료 (일부만 해봤어요)
    NOT_DONE: 'NOT_DONE',       // 미실행 (못 했어요 - 소중한 데이터)
    CANCELLED: 'CANCELLED'      // 취소/상황 미발생/닫힘
  };

  const HIGH_STAKES_REGEX = [
    /(?:자해|자살|목숨을?\s*끊|유서\s*쓰|스스로\s*세상을?)/i,
    /(?:죽고\s*싶|살기\s*싫|죽을\s*래|죽는\s*게\s*낫|사라지고\s*싶어?)/i,
    /(?:칼로|목을?\s*매|투신|뛰어내리|다량\s*복용|수면제\s*(?:모아|털어|먹고))/i,
    /(?:폭행|맞았|때렸|가정폭력|학대|감금|스토킹|성폭행|성추행|강간|성폭력|협박받)/i,
    /(?:누구를?\s*죽이고|해치고\s*싶|칼부림|살해|목\s*졸라|같이\s*죽)/i,
    /(?:전재산|전\s*재산)\s*(?:투자|몰빵|넣|배팅)/i,
    /(?:빚|대출|사채)\s*(?:내서|끌어모아|영끌해서)\s*(?:투자|코인|주식)/i,
    /(?:보증\s*서|빚보증|파산|개인회생|압류)/i,
    /(?:정신과\s*약|우울증약|약물\s*중단|약물\s*과다|처방)/i,
    /(?:이혼소송|고소장|형사소송|변호사\s*선임|합의금)/i
  ];

  // -------------------------------------------------------------
  // 2. Micro Action Library & Directions
  // -------------------------------------------------------------
  const MICRO_ACTION_LIBRARY = {
    DELAY: { id: 'DELAY', label: '반응 보류', desc: '즉시 반응하지 않고 10~30분 시간을 두기' },
    ASK: { id: 'ASK', label: '질문하기', desc: '추측 대신 핵심 질문 1개만 건네기' },
    CHECK_FACT: { id: 'CHECK_FACT', label: '사실 확인', desc: '해석을 멈추고 확인된 객관적 사실 1개만 적기' },
    BOUNDARY: { id: 'BOUNDARY', label: '경계 세우기', desc: '바로 YES 대신 "확인하고 말씀드릴게요"라고 하기' },
    WRITE_FIRST: { id: 'WRITE_FIRST', label: '먼저 적기', desc: '메시지나 말을 전하기 전 메모장에 1문장만 적어보기' },
    ONE_SMALL_STEP: { id: 'ONE_SMALL_STEP', label: '10% 초안', desc: '완성 기준 없이 10분만 거칠게 시작하기' },
    REPAIR: { id: 'REPAIR', label: '짧은 회복', desc: '실수 사실 1개와 수정할 것 1개만 분리하기' },
    REST: { id: 'REST', label: '잠시 멈춤', desc: '스마트폰 화면을 엎어두고 물 한 컵 마시기' },
    DO_NOTHING_YET: { id: 'DO_NOTHING_YET', label: '지금은 안 하기', desc: '불안이 높은 상태에서 결정을 다음 날로 미루기' },
    SEEK_INFORMATION: { id: 'SEEK_INFORMATION', label: '조건 확인', desc: '결정하지 않고 필요한 조건 1개만 찾아보기' }
  };

  const DIRECTION_OPTIONS = [
    { id: 'boundary', label: '내 경계 지키기', desc: '상대 요구에 휩쓸리지 않고 나를 지키고 싶음' },
    { id: 'understand', label: '이해받기 / 잘 전달하기', desc: '감정 소모 없이 내 생각을 명확히 전달하고 싶음' },
    { id: 'solve', label: '문제 해결하기', desc: '감정을 가라앉히고 실질적인 다음 조치를 취하고 싶음' },
    { id: 'info', label: '사실 정보 확인하기', desc: '소설을 멈추고 실제 상황을 먼저 파악하고 싶음' },
    { id: 'relationship', label: '건강한 관계 유지하기', desc: '충동으로 관계를 부수지 않고 안전하게 유지하고 싶음' },
    { id: 'rest', label: '쉬기 / 에너지 아끼기', desc: '과도한 소모를 멈추고 내 에너지를 보존하고 싶음' },
    { id: 'win', label: '이기기 / 인정받기', desc: '상대에게 지지 않거나 증명하고 싶음 (원초적 충동 점검)' }
  ];

  const CONTROL_CIRCLES = {
    SELF: { id: 'self', label: '내가 선택 가능', icon: '🟢' },
    COOPERATE: { id: 'cooperate', label: '공동으로 조율', icon: '🟡' },
    OTHER: { id: 'other', label: '상대가 선택', icon: '🟠' },
    UNCONTROLLABLE: { id: 'uncontrollable', label: '통제 불가', icon: '⚪' }
  };

  // -------------------------------------------------------------
  // 3. Category/Card Experiment Templates
  // -------------------------------------------------------------
  const DEFAULT_EXPECTED_OPTIONS = [
    "상대가 크게 화내거나 서운해할 것 같다",
    "관계가 어색해지거나 나빠질 것 같다",
    "실수하거나 망칠 것 같다",
    "불안이 더 걷잡을 수 없이 커질 것 같다",
    "나중에 크게 후회할 것 같다",
    "아무 일도 안 생길 수도 있다",
    "잘 모르겠다"
  ];

  const CATEGORY_TEMPLATES = {
    '불확실성': {
      actionType: 'DELAY',
      expectedOptions: [
        "기다리면 불안이 더 커질 것 같다",
        "바로 확인하지 않으면 큰일이 날 것 같다",
        "상대가 나를 무시하거나 버릴 것 같다",
        "그냥 마음이 답답할 뿐 큰일은 안 생길 수 있다"
      ],
      defaultAction: "추가 연락이나 확인 행동을 20분간 보류하기",
      smallerAction: "확인하고 싶은 충동이 들 때 스마트폰을 엎어두고 5분 기다리기",
      factPrompt: "20분 동안 상대 반응과 내 충동의 실제 흐름을 봅니다."
    },
    '경계·관계': {
      actionType: 'BOUNDARY',
      expectedOptions: [
        "거절하거나 미루면 상대가 크게 화낼 것 같다",
        "착한 사람으로 보이지 않아 미움받을 것 같다",
        "관계가 영영 틀어질 것 같다",
        "서운해할 수는 있지만 대화는 유지될 것 같다"
      ],
      defaultAction: "바로 YES 대신 '일정 확인 후 말씀드릴게요'라고 답하기",
      smallerAction: "메시지를 바로 읽지 않고 10분 뒤에 읽고 답하기",
      factPrompt: "답을 늦췄을 때 상대의 실제 반응을 사실 위주로 봅니다."
    },
    '원가족·부모': {
      actionType: 'BOUNDARY',
      expectedOptions: [
        "바로 받지 않으면 부모님이 크게 서운해하고 화낼 것 같다",
        "내가 나쁜 자식이 된 것 같은 죄책감이 들 것 같다",
        "부모님의 감정을 내가 달래주지 못해 불안할 것 같다"
      ],
      defaultAction: "즉답 대신 '확인하고 저녁에 전화드릴게요'라고 1문장 남기기",
      smallerAction: "전화를 바로 받기 전 심호흡 3번 하고 1분 뒤 걸기",
      factPrompt: "부모님의 실제 반응과 대화 지속 여부를 사실만 봅니다."
    },
    '성과·완벽': {
      actionType: 'ONE_SMALL_STEP',
      expectedOptions: [
        "완벽하게 준비하지 않고 시작하면 엉망이 될 것 같다",
        "남들이 내 결과물을 보고 무능하다고 비웃을 것 같다",
        "초안 수준으로는 아무 가치도 없을 것 같다"
      ],
      defaultAction: "타이머 10분을 맞추고 메모장에 낙서하듯 초안 쓰기",
      smallerAction: "파일을 열고 오늘 완성할 항목 이름 1개만 적기",
      factPrompt: "10분 동안 실제로 몇 문장이나 작업이 진행됐는지 봅니다."
    },
    '감정·수치심': {
      actionType: 'CHECK_FACT',
      expectedOptions: [
        "이 감정을 바로 떨치지 않으면 하루를 망칠 것 같다",
        "내가 너무 한심하고 부끄러워서 견디기 힘들 것 같다"
      ],
      defaultAction: "일어난 사실 1개와 내 머릿속 소설 1개를 종이에 분리해 적기",
      smallerAction: "가슴에 손을 얹고 '불안해하는 내 몸을 알아차린다' 1번 말하기",
      factPrompt: "적고 난 후 감정의 강도가 실제로 어떻게 흘렀는지 봅니다."
    },
    '믿음·운세': {
      actionType: 'SEEK_INFORMATION',
      expectedOptions: [
        "오늘 운이 나빠서 중요한 일을 하면 반드시 실패할 것 같다",
        "운명에 맞서면 나쁜 대가를 치를 것 같다"
      ],
      defaultAction: "운세와 상관없이 고위험이 아닌 일상 루틴 1개를 평소대로 진행하기",
      smallerAction: "믿음 때문에 회피하려던 일 중 5분짜리 작은 준비 1개 하기",
      factPrompt: "실제로 그 일을 진행했을 때 어떤 결과가 생겼는지 사실만 봅니다."
    }
  };

  // -------------------------------------------------------------
  // 4. 프라이버시 엄격 분리 Event Tracker
  // (개인 원문 절대 금지: expectedResult, actualResult, learning 차단)
  // -------------------------------------------------------------
  function trackSafeExperimentEvent(eventName, rawData = {}) {
    // 화이트리스트 메타데이터만 전송
    const safePayload = {
      experimentId: rawData.experimentId || undefined,
      cardId: rawData.cardId || undefined,
      category: rawData.category || undefined,
      actionType: rawData.actionType || undefined,
      status: rawData.status || undefined,
      actionSize: rawData.actionSize || undefined,
      executionStatus: rawData.executionStatus || undefined,
      comparison: rawData.comparison || undefined,
      nextChoice: rawData.nextChoice || undefined,
      notDoneReason: rawData.notDoneReason || undefined,
      direction: rawData.direction || undefined,
      timestamp: Date.now()
    };

    // 혹시라도 원문이 포함되어 있다면 원천 삭제
    delete safePayload.expectedResult;
    delete safePayload.actualResult;
    delete safePayload.learning;
    delete safePayload.personalMemo;
    delete safePayload.whatHappened;
    delete safePayload.query;

    if (typeof window.trackMindEvent === 'function') {
      window.trackMindEvent(eventName, safePayload);
    }
  }

  // -------------------------------------------------------------
  // 5. Experiment Store (100% Client-Side LocalStorage)
  // -------------------------------------------------------------
  class ExperimentStore {
    static getStorageKey() {
      if (typeof window !== 'undefined' && window.MyungsimPersonalHome && window.MyungsimPersonalHome.Auth) {
        const uid = window.MyungsimPersonalHome.Auth.getCurrentUserId();
        if (uid) return `${STORAGE_KEY_EXPERIMENTS}_${uid}`;
      }
      return STORAGE_KEY_EXPERIMENTS;
    }

    static getAll() {
      try {
        const key = this.getStorageKey();
        let raw = localStorage.getItem(key);
        // 기본 키 폴백 호환
        if (!raw && key !== STORAGE_KEY_EXPERIMENTS) {
          raw = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
        }
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('[MyungsimExperimentStore] read error:', e);
        return [];
      }
    }

    static saveAll(list) {
      try {
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(list));
        // 기본 키도 함께 보존
        localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(list));
      } catch (e) {
        console.warn('[MyungsimExperimentStore] write error:', e);
      }
    }

    static getById(id) {
      const list = this.getAll();
      return list.find(item => item.experimentId === id) || null;
    }

    static getActive() {
      const list = this.getAll();
      // PLANNED 상태 중 가장 최근 실험 1개 반환
      return list.find(item => item.status === EXPERIMENT_STATUS.PLANNED) || null;
    }

    static add(exp) {
      const list = this.getAll();
      // 동시 활성 실험 1~2개 유지: 기존 PLANNED가 2개 이상이면 오래된 것은 CANCELLED/AUTO_CLOSED 처리
      const activeCount = list.filter(item => item.status === EXPERIMENT_STATUS.PLANNED).length;
      if (activeCount >= 2) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].status === EXPERIMENT_STATUS.PLANNED) {
            list[i].status = EXPERIMENT_STATUS.CANCELLED;
            list[i].cancelReason = 'auto_closed_for_new_experiment';
            break;
          }
        }
      }

      list.unshift(exp);
      // 최대 100개 보관
      if (list.length > 100) list.length = 100;
      this.saveAll(list);
      return exp;
    }

    static update(id, updates) {
      const list = this.getAll();
      const idx = list.findIndex(item => item.experimentId === id);
      if (idx !== -1) {
        list[idx] = Object.assign({}, list[idx], updates, { updatedAt: new Date().toISOString() });
        this.saveAll(list);
        return list[idx];
      }
      return null;
    }

    static remove(id) {
      const list = this.getAll();
      const filtered = list.filter(item => item.experimentId !== id);
      this.saveAll(filtered);
      return true;
    }

    static close(id, reason = 'user_closed') {
      return this.update(id, {
        status: EXPERIMENT_STATUS.CANCELLED,
        closeReason: reason,
        closedAt: new Date().toISOString()
      });
    }
  }

  // -------------------------------------------------------------
  // 6. High-Stakes 검사기
  // -------------------------------------------------------------
  function checkHighStakes(text) {
    if (!text || typeof text !== 'string') return { isHighStakes: false };
    for (const regex of HIGH_STAKES_REGEX) {
      if (regex.test(text)) {
        return {
          isHighStakes: true,
          reason: '안전 관련 고위험 상황 감지'
        };
      }
    }
    return { isHighStakes: false };
  }

  // -------------------------------------------------------------
  // 7. MyungsimBehaviorExperiment 클래스
  // -------------------------------------------------------------
  class MyungsimBehaviorExperiment {
    constructor(data = {}) {
      this.experimentId = data.experimentId || ('exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
      this.userId = data.userId || this.getOrCreateUserId();
      this.sourceCardId = data.sourceCardId || '';
      this.sourceCardTitle = data.sourceCardTitle || '';
      this.sourceSessionId = data.sourceSessionId || null;
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || this.createdAt;

      this.scene = data.scene || '';
      this.directionCheck = data.directionCheck || 'understand'; // 10초 방향 점검
      this.urge = data.urge || '';                               // 충동
      this.expectedResult = data.expectedResult || '';           // 예상
      this.confidence = data.confidence || 'possible';           // strong, possible, unknown (점수 X)

      this.selectedAction = data.selectedAction || '';           // 10% 행동
      this.smallerAction = data.smallerAction || '';             // 5% 또는 1% 축소 행동
      this.actionSizeCheck = data.actionSizeCheck || 'manageable'; // manageable, too_big
      this.actionType = data.actionType || 'DELAY';

      this.controlCircle = data.controlCircle || 'self';         // self, cooperate, other, uncontrollable
      this.contextCondition = data.contextCondition || { when: '', where: '', withWhom: '' };
      this.reminder = data.reminder || { timing: 'none' };

      this.status = data.status || EXPERIMENT_STATUS.PLANNED;

      // 팔로업 기록
      this.followup = Object.assign({
        openedAt: null,
        executionStatus: null,     // done, partial, not_done, no_situation
        notDoneReason: null,       // anxiety_too_big, situation_changed, action_too_big, forgot, mind_changed, other
        actualResult: '',          // 실제로 일어난 일 (FACT)
        comparison: null,          // almost_same, slightly_different, very_different, hard_to_judge
        wasResponsePossible: null, // 예상이 맞았을 때 대응 여부
        learning: '',              // 새로 알게 된 점
        nextChoice: null,          // same_again, smaller, bigger, different, undecided
        feedback: null             // helpful, unsure
      }, data.followup || {});
    }

    getOrCreateUserId() {
      let uid = localStorage.getItem('myungsim_anon_user_id');
      if (!uid) {
        uid = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('myungsim_anon_user_id', uid);
      }
      return uid;
    }
  }

  // -------------------------------------------------------------
  // 8. Experiment UI Engine (모달, 배너, 시트)
  // -------------------------------------------------------------
  class ExperimentUI {
    constructor() {
      this.initModals();
      this.attachGlobalEvents();
    }

    initModals() {
      // 1) 생성 모달 컨테이너
      if (!document.getElementById('mf-experiment-create-modal')) {
        const createModal = document.createElement('div');
        createModal.id = 'mf-experiment-create-modal';
        createModal.className = 'mf-exp-modal-overlay';
        createModal.style.display = 'none';
        createModal.setAttribute('role', 'dialog');
        createModal.setAttribute('aria-modal', 'true');
        createModal.innerHTML = `
          <div class="mf-exp-container" id="mf-exp-create-box">
            <!-- 동적으로 렌더링됨 -->
          </div>
        `;
        document.body.appendChild(createModal);
      }

      // 2) 팔로업 모달 컨테이너
      if (!document.getElementById('mf-experiment-followup-modal')) {
        const followModal = document.createElement('div');
        followModal.id = 'mf-experiment-followup-modal';
        followModal.className = 'mf-exp-modal-overlay';
        followModal.style.display = 'none';
        followModal.setAttribute('role', 'dialog');
        followModal.setAttribute('aria-modal', 'true');
        followModal.innerHTML = `
          <div class="mf-exp-container" id="mf-exp-followup-box">
            <!-- 동적으로 렌더링됨 -->
          </div>
        `;
        document.body.appendChild(followModal);
      }

      // 스타일 주입
      this.injectStyles();
    }

    injectStyles() {
      if (document.getElementById('mf-experiment-styles')) return;
      const style = document.createElement('style');
      style.id = 'mf-experiment-styles';
      style.textContent = `
        .mf-exp-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.78);
          backdrop-filter: blur(6px);
          z-index: 10050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .mf-exp-container {
          background: #ffffff;
          width: 100%;
          max-width: 460px;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          color: #1e293b;
          font-family: inherit;
          animation: mfFadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes mfFadeInUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mf-exp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .mf-exp-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .mf-exp-close {
          background: none;
          border: none;
          font-size: 24px;
          line-height: 1;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
        }
        .mf-exp-close:hover { color: #334155; background: #f8fafc; }
        .mf-exp-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.4;
          margin-bottom: 8px;
        }
        .mf-exp-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .mf-exp-card-preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .mf-exp-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .mf-exp-value {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .mf-exp-field {
          margin-bottom: 16px;
        }
        .mf-exp-select-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 13px;
          color: #334155;
          margin-bottom: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mf-exp-select-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .mf-exp-select-btn.selected {
          border-color: #0f766e;
          background: #f0fdfa;
          color: #0f766e;
          font-weight: 700;
        }
        .mf-exp-textarea, .mf-exp-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          color: #1e293b;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }
        .mf-exp-textarea:focus, .mf-exp-input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }
        .mf-exp-btn-primary {
          width: 100%;
          background: #0f766e;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .mf-exp-btn-primary:hover { background: #115e59; }
        .mf-exp-btn-secondary {
          width: 100%;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 14px;
          padding: 11px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        .mf-exp-btn-secondary:hover { background: #e2e8f0; }
        .mf-exp-notice-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 12px;
          color: #166534;
          margin-top: 12px;
          line-height: 1.45;
        }
        .mf-exp-warning-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          color: #9f1239;
          line-height: 1.45;
          margin-bottom: 14px;
        }
        .mf-exp-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .mf-exp-compare-col {
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
        }
        .mf-exp-compare-expected {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }
        .mf-exp-compare-actual {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        /* 상단 액티브 알림 바 */
        .mf-active-exp-bar {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }
        .mf-active-exp-btn {
          background: #14b8a6;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .mf-active-exp-btn:hover { background: #0d9488; }
        /* Reassurance loop 알림 */
        .mf-reassurance-box {
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `;
      document.head.appendChild(style);
    }

    attachGlobalEvents() {
      // 모달 바깥 클릭 시 닫기
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('click', (e) => {
          const createModal = document.getElementById('mf-experiment-create-modal');
          const followModal = document.getElementById('mf-experiment-followup-modal');
          if (createModal && e.target === createModal) this.closeCreateModal();
          if (followModal && e.target === followModal) this.closeFollowupModal();
        });
      }
    }

    // -------------------------------------------------------------
    // 화면 A: 행동실험 생성 플로우 (Create Flow)
    // -------------------------------------------------------------
    openCreateModal(card, sessionRecord = {}) {
      const container = document.getElementById('mf-exp-create-box');
      const modal = document.getElementById('mf-experiment-create-modal');
      if (!container || !modal) return;

      // 1. High-Stakes 안전 검사
      const sceneQuery = sessionRecord.query || card.question || '';
      const safetyCheck = checkHighStakes(sceneQuery);
      if (safetyCheck.isHighStakes) {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag" style="background:#ffe4e6; color:#9f1239;">🛡️ 안전 우선 안내</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeCreateModal()">&times;</button>
          </div>
          <div class="mf-exp-warning-box">
            현재 입력된 상황은 고위험 또는 전문적 안전 판단이 필요한 영역입니다.<br>
            명심코칭의 일반 행동실험 대신, 현실의 전문 기관 및 안전망 상담을 우선 권장합니다.
          </div>
          <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1 mb-4">
            <div>&bull; 보건복지상담센터: <strong>129</strong> (24시간)</div>
            <div>&bull; 정신건강위기상담: <strong>1577-0199</strong></div>
            <div>&bull; 법률구조공단: <strong>132</strong></div>
          </div>
          <button class="mf-exp-btn-secondary" onclick="window.MyungsimExperiment.ui.closeCreateModal()">확인하고 닫기</button>
        `;
        modal.style.display = 'flex';
        return;
      }

      // 카드 데이터 및 템플릿 매칭
      const category = card.category || '불확실성';
      const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES['불확실성'];
      const action10 = sessionRecord.chosenAction || card.action10Percent || card.tenPercentAction || template.defaultAction;
      const smallerAction = card.smallerAction || template.smallerAction;

      let currentStep = 1; // 1: 방향 & 크기 점검, 2: 예상 입력 & 저장

      // 로컬 임시 상태
      let state = {
        cardId: card.id,
        cardTitle: card.cardTitle || '선택한 명심카드',
        category: category,
        scene: sceneQuery,
        selectedAction: action10,
        smallerAction: smallerAction,
        actionSizeCheck: 'manageable',
        direction: 'understand',
        actionType: template.actionType || 'DELAY',
        expectedResult: template.expectedOptions[0] || DEFAULT_EXPECTED_OPTIONS[0],
        confidence: 'possible',
        reminderTiming: 'none'
      };

      const renderStep1 = () => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">🌱 10% 행동실험 (1/2)</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeCreateModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">이 선택을 작은 실험으로 남기기</h3>
          <p class="mf-exp-desc">
            정답을 증명하는 실험이 아닙니다.<br>
            <strong>내 예상과 실제 결과를 비교해보는 작은 시도</strong>입니다.
          </p>

          <!-- 10초 방향 점검 -->
          <div class="mf-exp-field">
            <label class="mf-exp-label">10초 방향 점검 · 지금 내가 원하는 결과는?</label>
            <div class="space-y-1">
              ${DIRECTION_OPTIONS.slice(0, 4).map(opt => `
                <button type="button" class="mf-exp-select-btn dir-opt ${state.direction === opt.id ? 'selected' : ''}" data-id="${opt.id}">
                  <strong>${opt.label}</strong>
                  <span class="text-xs text-slate-400 block">${opt.desc}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 행동 크기 점검 -->
          <div class="mf-exp-field">
            <label class="mf-exp-label">선택한 행동</label>
            <div class="mf-exp-card-preview" id="mf-exp-action-display">
              <div class="mf-exp-value">${state.selectedAction}</div>
            </div>
            <label class="mf-exp-label">지금 해볼 만한 크기인가요?</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="mf-exp-select-btn text-center ${state.actionSizeCheck === 'manageable' ? 'selected' : ''}" id="btn-size-manageable">
                👍 해볼 만해요
              </button>
              <button type="button" class="mf-exp-select-btn text-center ${state.actionSizeCheck === 'too_big' ? 'selected' : ''}" id="btn-size-toobig">
                ⚖️ 조금 커요 (더 작게)
              </button>
            </div>
          </div>

          <button class="mf-exp-btn-primary" id="btn-exp-next">
            <span>다음: 내 예상 적어보기</span> &rarr;
          </button>
          <button class="mf-exp-btn-secondary" onclick="window.MyungsimExperiment.ui.closeCreateModal()">
            다음에 하기
          </button>
        `;

        // 이벤트 리스너 바인딩
        container.querySelectorAll('.dir-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            state.direction = btn.getAttribute('data-id');
            renderStep1();
          });
        });

        const btnManageable = container.querySelector('#btn-size-manageable');
        const btnTooBig = container.querySelector('#btn-size-toobig');

        btnManageable.addEventListener('click', () => {
          state.actionSizeCheck = 'manageable';
          state.selectedAction = action10;
          trackSafeExperimentEvent('experiment_action_selected', { cardId: card.id, actionSize: '10%' });
          renderStep1();
        });

        btnTooBig.addEventListener('click', () => {
          state.actionSizeCheck = 'too_big';
          state.selectedAction = smallerAction;
          trackSafeExperimentEvent('experiment_action_selected', { cardId: card.id, actionSize: 'smaller' });
          renderStep1();
        });

        container.querySelector('#btn-exp-next').addEventListener('click', () => {
          renderStep2();
        });
      };

      const renderStep2 = () => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">🌱 10% 행동실험 (2/2)</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeCreateModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">무슨 일이 생길 것 같나요?</h3>
          <p class="mf-exp-desc">
            미래 예측이 아니라 <strong>지금 내가 예상하고 있는 마음의 생각</strong>입니다.
          </p>

          <div class="mf-exp-field">
            <label class="mf-exp-label">내 마음의 예상 (하나를 고르거나 직접 적기)</label>
            <div class="space-y-1 mb-2">
              ${template.expectedOptions.map(opt => `
                <button type="button" class="mf-exp-select-btn exp-opt ${state.expectedResult === opt ? 'selected' : ''}" data-text="${opt}">
                  ${opt}
                </button>
              `).join('')}
            </div>
            <input type="text" class="mf-exp-input" id="input-custom-expected" placeholder="직접 한 문장으로 적어도 좋아요..." value="${template.expectedOptions.includes(state.expectedResult) ? '' : state.expectedResult}" />
          </div>

          <!-- 확신도 점검 (점수화 금지) -->
          <div class="mf-exp-field">
            <label class="mf-exp-label">지금 느낌의 강도</label>
            <div class="grid grid-cols-3 gap-1.5 text-xs">
              <button type="button" class="mf-exp-select-btn text-center conf-opt ${state.confidence === 'strong' ? 'selected' : ''}" data-conf="strong">
                강하게 느껴짐
              </button>
              <button type="button" class="mf-exp-select-btn text-center conf-opt ${state.confidence === 'possible' ? 'selected' : ''}" data-conf="possible">
                그럴 수도 있음
              </button>
              <button type="button" class="mf-exp-select-btn text-center conf-opt ${state.confidence === 'unknown' ? 'selected' : ''}" data-conf="unknown">
                잘 모르겠음
              </button>
            </div>
          </div>

          <div class="mf-exp-notice-box">
            💡 <strong>안내:</strong> 결과를 바꾸려고 애쓰기보다, 실제로 무슨 일이 일어나는지 편안히 관찰합니다.
          </div>

          <div style="margin-top: 16px;">
            <button class="mf-exp-btn-primary" id="btn-save-experiment">
              ✨ 작은 실험으로 저장하기
            </button>
            <button class="mf-exp-btn-secondary" id="btn-back-step1">
              &larr; 이전 단계
            </button>
          </div>
        `;

        container.querySelectorAll('.exp-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            state.expectedResult = btn.getAttribute('data-text');
            const customInput = container.querySelector('#input-custom-expected');
            if (customInput) customInput.value = '';
            renderStep2();
          });
        });

        const customInput = container.querySelector('#input-custom-expected');
        if (customInput) {
          customInput.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
              state.expectedResult = e.target.value.trim();
              container.querySelectorAll('.exp-opt').forEach(b => b.classList.remove('selected'));
            }
          });
        }

        container.querySelectorAll('.conf-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            state.confidence = btn.getAttribute('data-conf');
            renderStep2();
          });
        });

        container.querySelector('#btn-back-step1').addEventListener('click', () => {
          renderStep1();
        });

        container.querySelector('#btn-save-experiment').addEventListener('click', () => {
          const exp = new MyungsimBehaviorExperiment({
            sourceCardId: state.cardId,
            sourceCardTitle: state.cardTitle,
            sourceSessionId: sessionRecord.id || null,
            scene: state.scene,
            directionCheck: state.direction,
            expectedResult: state.expectedResult,
            confidence: state.confidence,
            selectedAction: state.selectedAction,
            smallerAction: state.smallerAction,
            actionSizeCheck: state.actionSizeCheck,
            actionType: state.actionType,
            status: EXPERIMENT_STATUS.PLANNED
          });

          ExperimentStore.add(exp);

          // 안전한 익명 분석 이벤트 전송 (원문 차단)
          trackSafeExperimentEvent('experiment_created', {
            experimentId: exp.experimentId,
            cardId: exp.sourceCardId,
            category: state.category,
            actionType: exp.actionType,
            actionSize: exp.actionSizeCheck,
            direction: exp.directionCheck
          });

          this.closeCreateModal();
          this.renderActiveExperimentBanner();

          // 완료 축하 피드백 및 안내
          alert('🌱 작은 행동실험으로 저장되었습니다.\n행동 후 어떻게 되었는지 언제든 편하게 기록해보세요!');
        });
      };

      renderStep1();
      modal.style.display = 'flex';
      trackSafeExperimentEvent('experiment_create_opened', { cardId: card.id });
    }

    closeCreateModal() {
      const modal = document.getElementById('mf-experiment-create-modal');
      if (modal) modal.style.display = 'none';
    }

    // -------------------------------------------------------------
    // 화면 B: Follow-up 플로우 (Follow-up Flow)
    // -------------------------------------------------------------
    openFollowupModal(experimentId) {
      const exp = ExperimentStore.getById(experimentId);
      if (!exp) return;

      const container = document.getElementById('mf-exp-followup-box');
      const modal = document.getElementById('mf-experiment-followup-modal');
      if (!container || !modal) return;

      trackSafeExperimentEvent('experiment_followup_opened', {
        experimentId: exp.experimentId,
        cardId: exp.sourceCardId,
        actionType: exp.actionType
      });

      // 단계: 1(어떻게 됐나요?), 2-A(못했어요 피드백), 2-B(실제결과 FACT), 3(비교&대응), 4(새로운배움&다음선택), 5(완료)
      const renderFollowStep1 = () => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">🔍 지난번 선택 돌아보기</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">지난번 선택은 어떻게 됐나요?</h3>
          <div class="mf-exp-card-preview">
            <div class="text-xs text-slate-500 mb-1">시도해보기로 했던 행동</div>
            <div class="mf-exp-value">"${exp.selectedAction}"</div>
          </div>

          <div class="space-y-2 mb-4">
            <button class="mf-exp-select-btn text-left p-3.5" id="btn-status-done">
              <strong class="text-emerald-700">🌱 해봤어요</strong>
              <span class="text-xs text-slate-500 block mt-0.5">작게나마 실행해보고 결과를 관찰했어요.</span>
            </button>
            <button class="mf-exp-select-btn text-left p-3.5" id="btn-status-partial">
              <strong class="text-teal-700">🌿 일부만 해봤어요</strong>
              <span class="text-xs text-slate-500 block mt-0.5">전부는 아니지만 시도한 부분이 있어요.</span>
            </button>
            <button class="mf-exp-select-btn text-left p-3.5" id="btn-status-notdone">
              <strong class="text-slate-700">⏸️ 못 했어요</strong>
              <span class="text-xs text-slate-500 block mt-0.5">실패가 아닙니다. 어떤 점이 너무 컸는지 알아봅니다.</span>
            </button>
            <button class="mf-exp-select-btn text-left p-3.5" id="btn-status-nosituation">
              <strong class="text-slate-500">☁️ 상황이 생기지 않았어요</strong>
              <span class="text-xs text-slate-400 block mt-0.5">그 상황 자체가 발생하지 않아 시도할 기회가 없었어요.</span>
            </button>
          </div>

          <button class="mf-exp-btn-secondary" onclick="window.MyungsimExperiment.ui.closeExperimentWithReason('${exp.experimentId}')">
            이 실험 여기서 닫기 (Close)
          </button>
        `;

        container.querySelector('#btn-status-done').addEventListener('click', () => {
          exp.followup.executionStatus = 'done';
          renderActualInput(false);
        });

        container.querySelector('#btn-status-partial').addEventListener('click', () => {
          exp.followup.executionStatus = 'partial';
          renderActualInput(true);
        });

        container.querySelector('#btn-status-notdone').addEventListener('click', () => {
          exp.followup.executionStatus = 'not_done';
          renderNotDoneFlow();
        });

        container.querySelector('#btn-status-nosituation').addEventListener('click', () => {
          exp.followup.executionStatus = 'no_situation';
          exp.status = EXPERIMENT_STATUS.CANCELLED;
          ExperimentStore.update(exp.experimentId, exp);
          trackSafeExperimentEvent('experiment_not_done', { experimentId: exp.experimentId, notDoneReason: 'no_situation' });
          alert('☁️ 상황이 생기지 않은 것으로 정리했습니다.\n다음 필요한 순간에 다시 작은 시도를 해보실 수 있습니다.');
          this.closeFollowupModal();
          this.renderActiveExperimentBanner();
        });
      };

      // 분기 1: 못 했어요 (Not Done Flow - No-Shame, No-Streak)
      const renderNotDoneFlow = () => {
        trackSafeExperimentEvent('experiment_not_done', { experimentId: exp.experimentId });
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag" style="background:#f1f5f9; color:#475569;">💡 유효한 데이터</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">행동하지 못한 것도 소중한 데이터입니다</h3>
          <p class="mf-exp-desc">
            자책하거나 0점을 줄 필요가 전혀 없습니다.<br>
            <strong>무엇이 너무 컸을까요?</strong>
          </p>

          <div class="space-y-1.5 mb-4">
            ${[
              { id: 'anxiety_too_big', label: '불안과 부담이 너무 컸음' },
              { id: 'action_too_big', label: '행동의 크기가 지금 상태에선 너무 컸음' },
              { id: 'situation_changed', label: '상황이 예상과 다르게 급변함' },
              { id: 'forgot', label: '순간 잊어버리고 평소 습관대로 반응함' },
              { id: 'mind_changed', label: '마음이 바뀌거나 지금은 안 하기로 결정함' }
            ].map(r => `
              <button type="button" class="mf-exp-select-btn not-done-btn text-left" data-reason="${r.id}">
                ${r.label}
              </button>
            `).join('')}
          </div>

          <div class="mf-exp-notice-box mb-4">
            🌿 <strong>다음 조율:</strong> 지금은 직접 거절하기보다 답장을 5분 늦추는 등의 <strong>더 작은 1% 행동</strong>이 더 현실적일 수 있습니다.
          </div>

          <button class="mf-exp-btn-primary" id="btn-finish-notdone">
            경험으로 정리하고 마치기
          </button>
        `;

        let selectedReason = 'action_too_big';
        container.querySelectorAll('.not-done-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.not-done-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedReason = btn.getAttribute('data-reason');
          });
        });

        container.querySelector('#btn-finish-notdone').addEventListener('click', () => {
          exp.status = EXPERIMENT_STATUS.NOT_DONE;
          exp.followup.notDoneReason = selectedReason;
          exp.followup.learning = '아직 이 행동은 부담이 컸음을 확인했고, 더 가벼운 깃털 행동이 필요함을 알게 됨';
          ExperimentStore.update(exp.experimentId, exp);

          trackSafeExperimentEvent('experiment_learning_recorded', {
            experimentId: exp.experimentId,
            status: exp.status,
            notDoneReason: selectedReason
          });

          this.closeFollowupModal();
          this.renderActiveExperimentBanner();
          alert('🌱 행동하지 못한 원인을 명확히 파악했습니다.\n이 또한 내 마음의 크기를 알아차린 훌륭한 발견입니다.');
        });
      };

      // 분기 2: 실제 결과 입력 (ACTUAL - Fact-based)
      const renderActualInput = (isPartial) => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">🌱 실제 사실 기록</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">실제로는 무슨 일이 일어났나요?</h3>
          <p class="mf-exp-desc">
            해석이나 자책보다 <strong>객관적으로 확인된 사실(FACT)</strong> 위주로 적어보세요.
          </p>

          <div class="mf-exp-card-preview text-xs text-slate-600 mb-3">
            <div><strong>X 해석:</strong> "역시 저는 인간관계에 소질이 없어요."</div>
            <div><strong>O 사실:</strong> "상대가 2시간 동안 답하지 않았고, 밤 9시에 '알겠다'고 답장이 왔다."</div>
          </div>

          <div class="mf-exp-field">
            <label class="mf-exp-label">실제로 일어난 사실 (FACT)</label>
            <textarea class="mf-exp-textarea" id="actual-input" rows="3" placeholder="예: 엄마가 조금 서운하다고 말했지만 대화는 계속됐다..."></textarea>
          </div>

          <button class="mf-exp-btn-primary" id="btn-next-compare">
            <span>내 예상과 비교해보기</span> &rarr;
          </button>
        `;

        container.querySelector('#btn-next-compare').addEventListener('click', () => {
          const txt = container.querySelector('#actual-input').value.trim();
          exp.followup.actualResult = txt || '상황을 관찰함';
          trackSafeExperimentEvent('experiment_actual_recorded', {
            experimentId: exp.experimentId,
            status: isPartial ? 'PARTIAL' : 'DONE'
          });
          renderCompareStep(isPartial);
        });
      };

      // 분기 3: 예상 vs 실제 비교 (EXPECTED vs ACTUAL)
      const renderCompareStep = (isPartial) => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">⚖️ 예상 vs 실제 비교</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">예상과 실제는 어떻게 달랐나요?</h3>

          <div class="mf-exp-compare-grid">
            <div class="mf-exp-compare-col mf-exp-compare-expected">
              <span class="mf-exp-label" style="color:#2563eb;">내 예상</span>
              <div class="font-bold text-slate-800 mt-1">${exp.expectedResult}</div>
            </div>
            <div class="mf-exp-compare-col mf-exp-compare-actual">
              <span class="mf-exp-label" style="color:#059669;">실제 일어난 일</span>
              <div class="font-bold text-slate-800 mt-1">${exp.followup.actualResult}</div>
            </div>
          </div>

          <div class="mf-exp-field">
            <label class="mf-exp-label">결과 비교 (점수화 없음)</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button type="button" class="mf-exp-select-btn cmp-btn text-center" data-cmp="almost_same">예상과 거의 같았어요</button>
              <button type="button" class="mf-exp-select-btn cmp-btn text-center" data-cmp="slightly_different">조금 달랐어요</button>
              <button type="button" class="mf-exp-select-btn cmp-btn text-center" data-cmp="very_different">많이 달랐어요</button>
              <button type="button" class="mf-exp-select-btn cmp-btn text-center" data-cmp="hard_to_judge">판단하기 어려워요</button>
            </div>
          </div>

          <!-- 예상이 맞았어도 실패가 아니다: 대응 가능성 질문 -->
          <div class="mf-exp-field" id="response-possible-field" style="display:none;">
            <div class="mf-exp-warning-box" style="background:#f0fdf4; border-color:#bbf7d0; color:#166534;">
              💡 <strong>대응 가능성 확인:</strong> 예상이 맞았더라도 실패가 아닙니다.<br>
              "그 일이 일어났을 때, 나는 어떻게든 대응할 수 있었나요?"
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button type="button" class="mf-exp-select-btn resp-btn text-center" data-val="yes">네, 견디고 대응했어요</button>
              <button type="button" class="mf-exp-select-btn resp-btn text-center" data-val="hard">조금 버거웠어요</button>
            </div>
          </div>

          <button class="mf-exp-btn-primary" id="btn-next-learning" style="margin-top:12px;">
            <span>새로 알게 된 점 정리하기</span> &rarr;
          </button>
        `;

        let selectedCmp = 'slightly_different';
        container.querySelectorAll('.cmp-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.cmp-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCmp = btn.getAttribute('data-cmp');
            const respField = container.querySelector('#response-possible-field');
            if (respField) {
              respField.style.display = (selectedCmp === 'almost_same') ? 'block' : 'none';
            }
          });
        });

        let respPossible = 'yes';
        container.querySelectorAll('.resp-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.resp-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            respPossible = btn.getAttribute('data-val');
          });
        });

        container.querySelector('#btn-next-learning').addEventListener('click', () => {
          exp.followup.comparison = selectedCmp;
          exp.followup.wasResponsePossible = respPossible;
          renderLearningStep(isPartial);
        });
      };

      // 분기 4: 학습(Learning) 및 다음 선택(Next Choice)
      const renderLearningStep = (isPartial) => {
        container.innerHTML = `
          <div class="mf-exp-header">
            <span class="mf-exp-tag">💡 재학습과 다음 선택</span>
            <button class="mf-exp-close" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">&times;</button>
          </div>
          <h3 class="mf-exp-title">이번 경험에서 새로 알게 된 것은?</h3>

          <div class="space-y-1 mb-3">
            ${[
              "예상했던 것보다 견딜 만했다",
              "상대 반응을 내가 통제할 수는 없었다",
              "불안이 있어도 행동을 늦출 수 있었다",
              "작게 시작하니 생각보다 쉬웠다",
              "예상이 실제와 비슷했지만 대처할 수 있었다",
              "아직 잘 모르겠다 / 배운 게 없음"
            ].map(l => `
              <button type="button" class="mf-exp-select-btn learn-btn text-left text-xs" data-learn="${l}">
                ${l}
              </button>
            `).join('')}
          </div>

          <div class="mf-exp-field">
            <label class="mf-exp-label">비슷한 장면이 오면 다음에는 무엇을 해볼까요?</label>
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <button type="button" class="mf-exp-select-btn next-btn text-center" data-next="same_again">같은 행동 다시</button>
              <button type="button" class="mf-exp-select-btn next-btn text-center" data-next="smaller">조금 더 작은 행동</button>
              <button type="button" class="mf-exp-select-btn next-btn text-center" data-next="bigger">조금 더 큰 행동</button>
              <button type="button" class="mf-exp-select-btn next-btn text-center" data-next="different">다른 행동</button>
            </div>
          </div>

          <button class="mf-exp-btn-primary" id="btn-complete-exp" style="margin-top:16px;">
            ✨ 이번 실험 완료하기
          </button>
        `;

        let selectedLearning = "예상했던 것보다 견딜 만했다";
        container.querySelectorAll('.learn-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.learn-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedLearning = btn.getAttribute('data-learn');
          });
        });

        let selectedNext = 'same_again';
        container.querySelectorAll('.next-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            container.querySelectorAll('.next-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedNext = btn.getAttribute('data-next');
          });
        });

        container.querySelector('#btn-complete-exp').addEventListener('click', () => {
          exp.status = isPartial ? EXPERIMENT_STATUS.PARTIAL : EXPERIMENT_STATUS.DONE;
          exp.followup.learning = selectedLearning;
          exp.followup.nextChoice = selectedNext;
          ExperimentStore.update(exp.experimentId, exp);

          // 안전한 익명 분석 이벤트 전송 (원문 차단)
          trackSafeExperimentEvent('experiment_done', {
            experimentId: exp.experimentId,
            cardId: exp.sourceCardId,
            status: exp.status,
            comparison: exp.followup.comparison,
            nextChoice: exp.followup.nextChoice
          });

          renderFinishScreen(exp);
        });
      };

      // 분기 5: 완료 화면 (Finish)
      const renderFinishScreen = (exp) => {
        container.innerHTML = `
          <div class="text-center py-4">
            <div style="font-size:40px; margin-bottom:12px;">🌱</div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">실제 데이터를 하나 얻었습니다</h3>
            <p class="text-xs text-slate-600 leading-relaxed mb-6">
              예상이 맞았든 달랐든,<br>
              <strong>다음 선택에 쓸 수 있는 경험이 하나 생겼습니다.</strong><br>
              한 번에 모든 게 바뀌지 않아도 괜찮습니다. 선택의 길이 넓어졌습니다.
            </p>

            <div class="space-y-2">
              <a href="/my/working-map.html" class="mf-exp-btn-primary block text-center no-underline" style="text-decoration:none;">
                🗺️ 나의 작동지도에 반영하기 &rarr;
              </a>
              <button class="mf-exp-btn-secondary" onclick="window.MyungsimExperiment.ui.closeFollowupModal()">
                여기서 끝내기
              </button>
            </div>
          </div>
        `;
        this.renderActiveExperimentBanner();
      };

      renderFollowStep1();
      modal.style.display = 'flex';
    }

    closeFollowupModal() {
      const modal = document.getElementById('mf-experiment-followup-modal');
      if (modal) modal.style.display = 'none';
      this.renderActiveExperimentBanner();
    }

    closeExperimentWithReason(id) {
      if (confirm('이 작은 행동실험을 여기서 닫으시겠습니까?\n언제든 새로운 실험을 시작하실 수 있습니다.')) {
        ExperimentStore.close(id);
        this.closeFollowupModal();
        this.renderActiveExperimentBanner();
      }
    }

    // -------------------------------------------------------------
    // 상단 Active Experiment 배너 및 Reassurance Loop 배너 렌더링
    // -------------------------------------------------------------
    renderActiveExperimentBanner() {
      const targetContainer = document.getElementById('myungsim-active-experiment-banner-container');
      if (!targetContainer) return;

      const activeExp = ExperimentStore.getActive();
      if (!activeExp) {
        targetContainer.innerHTML = '';
        targetContainer.style.display = 'none';
        return;
      }

      targetContainer.style.display = 'block';
      targetContainer.innerHTML = `
        <div class="mf-active-exp-bar animate-fade-in">
          <div class="flex items-center gap-2 overflow-hidden">
            <span class="shrink-0 text-emerald-400">📌</span>
            <div class="truncate">
              <span class="text-[11px] text-slate-300 block">아직 확인하지 않은 지난번 선택</span>
              <strong class="text-white text-xs truncate">"${activeExp.selectedAction}"</strong>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-3">
            <button class="mf-active-exp-btn" onclick="window.MyungsimExperiment.ui.openFollowupModal('${activeExp.experimentId}')">
              어떻게 됐는지 기록하기
            </button>
            <button class="text-slate-400 hover:text-white text-xs" onclick="window.MyungsimExperiment.ui.closeExperimentWithReason('${activeExp.experimentId}')" title="실험 닫기">
              &times;
            </button>
          </div>
        </div>
      `;
    }

    // Reassurance Loop 방지 배너 (카드 연속 조회 시)
    checkAndRenderReassurancePrompt() {
      const reassuranceContainer = document.getElementById('myungsim-reassurance-guard-container');
      if (!reassuranceContainer) return;

      const activeExp = ExperimentStore.getActive();
      if (!activeExp) return;

      // 브라우즈 카운트 확인
      let count = parseInt(sessionStorage.getItem('myungsim_browse_count') || '0', 10);
      count++;
      sessionStorage.setItem('myungsim_browse_count', count.toString());

      if (count >= 3) {
        reassuranceContainer.innerHTML = `
          <div class="mf-reassurance-box">
            <div class="flex items-center gap-2">
              <span>🌿</span>
              <span>새로운 질문을 하나 더 찾기보다, <strong>지난 선택의 실제 결과</strong>를 먼저 확인해볼까요?</span>
            </div>
            <button class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 ml-2" onclick="window.MyungsimExperiment.ui.openFollowupModal('${activeExp.experimentId}')">
              지난 행동 돌아보기 &rarr;
            </button>
          </div>
        `;
      }
    }
  }

  // -------------------------------------------------------------
  // 9. 전역 네임스페이스 등록
  // -------------------------------------------------------------
  const experimentEngine = {
    ExperimentStore: ExperimentStore,
    MyungsimBehaviorExperiment: MyungsimBehaviorExperiment,
    MicroActions: MICRO_ACTION_LIBRARY,
    Directions: DIRECTION_OPTIONS,
    ControlCircles: CONTROL_CIRCLES,
    Templates: CATEGORY_TEMPLATES,
    checkHighStakes: checkHighStakes,
    trackSafeEvent: trackSafeExperimentEvent,
    ui: new ExperimentUI(),
    init: function() {
      this.ui.renderActiveExperimentBanner();
    }
  };

  window.MyungsimExperiment = experimentEngine;

  // DOM 로드 시 초기화
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', () => experimentEngine.init());
    }
  } else {
    experimentEngine.init();
  }

})(window);
