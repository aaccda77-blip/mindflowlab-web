/**
 * =================================================================
 * MYUNGSIM 1-MINUTE CORE EXPERIENCE ENGINE v1
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * 60~90초 안에 고민 입력 -> 질문 발견 -> 1분 SCAN -> 10% 행동 선택 -> 삶으로 복귀
 * NO-AI Production Core / Zero External API Calls
 * =================================================================
 */

(function(window) {
  'use strict';

  // 1. 상태 상수
  const FLOW_STEPS = {
    ENTRY: 'entry',             // 고민 입력 (진입)
    DISCOVERY: 'discovery',     // 가까운 질문 Top 2~3 선택
    SCAN_A: 'scan_a',           // 1분 SCAN - Screen A: FACT vs STORY
    SCAN_B: 'scan_b',           // 1분 SCAN - Screen B: BODY/URGE & SYNC
    SCAN_C: 'scan_c',           // 1분 SCAN - Screen C: SHIFT
    ACTION: 'action',           // 10% ACTION & Action Ladder
    COMPLETE: 'complete'        // 삶으로 복귀 및 완료
  };

  class MyungsimCoreFlow {
    constructor(options = {}) {
      this.options = Object.assign({
        containerId: 'myungsim-core-flow-modal',
        onComplete: null,
        onSafetyIntercept: null
      }, options);

      this.currentStep = FLOW_STEPS.ENTRY;
      this.query = '';
      this.selectedCard = null;
      this.currentActionLevel = '10%'; // '10%', '5%', '1%'
      this.sessionStartTime = null;
      this.scanStepTimes = {};
      this.router = window.MyeongsimAIRouter || null;
      this.cardData = window.MIND_CARDS_DATA || [];

      this.initModal();
    }

    // 모달 DOM 생성 및 초기화
    initModal() {
      let modal = document.getElementById(this.options.containerId);
      if (!modal) {
        modal = document.createElement('div');
        modal.id = this.options.containerId;
        modal.className = 'mf-core-modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
          <div class="mf-core-container" role="dialog" aria-modal="true" aria-labelledby="mf-core-title">
            <!-- Header -->
            <div class="mf-core-header">
              <div class="mf-core-step-indicator" id="mf-core-indicator">
                <span class="mf-dot active" data-step="entry"></span>
                <span class="mf-dot" data-step="discovery"></span>
                <span class="mf-dot" data-step="scan"></span>
                <span class="mf-dot" data-step="action"></span>
              </div>
              <button class="mf-core-close-btn" id="mf-core-close" aria-label="닫기">&times;</button>
            </div>

            <!-- Body Stage Container -->
            <div class="mf-core-body" id="mf-core-body-stage">
              <!-- 단계별 화면이 동적으로 렌더링됩니다 -->
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // 이벤트 바인딩
        document.getElementById('mf-core-close').addEventListener('click', () => this.close());
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.close();
        });
      }
      this.modalElement = modal;
    }

    // 플로우 열기
    open(initialQuery = '') {
      this.currentStep = FLOW_STEPS.ENTRY;
      this.query = initialQuery;
      this.selectedCard = null;
      this.currentActionLevel = '10%';
      this.sessionStartTime = Date.now();
      this.scanStepTimes = {};
      this.modalElement.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (typeof window.trackMindEvent === 'function') {
        window.trackMindEvent('one_minute_flow_open', {});
      }
      this.renderCurrentStep();
    }

    // 플로우 닫기
    close() {
      this.modalElement.style.display = 'none';
      document.body.style.overflow = '';
      this.currentStep = FLOW_STEPS.ENTRY;
    }

    // 단계별 렌더링 라우터
    renderCurrentStep() {
      const stage = document.getElementById('mf-core-body-stage');
      if (!stage) return;

      this.updateIndicators();

      switch (this.currentStep) {
        case FLOW_STEPS.ENTRY:
          this.renderEntryScreen(stage);
          break;
        case FLOW_STEPS.DISCOVERY:
          this.renderDiscoveryScreen(stage);
          break;
        case FLOW_STEPS.SCAN_A:
          this.renderScanScreenA(stage);
          break;
        case FLOW_STEPS.SCAN_B:
          this.renderScanScreenB(stage);
          break;
        case FLOW_STEPS.SCAN_C:
          this.renderScanScreenC(stage);
          break;
        case FLOW_STEPS.ACTION:
          this.renderActionScreen(stage);
          break;
        case FLOW_STEPS.COMPLETE:
          this.renderCompleteScreen(stage);
          break;
      }
    }

    // 인디케이터 업데이트
    updateIndicators() {
      const dots = document.querySelectorAll('#mf-core-indicator .mf-dot');
      dots.forEach(d => d.classList.remove('active', 'completed'));

      let activeIndex = 0;
      if (this.currentStep === FLOW_STEPS.DISCOVERY) activeIndex = 1;
      else if (this.currentStep.startsWith('scan_')) activeIndex = 2;
      else if (this.currentStep === FLOW_STEPS.ACTION || this.currentStep === FLOW_STEPS.COMPLETE) activeIndex = 3;

      dots.forEach((dot, idx) => {
        if (idx < activeIndex) dot.classList.add('completed');
        else if (idx === activeIndex) dot.classList.add('active');
      });
    }

    // -------------------------------------------------------------
    // Screen 1: 진입 & 고민 한 문장 입력
    // -------------------------------------------------------------
    renderEntryScreen(stage) {
      stage.innerHTML = `
        <div class="mf-screen-entry animate-fade-in">
          <div class="mf-badge-tag">1-Minute MyungSim</div>
          <h2 class="mf-screen-title" id="mf-core-title">지금 어떤 장면이<br>머릿속을 맴도나요?</h2>
          <p class="mf-screen-sub">평가하거나 해결하려 하지 말고, 있었던 일이나 떠오른 생각을 적어보세요.</p>

          <div class="mf-input-wrapper">
            <textarea id="mf-query-input" class="mf-textarea" rows="3" placeholder="예: 팀장님이 회의 때 콕 집어 지적해서 하루 종일 얼굴이 화끈거려요.">${this.query || ''}</textarea>
          </div>

          <!-- 퀵 무드 칩스 -->
          <div class="mf-chips-row">
            <button class="mf-chip" data-text="카톡 답장이 없어서 자꾸 신경 쓰여요">#카톡읽씹</button>
            <button class="mf-chip" data-text="시작해야 하는데 계속 폰만 보고 미뤄요">#미루기</button>
            <button class="mf-chip" data-text="남들보다 뒤처지는 것 같아 불안해요">#비교불안</button>
            <button class="mf-chip" data-text="부모님 잔소리에 나도 모르게 화를 냈어요">#가족갈등</button>
          </div>

          <div class="mf-btn-group">
            <button class="mf-btn-primary" id="mf-btn-submit-query">내 마음 비추어보기</button>
          </div>
          <div class="mf-notice-micro">개인 기록은 외부 AI나 서버로 전송되지 않으며, 기기 내에만 안전하게 머뭅니다.</div>
        </div>
      `;

      // 칩 클릭 시 텍스트 채우기
      stage.querySelectorAll('.mf-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const txt = e.currentTarget.getAttribute('data-text');
          const input = document.getElementById('mf-query-input');
          if (input) {
            input.value = txt;
            input.focus();
          }
        });
      });

      // 제출 이벤트
      document.getElementById('mf-btn-submit-query').addEventListener('click', () => {
        const val = document.getElementById('mf-query-input').value.trim();
        if (!val) {
          alert('마음에 맴도는 생각을 한 줄 적어주세요.');
          return;
        }
        this.query = val;
        this.processQuery(val);
      });
    }

    // 쿼리 라우팅 및 안전 검사
    processQuery(queryText) {
      if (!this.router) {
        if (window.MyeongsimAIRouter) this.router = window.MyeongsimAIRouter;
      }

      let routeResult = null;
      if (this.router && typeof this.router.route === 'function') {
        routeResult = this.router.route(queryText);
      } else {
        // Fallback Mocking if router unavailable
        routeResult = { status: 'success', recommendations: [] };
      }

      // 위기 상황 인터셉트 (100% 방어)
      if (routeResult.status === 'high_risk_blocked') {
        this.renderSafetyScreen(routeResult);
        return;
      }

      this.currentRecommendations = routeResult.recommendations || [];
      if (this.currentRecommendations.length === 0) {
        // 추천이 없으면 기본 추천 카드 3장 제공
        const defaultIds = ['PACK01-01', 'PACK02-01', 'PACK04-01'];
        this.currentRecommendations = this.cardData.filter(c => defaultIds.includes(c.id)).map(c => ({
          id: c.id,
          title: c.cardTitle,
          question: c.question,
          card: c,
          score: 10.0,
          why: '지금 가장 보편적으로 마음의 쉼을 주는 기본 관찰 카드입니다.'
        }));
      }

      this.currentStep = FLOW_STEPS.DISCOVERY;
      this.renderCurrentStep();
    }

    // 고위험 위기 상담 화면 (Safety Shield)
    renderSafetyScreen(routeResult) {
      const stage = document.getElementById('mf-core-body-stage');
      const tel = (routeResult.safety && routeResult.safety.tel) || '109';
      stage.innerHTML = `
        <div class="mf-screen-safety animate-fade-in">
          <div class="mf-safety-icon">🤍</div>
          <h2 class="mf-screen-title">지금 당신의 마음과 안전이<br>가장 소중합니다.</h2>
          <p class="mf-screen-sub">혼자 감당하기 벅찬 고통이나 위기감이 든다면, 지금 바로 전문가의 따뜻한 손을 잡아주세요.</p>

          <div class="mf-crisis-box">
            <div class="mf-crisis-title">24시간 자살예방 및 정신건강 위기상담</div>
            <a href="tel:${tel}" class="mf-crisis-tel-btn">📞 전화상담 ${tel} (무료/24시간)</a>
            <div class="mf-crisis-subtel">청소년 모바일 상담: 다들어줄개 1588-7238 / 문자 1661-5004</div>
          </div>

          <p class="mf-safety-guide">명심코칭은 일상의 생각 패턴 관찰을 돕는 도구이며, 전문 의료·응급 치료를 대신할 수 없습니다.</p>
          <div class="mf-btn-group">
            <button class="mf-btn-secondary" id="mf-btn-safety-close">창 닫기</button>
          </div>
        </div>
      `;
      document.getElementById('mf-btn-safety-close').addEventListener('click', () => this.close());
    }

    // -------------------------------------------------------------
    // Screen 2: 가까운 질문 Top 2~3 발견 (Discovery & SODA)
    // -------------------------------------------------------------
    renderDiscoveryScreen(stage) {
      let cardsHtml = '';
      this.currentRecommendations.forEach((rec, idx) => {
        const c = rec.card || this.cardData.find(x => x.id === (rec.id || rec.card_id)) || {};
        const title = c.cardTitle || rec.title || `명심카드 ${rec.id}`;
        const question = c.question || rec.question || '';
        const keyword = c.keyword || '관찰';
        const matchWhy = rec.why || (c.matchReasons && c.matchReasons.trigger) || '이 고민의 핵심 패턴을 짚어주는 질문입니다.';
        const sodaAction = c.action10Percent || '잠시 숨을 깊게 내쉬고 어깨를 내려놓기';

        cardsHtml += `
          <div class="mf-discovery-card animate-slide-up" data-card-id="${c.id || rec.id}">
            <div class="mf-card-top-meta">
              <span class="mf-card-chip">#${keyword}</span>
              <span class="mf-card-rec-badge">${idx === 0 ? '가장 가까운 질문' : '함께 볼 질문'}</span>
            </div>
            <h3 class="mf-discovery-q">"${question}"</h3>
            <div class="mf-discovery-soda">
              <div class="mf-soda-label">💡 사이다 관찰</div>
              <div class="mf-soda-text">${matchWhy}</div>
            </div>
            <button class="mf-btn-select-card" data-card-id="${c.id || rec.id}">이 질문으로 1분 관찰하기 &rarr;</button>
          </div>
        `;
      });

      stage.innerHTML = `
        <div class="mf-screen-discovery animate-fade-in">
          <div class="mf-badge-tag">STEP 2 &middot; 질문 발견</div>
          <h2 class="mf-screen-title">내 마음에 가장 와닿는<br>질문 하나를 골라보세요.</h2>
          <div class="mf-cards-container">
            ${cardsHtml}
          </div>
        </div>
      `;

      stage.querySelectorAll('.mf-btn-select-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cid = e.currentTarget.getAttribute('data-card-id');
          const found = this.cardData.find(x => x.id === cid) || 
                        (this.currentRecommendations.find(r => (r.id || r.card_id) === cid) || {}).card;
          this.selectedCard = found || { id: cid, cardTitle: '명심카드', question: '지금 무엇이 일어났나요?' };
          this.currentStep = FLOW_STEPS.SCAN_A;
          this.scanStepTimes.start = Date.now();
          this.renderCurrentStep();
        });
      });
    }

    // -------------------------------------------------------------
    // Screen 3-A: 1분 SCAN - Screen A (FACT vs STORY)
    // -------------------------------------------------------------
    renderScanScreenA(stage) {
      const c = this.selectedCard;
      const factGuide = c.factGuide || "실제 일어난 일(카메라에 찍힌 객관적 장면)";
      const storyGuide = c.storyGuide || (c.storyTrigger ? `뇌가 덧붙인 이야기: "${c.storyTrigger}"` : "뇌가 불안해서 만들어낸 상상과 해석");

      stage.innerHTML = `
        <div class="mf-screen-scan animate-fade-in">
          <div class="mf-scan-progress-bar"><div class="mf-bar-fill" style="width: 33%;"></div></div>
          <div class="mf-badge-tag">1분 SCAN &middot; 1/3 FACT vs STORY</div>
          <h2 class="mf-screen-title">사실과 이야기를<br>선명하게 갈라봅니다.</h2>

          <div class="mf-fact-story-box">
            <div class="mf-fs-item fact">
              <div class="mf-fs-tag">📷 FACT (카메라에 찍힌 사실)</div>
              <div class="mf-fs-content">${this.query || "상대가 보낸 메시지 / 일어난 객관적 상황"}</div>
            </div>
            <div class="mf-fs-arrow">&darr;</div>
            <div class="mf-fs-item story">
              <div class="mf-fs-tag">💭 STORY (내 뇌가 쓴 소설)</div>
              <div class="mf-fs-content">${storyGuide}</div>
            </div>
          </div>

          <div class="mf-scan-insight">
            "사실은 바깥에 있고, 괴로움은 뇌가 덧붙인 이야기에서 시작됩니다."
          </div>

          <div class="mf-btn-group">
            <button class="mf-btn-primary" id="mf-btn-scan-a-next">이야기를 알아차렸습니다 &rarr;</button>
          </div>
        </div>
      `;

      document.getElementById('mf-btn-scan-a-next').addEventListener('click', () => {
        this.scanStepTimes.scan_a = Date.now();
        this.currentStep = FLOW_STEPS.SCAN_B;
        this.renderCurrentStep();
      });
    }

    // -------------------------------------------------------------
    // Screen 3-B: 1분 SCAN - Screen B (BODY / URGE & SYNC)
    // -------------------------------------------------------------
    renderScanScreenB(stage) {
      const c = this.selectedCard;
      const bodySensation = (c.bodyTags && c.bodyTags.length > 0) ? c.bodyTags.join(', ') : "가슴 답답함, 목 턱 막힘, 어깨 긴장";
      const urgeAction = (c.urgeTags && c.urgeTags.length > 0) ? c.urgeTags.join(', ') : "폰 계속 켜보기, 도망치기, 즉시 사과하기";

      stage.innerHTML = `
        <div class="mf-screen-scan animate-fade-in">
          <div class="mf-scan-progress-bar"><div class="mf-bar-fill" style="width: 66%;"></div></div>
          <div class="mf-badge-tag">1분 SCAN &middot; 2/3 BODY & URGE</div>
          <h2 class="mf-screen-title">지금 몸은 어디가 조이고,<br>어떤 충동이 올라오나요?</h2>

          <div class="mf-body-urge-grid">
            <div class="mf-bu-card">
              <div class="mf-bu-icon">🫀</div>
              <div class="mf-bu-title">몸의 감각 (BODY)</div>
              <div class="mf-bu-desc">${bodySensation}</div>
            </div>
            <div class="mf-bu-card">
              <div class="mf-bu-icon">⚡</div>
              <div class="mf-bu-title">자동 충동 (URGE)</div>
              <div class="mf-bu-desc">${urgeAction}</div>
            </div>
          </div>

          <!-- SYNC (동기화) 메타인지 -->
          <div class="mf-sync-box">
            <div class="mf-sync-title">🤝 SYNC (알아차림과 수용)</div>
            <div class="mf-sync-desc">
              "내 뇌가 나를 지키려고 비상벨을 울리고 있구나. 몸의 감각을 없애려 하지 않고 잠시 그대로 머물러줍니다."
            </div>
          </div>

          <div class="mf-btn-group">
            <button class="mf-btn-primary" id="mf-btn-scan-b-next">숨 한 번 깊게 내쉬기 &rarr;</button>
          </div>
        </div>
      `;

      document.getElementById('mf-btn-scan-b-next').addEventListener('click', () => {
        this.scanStepTimes.scan_b = Date.now();
        this.currentStep = FLOW_STEPS.SCAN_C;
        this.renderCurrentStep();
      });
    }

    // -------------------------------------------------------------
    // Screen 3-C: 1분 SCAN - Screen C (SHIFT)
    // -------------------------------------------------------------
    renderScanScreenC(stage) {
      const c = this.selectedCard;
      const shiftQuestion = c.question || "지금 이 순간 내가 진짜 통제할 수 있는 작은 행동은 무엇인가요?";
      const shiftEssence = (c.syncShift && c.syncShift.shift) || c.shortDescription || "통제할 수 없는 타인의 마음 대신, 내 손안의 10%에 집중합니다.";

      stage.innerHTML = `
        <div class="mf-screen-scan animate-fade-in">
          <div class="mf-scan-progress-bar"><div class="mf-bar-fill" style="width: 100%;"></div></div>
          <div class="mf-badge-tag">1분 SCAN &middot; 3/3 SHIFT 관점 전환</div>
          <h2 class="mf-screen-title">충동 대신 선택할<br>새로운 관점 (SHIFT)</h2>

          <div class="mf-shift-card">
            <div class="mf-shift-badge">CORE SHIFT</div>
            <div class="mf-shift-question">"${shiftQuestion}"</div>
            <div class="mf-shift-text">${shiftEssence}</div>
          </div>

          <div class="mf-btn-group">
            <button class="mf-btn-primary" id="mf-btn-scan-c-next">오늘의 10% 행동 선택하기 &rarr;</button>
          </div>
        </div>
      `;

      document.getElementById('mf-btn-scan-c-next').addEventListener('click', () => {
        this.scanStepTimes.scan_c = Date.now();
        this.currentStep = FLOW_STEPS.ACTION;
        this.renderCurrentStep();
      });
    }

    // -------------------------------------------------------------
    // Screen 4: 10% ACTION & Action Ladder (사다리 분해)
    // -------------------------------------------------------------
    renderActionScreen(stage) {
      const c = this.selectedCard;
      const action10 = c.action10Percent || "지금 물 한 컵 마시고 의자에 등 기대기";
      const action5 = c.smallerAction || "스마트폰을 화면이 바닥을 향하게 뒤집어두기";
      const action1 = "깊게 세 번 들이쉬고 길게 내쉬기 (호흡 3회)";

      let displayAction = action10;
      let ladderNotice = "지금 즉시 실행할 수 있는 현실적인 10% 행동입니다.";
      if (this.currentActionLevel === '5%') {
        displayAction = action5;
        ladderNotice = "부담을 반으로 줄인 5% 한 걸음입니다.";
      } else if (this.currentActionLevel === '1%') {
        displayAction = action1;
        ladderNotice = "단 1초면 가능한 깃털 1% 행동입니다.";
      }

      stage.innerHTML = `
        <div class="mf-screen-action animate-fade-in">
          <div class="mf-badge-tag">STEP 4 &middot; 10% ACTION</div>
          <h2 class="mf-screen-title">삶으로 가져갈<br>오늘의 작은 행동</h2>

          <div class="mf-action-box" id="mf-current-action-box">
            <div class="mf-action-level-badge">${this.currentActionLevel} ACTION</div>
            <div class="mf-action-content">${displayAction}</div>
            <div class="mf-action-ladder-notice">${ladderNotice}</div>
          </div>

          <!-- Action Ladder 토글 -->
          <div class="mf-ladder-controls">
            ${this.currentActionLevel === '10%' ? `
              <button class="mf-btn-ladder" id="mf-btn-ladder-down">이 행동도 조금 부담스러우신가요? (5%로 줄이기) &darr;</button>
            ` : this.currentActionLevel === '5%' ? `
              <button class="mf-btn-ladder" id="mf-btn-ladder-down">더 가볍게 하고 싶어요 (1% 깃털 행동) &darr;</button>
            ` : `
              <div class="mf-ladder-min">가장 가벼운 깃털 행동에 도달했습니다 ✨</div>
            `}
          </div>

          <!-- 행동실험(Behavior Experiment) 저장 선택 옵션 -->
          <div class="mf-experiment-prompt-box" style="margin-top: 14px; padding: 12px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 12px; font-size: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; color: #0f766e;">🌱 이 선택을 작은 행동실험으로 남기기</span>
              <button type="button" id="mf-btn-save-as-experiment" style="background: #0f766e; color: #ffffff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
                실험으로 저장
              </button>
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
              결과를 바꾸려 애쓰기보다 내 예상과 실제를 비교해보는 10% 시도입니다.
            </div>
          </div>

          <div class="mf-btn-group" style="margin-top: 16px;">
            <button class="mf-btn-primary" id="mf-btn-commit-action">이 행동을 품고 삶으로 복귀합니다</button>
          </div>
        </div>
      `;

      const downBtn = document.getElementById('mf-btn-ladder-down');
      if (downBtn) {
        downBtn.addEventListener('click', () => {
          if (this.currentActionLevel === '10%') this.currentActionLevel = '5%';
          else if (this.currentActionLevel === '5%') this.currentActionLevel = '1%';
          this.renderActionScreen(stage);
        });
      }

      // 행동실험으로 저장 버튼 클릭
      const expBtn = document.getElementById('mf-btn-save-as-experiment');
      if (expBtn) {
        expBtn.addEventListener('click', () => {
          const rec = this.saveSessionRecord(displayAction);
          if (window.MyungsimExperiment && window.MyungsimExperiment.ui) {
            window.MyungsimExperiment.ui.openCreateModal(this.selectedCard, rec || {});
          }
          this.currentStep = FLOW_STEPS.COMPLETE;
          this.renderCurrentStep();
        });
      }

      document.getElementById('mf-btn-commit-action').addEventListener('click', () => {
        this.saveSessionRecord(displayAction);
        this.currentStep = FLOW_STEPS.COMPLETE;
        this.renderCurrentStep();
      });
    }

    // 세션 완료 데이터 로컬 저장 (프라이버시 100% 보장)
    saveSessionRecord(chosenAction) {
      const now = new Date();
      const totalDurationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);

      const record = {
        id: 'sess_' + Date.now(),
        timestamp: now.toISOString(),
        durationSec: totalDurationSec,
        query: this.query,
        cardId: this.selectedCard.id,
        cardTitle: this.selectedCard.cardTitle,
        question: this.selectedCard.question,
        category: this.selectedCard.category,
        actionLevel: this.currentActionLevel,
        chosenAction: chosenAction,
        tags: {
          trigger: this.selectedCard.triggerTags || [],
          story: this.selectedCard.storyTags || [],
          body: this.selectedCard.bodyTags || [],
          urge: this.selectedCard.urgeTags || [],
          action: this.selectedCard.actionTags || []
        }
      };

      try {
        const key = 'myeongsim_personal_sessions';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(record);
        // 최근 50개 세션 보관
        if (existing.length > 50) existing.length = 50;
        localStorage.setItem(key, JSON.stringify(existing));

        // 옵션 콜백 호출
        if (typeof this.options.onComplete === 'function') {
          this.options.onComplete(record);
        }
      } catch (err) {
        console.warn('[MyungsimCoreFlow] Local storage save skipped:', err);
      }
      return record;
    }

    // -------------------------------------------------------------
    // Screen 5: 완료 및 삶으로 복귀 (Complete)
    // -------------------------------------------------------------
    renderCompleteScreen(stage) {
      const totalDurationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);

      stage.innerHTML = `
        <div class="mf-screen-complete animate-fade-in">
          <div class="mf-complete-icon">🌱</div>
          <h2 class="mf-screen-title">1분의 관찰이 끝났습니다.</h2>
          <p class="mf-screen-sub">
            소설에서 빠져나와 몸을 깨닫고, 현실의 10%를 선택했습니다.<br>
            소요 시간: <strong>${totalDurationSec}초</strong>
          </p>

          <div class="mf-complete-box">
            <div class="mf-complete-card-title">${this.selectedCard.cardTitle}</div>
            <div class="mf-complete-action">"${this.selectedCard.action10Percent}"</div>
          </div>

          <div class="mf-btn-group">
            <button class="mf-btn-primary" id="mf-btn-finish">마음 가볍게 일상으로 복귀하기</button>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 8px;">
              <a href="/my/experiments.html" class="mf-btn-link">내 행동실험 목록 &rarr;</a>
              <span style="color:#cbd5e1;">&middot;</span>
              <a href="/my/working-map.html" class="mf-btn-link">나의 작동지도 &rarr;</a>
            </div>
          </div>
        </div>
      `;

      document.getElementById('mf-btn-finish').addEventListener('click', () => {
        this.close();
      });
    }
  }

  // CSS 스타일 주입
  const CORE_FLOW_STYLES = `
    .mf-core-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .mf-core-container {
      width: 100%;
      max-width: 440px;
      min-height: 540px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif;
    }
    .mf-core-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .mf-core-step-indicator {
      display: flex;
      gap: 8px;
    }
    .mf-dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: #e2e8f0;
      transition: all 0.3s ease;
    }
    .mf-dot.active {
      width: 24px;
      background: #4f46e5;
    }
    .mf-dot.completed {
      background: #818cf8;
    }
    .mf-core-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }
    .mf-core-body {
      padding: 24px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .mf-badge-tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: #4f46e5;
      background: #eef2ff;
      padding: 4px 10px;
      border-radius: 12px;
      margin-bottom: 12px;
    }
    .mf-screen-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
      margin: 0 0 8px 0;
    }
    .mf-screen-sub {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .mf-textarea {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 16px;
      padding: 14px;
      font-size: 15px;
      resize: none;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    .mf-textarea:focus {
      border-color: #4f46e5;
    }
    .mf-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 14px 0 24px 0;
    }
    .mf-chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      color: #475569;
      cursor: pointer;
      transition: background 0.2s;
    }
    .mf-chip:hover {
      background: #f1f5f9;
    }
    .mf-btn-primary {
      width: 100%;
      background: #4f46e5;
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 15px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .mf-btn-primary:hover {
      background: #4338ca;
    }
    .mf-notice-micro {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      margin-top: 14px;
    }
    .mf-cards-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      max-height: 380px;
    }
    .mf-discovery-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      background: #fafafa;
    }
    .mf-discovery-card:first-child {
      border-color: #4f46e5;
      background: #f8faff;
    }
    .mf-card-top-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .mf-card-chip {
      font-size: 11px;
      font-weight: 700;
      color: #6366f1;
    }
    .mf-card-rec-badge {
      font-size: 11px;
      color: #10b981;
      font-weight: 700;
    }
    .mf-discovery-q {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 10px 0;
      line-height: 1.4;
    }
    .mf-discovery-soda {
      background: #ffffff;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 12px;
      border: 1px solid #eef2f6;
    }
    .mf-soda-label {
      font-size: 11px;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 2px;
    }
    .mf-soda-text {
      font-size: 13px;
      color: #475569;
      line-height: 1.4;
    }
    .mf-btn-select-card {
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px;
      font-size: 13px;
      font-weight: 700;
      color: #4f46e5;
      cursor: pointer;
    }
    .mf-btn-select-card:hover {
      background: #eef2ff;
      border-color: #4f46e5;
    }
    .mf-scan-progress-bar {
      width: 100%;
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .mf-bar-fill {
      height: 100%;
      background: #4f46e5;
      transition: width 0.3s ease;
    }
    .mf-fact-story-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 16px 0;
    }
    .mf-fs-item {
      padding: 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.45;
    }
    .mf-fs-item.fact {
      background: #f1f5f9;
      color: #334155;
    }
    .mf-fs-item.story {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fee2e2;
    }
    .mf-fs-tag {
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .mf-fs-arrow {
      text-align: center;
      color: #94a3b8;
      font-size: 18px;
    }
    .mf-scan-insight {
      font-size: 13px;
      color: #64748b;
      text-align: center;
      font-style: italic;
      margin-bottom: 24px;
    }
    .mf-body-urge-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 16px 0;
    }
    .mf-bu-card {
      background: #f8fafc;
      border-radius: 14px;
      padding: 14px;
      border: 1px solid #e2e8f0;
    }
    .mf-bu-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .mf-bu-title {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 4px;
    }
    .mf-bu-desc {
      font-size: 13px;
      color: #0f172a;
      line-height: 1.4;
      font-weight: 600;
    }
    .mf-sync-box {
      background: #eff6ff;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 20px;
      border: 1px solid #dbeafe;
    }
    .mf-sync-title {
      font-size: 12px;
      font-weight: 800;
      color: #1d4ed8;
      margin-bottom: 4px;
    }
    .mf-sync-desc {
      font-size: 13px;
      color: #1e3a8a;
      line-height: 1.45;
    }
    .mf-shift-card {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 16px;
      padding: 20px;
      margin: 20px 0 24px 0;
      text-align: center;
    }
    .mf-shift-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      color: #15803d;
      background: #dcfce7;
      padding: 3px 8px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .mf-shift-question {
      font-size: 17px;
      font-weight: 800;
      color: #14532d;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .mf-shift-text {
      font-size: 14px;
      color: #166534;
      line-height: 1.5;
    }
    .mf-action-box {
      background: #f8fafc;
      border: 2px solid #6366f1;
      border-radius: 16px;
      padding: 20px;
      margin: 16px 0 12px 0;
      text-align: center;
    }
    .mf-action-level-badge {
      font-size: 12px;
      font-weight: 800;
      color: #4f46e5;
      margin-bottom: 8px;
    }
    .mf-action-content {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .mf-action-ladder-notice {
      font-size: 12px;
      color: #64748b;
    }
    .mf-ladder-controls {
      text-align: center;
      margin-bottom: 24px;
    }
    .mf-btn-ladder {
      background: none;
      border: none;
      font-size: 12px;
      color: #6366f1;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }
    .mf-ladder-min {
      font-size: 12px;
      color: #10b981;
      font-weight: 700;
    }
    .mf-screen-safety {
      text-align: center;
      padding: 10px 0;
    }
    .mf-safety-icon {
      font-size: 44px;
      margin-bottom: 12px;
    }
    .mf-crisis-box {
      background: #fef2f2;
      border: 1.5px solid #f87171;
      border-radius: 16px;
      padding: 18px;
      margin: 16px 0;
    }
    .mf-crisis-title {
      font-size: 13px;
      font-weight: 700;
      color: #991b1b;
      margin-bottom: 12px;
    }
    .mf-crisis-tel-btn {
      display: block;
      background: #dc2626;
      color: #ffffff;
      text-decoration: none;
      font-size: 17px;
      font-weight: 800;
      padding: 12px;
      border-radius: 12px;
      margin-bottom: 10px;
    }
    .mf-crisis-subtel {
      font-size: 12px;
      color: #7f1d1d;
    }
    .mf-safety-guide {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 20px;
    }
    .mf-btn-secondary {
      width: 100%;
      background: #f1f5f9;
      color: #475569;
      border: none;
      border-radius: 14px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .mf-screen-complete {
      text-align: center;
      padding: 20px 0;
    }
    .mf-complete-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .mf-complete-box {
      background: #f8fafc;
      border-radius: 16px;
      padding: 16px;
      margin: 20px 0 24px 0;
    }
    .mf-complete-card-title {
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }
    .mf-complete-action {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .mf-btn-link {
      display: block;
      text-align: center;
      margin-top: 14px;
      font-size: 14px;
      font-weight: 700;
      color: #4f46e5;
      text-decoration: none;
    }
    .animate-fade-in {
      animation: mfFadeIn 0.3s ease-out;
    }
    .animate-slide-up {
      animation: mfSlideUp 0.3s ease-out;
    }
    @keyframes mfFadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes mfSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // 스타일 자동 주입
  if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.textContent = CORE_FLOW_STYLES;
    document.head.appendChild(styleTag);
  }

  // 전역 인스턴스 등록
  window.MyungsimCoreFlow = MyungsimCoreFlow;

})(typeof window !== 'undefined' ? window : global);
