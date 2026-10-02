/**
 * MyungSim Evidence-Based Content Expansion Engine v1
 * ===================================================================
 * 실제 반복되는 Content Gap과 Router Failure만을 근거로 기존 200장을
 * 250~300장까지 소규모 배치(10~20장) 단위로 안전하게 확장하는 편집·검증 엔진.
 * 
 * [핵심 원칙]
 * 1. Content Count ≠ Product Quality (수량 자체가 목표가 아님).
 * 2. No Fake / Demo Data (실제 근거가 없으면 WAITING FOR EVIDENCE).
 * 3. Generalized Situation (개인 고민 원문 복사 금지).
 * 4. Rule-Based Zero-Key (외부 AI API 호출 0건).
 * 5. Strict Safety & Non-Moralizing (현실 보존, 원인 억지추론 금지).
 */

(function(global) {
  'use strict';

  var STORAGE_KEYS = {
    GAPS: 'myungsim_content_gaps',
    CANDIDATES: 'myungsim_card_candidates',
    BATCHES: 'myungsim_expansion_batches',
    EXPANSION_STATE: 'myungsim_expansion_state'
  };

  // Gap 상태 정의
  var GAP_STATUS = {
    EMERGING: 'EMERGING',
    REVIEWING: 'REVIEWING',
    VERIFIED: 'VERIFIED',
    ROUTER_FIX: 'ROUTER_FIX',
    EXISTING_CARD_COVERS: 'EXISTING_CARD_COVERS',
    OUT_OF_SCOPE: 'OUT_OF_SCOPE',
    DRAFTING: 'DRAFTING',
    PUBLISHED: 'PUBLISHED',
    DISMISSED: 'DISMISSED'
  };

  // 배치 권장 크기
  var BATCH_CONFIG = {
    MIN_RECOMMENDED: 10,
    MAX_RECOMMENDED: 20,
    ABSOLUTE_MAX: 25,
    CHECKPOINT_THRESHOLD: 250,
    MAX_CAP: 300
  };

  var MyungSimContentExpansion = {
    version: 'v1.0.0-content-expansion',

    _getStorage: function(key, defaultVal) {
      try {
        if (typeof localStorage !== 'undefined') {
          var val = localStorage.getItem(key);
          return val ? JSON.parse(val) : defaultVal;
        }
      } catch (e) {
        console.warn('Content Expansion Storage Read Error:', e);
      }
      return defaultVal;
    },

    _setStorage: function(key, val) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(val));
        }
      } catch (e) {
        console.warn('Content Expansion Storage Write Error:', e);
      }
    },

    init: function() {
      this.getGaps();
      this.getCandidates();
      this.getBatches();
      return true;
    },

    // 1. Content Gap 관리
    getGaps: function() {
      return this._getStorage(STORAGE_KEYS.GAPS, []);
    },

    addGap: function(gapData) {
      var gaps = this.getGaps();
      var newGap = {
        gapId: gapData.gapId || 'GAP-' + Date.now().toString().slice(-4),
        rawSignalCount: gapData.signalCount || 1,
        generalizedSituation: gapData.generalizedSituation || '',
        observedKeyword: gapData.observedKeyword || '',
        category: gapData.category || '일반',
        closestCardIds: gapData.closestCardIds || [],
        status: gapData.status || GAP_STATUS.EMERGING,
        decisionReason: gapData.decisionReason || '',
        createdAt: new Date().toISOString()
      };
      gaps.unshift(newGap);
      this._setStorage(STORAGE_KEYS.GAPS, gaps);
      return newGap;
    },

    updateGapStatus: function(gapId, newStatus, reason) {
      var gaps = this.getGaps();
      var target = gaps.find(function(g) { return g.gapId === gapId; });
      if (!target) throw new Error('Gap not found: ' + gapId);
      
      target.status = newStatus;
      if (reason) target.decisionReason = reason;
      target.updatedAt = new Date().toISOString();
      this._setStorage(STORAGE_KEYS.GAPS, gaps);
      return target;
    },

    // 2. Verified Gap 8대 필수 조건 검증
    evaluateVerifiedGapConditions: function(gap, options) {
      var opts = options || {};
      var signalCount = gap.rawSignalCount || gap.signalCount || 0;
      var check = {
        isRepeatedSignal: signalCount >= (opts.minSignals || 5),
        notCoveredByTop3: opts.notCoveredByTop3 === true,
        routerFixInsufficient: opts.routerFixInsufficient === true,
        hasIndependentScene: Boolean(gap.generalizedSituation && gap.generalizedSituation.length >= 10),
        hasSodaPerspective: opts.hasSodaPerspective === true,
        canScanConcrete: opts.canScanConcrete === true,
        hasSafeTenPercentAction: opts.hasSafeTenPercentAction === true,
        withinMyungsimScope: opts.withinScope !== false
      };

      var passCount = Object.keys(check).filter(function(k) { return check[k] === true; }).length;
      var isVerified = passCount === 8;

      return {
        isVerified: isVerified,
        criteria: check,
        passCount: passCount,
        verdict: isVerified ? GAP_STATUS.VERIFIED : GAP_STATUS.REVIEWING
      };
    },

    // 3. Gap vs Router Failure / Existing Card / Duplicate 분석 엔진
    analyzeGapResolutionTrack: function(query, existingCards) {
      var cards = existingCards || (typeof window !== 'undefined' && window.MIND_CARDS_DATA ? window.MIND_CARDS_DATA : []);
      
      // A. 기존 카드로 검색어 매칭되는지 확인 (Router 가중치/동의어 이슈인지)
      var matchedCard = cards.find(function(c) {
        if (!c.searchKeywords) return false;
        return c.searchKeywords.some(function(k) { return query.indexOf(k) !== -1 || k.indexOf(query) !== -1; });
      });

      if (matchedCard) {
        return {
          resolution: GAP_STATUS.ROUTER_FIX,
          reason: '기존 카드(' + matchedCard.id + ')에 관련 키워드가 이미 존재합니다. 새 카드가 아닌 Router 동의어/가중치 수정을 적용합니다.',
          recommendedCardId: matchedCard.id
        };
      }

      // B. 카테고리 주제 매칭 여부
      var themeCoveredCard = cards.find(function(c) {
        if (!c.question) return false;
        return c.question.indexOf(query) !== -1;
      });

      if (themeCoveredCard) {
        return {
          resolution: GAP_STATUS.EXISTING_CARD_COVERS,
          reason: '기존 카드(' + themeCoveredCard.id + ')의 본문/질문이 해당 맥락을 충분히 포괄합니다.',
          recommendedCardId: themeCoveredCard.id
        };
      }

      // C. 고위험 단어 체크 (OUT_OF_SCOPE)
      var crisisRegex = /(자해|자살|살인|가정폭력|스토킹|전재산 몰빵|임의 중단)/i;
      if (crisisRegex.test(query)) {
        return {
          resolution: GAP_STATUS.OUT_OF_SCOPE,
          reason: '의료/법률/생명 고위험 영역으로, 일반 상담 카드가 아닌 전용 Safety 라우터로 보호되어야 합니다.'
        };
      }

      return {
        resolution: GAP_STATUS.VERIFIED,
        reason: '기존 200개 카드로 해결되지 않는 독립적 장면과 질문이 확인되었습니다. 신규 카드 후보 작성이 가능합니다.'
      };
    },

    // 4. Rule-based 중복 탐지 엔진 (AI 불필요)
    checkDuplication: function(candidate, existingCards) {
      var cards = existingCards || (typeof window !== 'undefined' && window.MIND_CARDS_DATA ? window.MIND_CARDS_DATA : []);
      if (!candidate) return { isDuplicate: false, similarity: 0, closestCards: [] };

      var candTags = (candidate.routeTags || []).concat(candidate.triggerTags || []).concat(candidate.storyTags || []);
      var matches = [];

      cards.forEach(function(c) {
        var cTags = (c.routeTags || []).concat(c.triggerTags || []).concat(c.storyTags || []);
        if (cTags.length === 0 || candTags.length === 0) return;

        var common = candTags.filter(function(t) { return cTags.indexOf(t) !== -1; });
        var union = Array.from(new Set(candTags.concat(cTags)));
        var jaccard = union.length > 0 ? (common.length / union.length) : 0;

        if (jaccard > 0.3 || (candidate.question && c.question && candidate.question === c.question)) {
          matches.push({
            cardId: c.id,
            cardTitle: c.cardTitle || c.title,
            similarity: Math.round(jaccard * 100),
            matchedTags: common
          });
        }
      });

      matches.sort(function(a, b) { return b.similarity - a.similarity; });
      var highestSimilarity = matches.length > 0 ? matches[0].similarity : 0;
      var isDuplicate = highestSimilarity >= 80;

      return {
        isDuplicate: isDuplicate,
        status: isDuplicate ? 'POSSIBLE_DUPLICATE' : 'UNIQUE',
        highestSimilarity: highestSimilarity,
        closestCards: matches.slice(0, 3)
      };
    },

    // 5. 콘텐츠 언어 및 안전 QA 검사기
    validateContentQuality: function(cardData) {
      var errors = [];
      var warnings = [];

      // A. 진단어 배제 (Identity Label / Diagnosis)
      var diagRegex = /(회피형|불안형|공황장애|우울증|조울증|애정결핍|유리멘탈|나르시시스트)/i;
      if (cardData.userQuestion && diagRegex.test(cardData.userQuestion)) {
        warnings.push('질문에 진단어/정체성화 레이블이 포함되어 있습니다. 장면 언어로 변환을 권장합니다.');
      }

      // B. 운세/사주 단정 표현 금지 (Fortune Claim)
      var fortuneRegex = /(올해 운이 좋다|대운이 온다|재물운이 트인다|타고난 팔자|운명적으로)/i;
      if ((cardData.sodaInsight && fortuneRegex.test(cardData.sodaInsight)) || 
          (cardData.sodaAnswer && fortuneRegex.test(cardData.sodaAnswer))) {
        errors.push('FORTUNE_LANGUAGE_FAIL: 운세, 사주, 미래 결과 단정 표현은 사용할 수 없습니다.');
      }

      // C. 고위험 행동 차단 (10% Action 위험도 검사)
      var highStakesRegex = /(퇴사|이혼|가출|절교|전재산|소송|고소|단칼에 끊으세요)/i;
      if (cardData.tenPercentAction && highStakesRegex.test(cardData.tenPercentAction)) {
        errors.push('ACTION_TOO_HIGH_STAKES: 10% Action은 되돌릴 수 없는 고위험 결단(퇴사, 절교 등)이 아니어야 합니다.');
      }

      // D. 현실 문제 축소 및 안전 위반 (Safety Review)
      var abuseRegex = /(폭언|폭행|손찌검|물건을 던짐|때려요|스토킹)/i;
      if (cardData.scene && abuseRegex.test(cardData.scene)) {
        if (!cardData.safetyNotes || cardData.safetyNotes.indexOf('현실 안전') === -1) {
          errors.push('SAFETY_FAIL: 물리적 폭력이나 학대 상황은 일반 심리 카드로 처리할 수 없으며 Safety 프로토콜이 필수입니다.');
        }
      }

      // E. 원인 억지 추론 검사
      var causeRegex = /(어린 시절|부모의 무관심|무의식의 상처|전생)/i;
      if (cardData.sodaInsight && causeRegex.test(cardData.sodaInsight)) {
        warnings.push('근거 없는 어린 시절이나 무의식 상처로 원인을 규정하지 마세요 (도덕화/원인 단정 금지).');
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
      };
    },

    // 6. Card Candidate 관리
    getCandidates: function() {
      return this._getStorage(STORAGE_KEYS.CANDIDATES, []);
    },

    createCandidate: function(data) {
      // 순서 강제: SCENE -> QUESTION -> MECHANISM -> SODA -> SCAN -> ACTION -> TITLE
      if (!data.scene) throw new Error('Scene(장면)은 카드 후보 생성의 필수 첫 단계입니다.');
      if (!data.userQuestion) throw new Error('User Question(사용자 질문)은 필수입니다.');

      var qaResult = this.validateContentQuality(data);
      if (!qaResult.isValid) {
        throw new Error('Content QA Failed: ' + qaResult.errors.join('; '));
      }

      var dupCheck = this.checkDuplication(data);
      var candidates = this.getCandidates();

      var newCand = {
        candidateId: data.candidateId || 'CAND-' + Date.now().toString().slice(-4),
        gapId: data.gapId || null,
        proposedPackId: data.proposedPackId || 'PACK-01',
        category: data.category || '관계·심리',
        workingTitle: data.workingTitle || '가제 미정',
        scene: data.scene,
        userQuestion: data.userQuestion,
        coreMechanism: data.coreMechanism || '',
        sodaInsight: data.sodaInsight || data.sodaAnswer || '',
        scanAngle: data.scanAngle || '',
        syncAngle: data.syncAngle || '',
        shiftAngle: data.shiftAngle || '',
        tenPercentAction: data.tenPercentAction || '',
        bookGrounding: data.bookGrounding || '다크 코드',
        safetyNotes: data.safetyNotes || '',
        whyExistingCardsInsufficient: data.whyExistingCardsInsufficient || '',
        duplicationStatus: dupCheck.status,
        highestSimilarity: dupCheck.highestSimilarity,
        closestCardIds: dupCheck.closestCards.map(function(c) { return c.cardId; }),
        status: dupCheck.isDuplicate ? 'POSSIBLE_DUPLICATE' : 'DRAFT',
        createdAt: new Date().toISOString()
      };

      candidates.unshift(newCand);
      this._setStorage(STORAGE_KEYS.CANDIDATES, candidates);
      return newCand;
    },

    // 7. Expansion Batch 관리
    getBatches: function() {
      return this._getStorage(STORAGE_KEYS.BATCHES, [
        {
          batchId: 'EXPANSION-01',
          status: 'PREPARING',
          reason: '30일 런칭 관제 후 검증된 콘텐츠 결핍 반영 준비',
          targetCardCount: 15,
          cardIds: [],
          publishedAt: null,
          zeroKeyCompliant: true
        }
      ]);
    },

    // 8. 250장 체크포인트 및 일시정지 가드레일
    evaluateExpansionCheckpoint: function(currentTotalCards, regressionCount, dupRate) {
      var isPauseRequired = false;
      var pauseReasons = [];

      if (regressionCount > 0) {
        isPauseRequired = true;
        pauseReasons.push('Router Golden Set에 Regression(' + regressionCount + '건)이 감지되어 확장이 일시 중단됩니다.');
      }

      if (dupRate >= 15) {
        isPauseRequired = true;
        pauseReasons.push('중복 후보 발생률(' + dupRate + '%)이 안전 기준치를 초과하여 기존 카드 정리가 선행되어야 합니다.');
      }

      var isCheckpoint = currentTotalCards >= BATCH_CONFIG.CHECKPOINT_THRESHOLD;

      return {
        currentTotalCards: currentTotalCards,
        isCheckpoint: isCheckpoint,
        isPauseRequired: isPauseRequired,
        pauseReasons: pauseReasons,
        recommendedAction: isPauseRequired ? 'PAUSE_EXPANSION' : (isCheckpoint ? 'AUDIT_BEFORE_NEXT_BATCH' : 'CONTINUE_EXPANSION')
      };
    },

    getExternalAiCallCount: function() {
      return 0; // Strictly Zero-Key
    },

    isZeroKeyCompliant: function() {
      return true;
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyungSimContentExpansion;
  }
  global.MyungSimContentExpansion = MyungSimContentExpansion;

})(typeof window !== 'undefined' ? window : global);
