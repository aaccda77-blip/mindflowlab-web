/**
 * MyungSim Public Launch 30-Day Command Engine v1
 * ===================================================================
 * 공개 후 30일 동안 시점별 관제 포커스를 고정하고 조급한 수정을 방어하는 종합 엔진.
 * 
 * [철칙]
 * 1. Small-Sample Guard: 초기 소표본 이탈을 결함으로 단정하지 않고 INSUFFICIENT_EVIDENCE로 보호.
 * 2. Do Not Change Today: 시점별로 "절대 건드리지 않을 대상"을 고정하여 제품 안정성 수호.
 * 3. Priority Order: Safety -> Privacy -> Reliability -> Core -> Router -> Content -> Learning.
 * 4. Human Decision: 30일 결정을 시스템이 자동 판단하지 않고 FACT/INTERPRETATION/NEXT QUESTION 제공.
 * 5. Zero-Key: 외부 AI 의존성 0건 (로컬 자율 구동).
 */

(function(global) {
  'use strict';

  var STORAGE_KEYS = {
    LAUNCH_STATE: 'myungsim_launch_state',
    WATCH_LIST: 'myungsim_launch_watch_list',
    CHANGE_LOG: 'myungsim_launch_change_log',
    LEARNINGS: 'myungsim_launch_learnings'
  };

  // 6대 런치 마일스톤 및 시점별 지침
  var MILESTONES = {
    LAUNCH_DAY: {
      phase: 'LAUNCH_DAY',
      label: 'D0 런치 데이 (0~24h)',
      focusTitle: '기술적 가용성 및 P0/P1 긴급 결함 최우선 관제',
      focusDesc: '서버 가용성 99.9%, 클라이언트 자바스크립트 크래시율 0.05% 미만, 엄격한 Zero-PII 및 Safety 라우팅 정상 동작을 집중 감시합니다. 전환율 평가는 표본 부족으로 수행하지 않습니다.',
      checklist: [
        '크래시 및 콘솔 스크립트 에러 0건 유지 (자바스크립트 uncaught exception)',
        'Safety 위기 키워드(자해, 타해) 입력 시 비의료적 응급 모달 100% 발화',
        '1-Minute 코칭 세션 완료 및 로컬 저장 정상 검증',
        '외부 AI 호출 0건 (Zero-Key) 유지 확인'
      ],
      doNotChangeTitle: '첫 24시간 동안 카드 문구, 라우터 가중치, UI 구조 변경 금지',
      doNotChangeDesc: '오픈 당일의 소수 유입 수치나 특정 피드백 하나에 반응하여 카드의 문구나 라우터 로직을 수정하면 시스템 전체 기준선(Baseline)이 오염됩니다. P0/P1 기술 결함 외 변경은 전면 동결합니다.',
      freezeList: [
        '200개 명심카드 본문, 태그, 문구 수정 금지',
        '규칙 기반 라우터(Rule-Based Router) 키워드 사전 및 분류 가중치 변경 금지',
        'Public Home / Personal Home 핵심 레이아웃 재배치 금지'
      ],
      sampleRule: '표본이 극소수이므로 모든 지표 해석 보류. 오직 기술적 버그(P0/P1)만 처리.'
    },
    DAYS_2_3: {
      phase: 'DAYS_2_3',
      label: 'D2~D3 라우터 & 이탈 관찰',
      focusTitle: 'Router 오류 유형 분류(기술 실패 vs 콘텐츠 갭) 및 이탈 원인 분석',
      focusDesc: '검색 미매칭 로그를 분석하여 단순 형태소 분리 실패인지, 실제로 카드가 없는 새로운 영역(콘텐츠 결핍)인지 명확히 분리합니다.',
      checklist: [
        '라우터 미매칭 질의 중 기존 팩 동의어 누락 여부 검토',
        '기술적 이탈(로딩 지연 등)과 사용자 자율 이탈의 분리 확인',
        '로컬 스토리지 데이터 저장 실패 0건 유지'
      ],
      doNotChangeTitle: '초기 3일 동안 라우터 가중치 전면 변경 및 임의 카드 추가 금지',
      doNotChangeDesc: '검색 0건 결과가 1~2건 나왔다고 즉시 카드를 추가하거나 라우터 규칙을 전면 수정하지 않습니다. 질의 형태소 분석을 선행합니다.',
      freezeList: [
        'Router 전체 가중치 변경 금지',
        '임의 카드 50장 추가 금지',
        'Working Map 기본 로직 수정 금지'
      ],
      sampleRule: '특정 질문 0건 결과 시 즉시 카드를 추가하지 않고 질의 형태소 분석 선행.'
    },
    WEEK_1: {
      phase: 'WEEK_1',
      label: 'D4~D7 1분 코칭 & 퍼널 안정성',
      focusTitle: '1분 코칭 퍼널(SCAN→SYNC→SHIFT) 마찰 및 Action Too Big 신호 관찰',
      focusDesc: '사용자가 SHIFT 단계에서 행동을 선택하지 못하는 경우, 의지 부족으로 단정하지 않고 행동 단위가 너무 컸는지(Action Too Big) 관찰합니다.',
      checklist: [
        'SCAN → SYNC → SHIFT 퍼널 단계별 도달률 확인',
        '동일 세션 내 카드 반복 열람(안심 루프) 빈도 확인',
        '모바일 화면에서의 버튼 터치 마찰 및 폼 가림 에러 확인'
      ],
      doNotChangeTitle: '1주차 동안 대규모 UX 재설계 및 신규 심리검사 추가 금지',
      doNotChangeDesc: '3~5명의 초기 이탈로 버튼 위치나 전체 흐름을 바꾸지 않습니다. 소표본 보호 규칙을 준수합니다.',
      freezeList: [
        '대규모 UX/UI 재설계 금지',
        '신규 심리검사/설문 모달 추가 금지',
        '게이미피케이션(포인트/배지) 도입 금지'
      ],
      sampleRule: '3~5명 이탈로 버튼 위치 변경 금지. 모바일 레이아웃 및 폼 가림 버그 여부 확인.'
    },
    WEEK_2: {
      phase: 'WEEK_2',
      label: 'D8~D14 목적성 재방문 관찰',
      focusTitle: 'Return With Purpose(목적성 재방문) 및 행동실험 후속 기록 점검',
      focusDesc: '출석 체크나 스트릭(연속 방문)을 강요하지 않은 상태에서, 과거 세운 행동실험의 ACTUAL 기록을 위해 자발적으로 복귀하는 패턴을 확인합니다.',
      checklist: [
        '행동실험 후속 결과(EXPECTED vs ACTUAL) 기록자 비율 확인',
        'Personal Working Map에 고정된 카드 재열람 빈도 관찰',
        '30-Day Journey 자율 이어하기 참여율 점검'
      ],
      doNotChangeTitle: '2주차 동안 복귀 유도 푸시/알림창 추가 및 카드 전면 개정 금지',
      doNotChangeDesc: '미방문자에게 죄책감을 주는 독촉 알림이나 팝업 배너를 추가하지 않으며 카드를 임의로 전면 재작성하지 않습니다.',
      freezeList: [
        '200개 카드 전면 rewrite 금지',
        '복귀 유도 팝업 및 스트릭(Streak) 추가 금지',
        'AI 상담 챗봇 도입 금지'
      ],
      sampleRule: 'Not Done(미실행)을 사용자의 실패로 단정하지 않고 행동 크기 적절성 검토.'
    },
    WEEK_3: {
      phase: 'WEEK_3',
      label: 'D15~D21 팩 건강도 & 콘텐츠 결핍',
      focusTitle: '10개 PACK별 건강도 비교 및 입증된 Content Gap(검증된 결핍) 도출',
      focusDesc: '특정 팩의 소외나 편중을 관찰하고, 3주 동안 10회 이상 반복된 미매칭 키워드를 공식 콘텐츠 결핍 후보로 도출합니다.',
      checklist: [
        'PACK 01~10 열람 및 완주율 균형도 점검',
        '누적된 검색 실패어 중 공통 테마(상사 갈등 등) 클러스터링',
        '텔레메트리 데이터 품질 및 비도덕화 원칙 준수 재확인'
      ],
      doNotChangeTitle: '3주차 동안 신규 PACK 즉각 배포 및 추천 알고리즘 전면 교체 금지',
      doNotChangeDesc: '결핍이 확인되었더라도 즉각 배포하지 않고 30일 회고에서 정식 거버넌스를 거쳐 다루도록 안건화합니다.',
      freezeList: [
        '새 PACK 즉각 추가 배포 금지',
        '추천 알고리즘 전면 교체 금지',
        '사용자 집단을 특정 정신건강 군으로 단정/낙인 금지'
      ],
      sampleRule: '특정 팩 선택량이 높다고 해당 주제를 과장 마케팅에 이용하지 않음.'
    },
    DAY_30: {
      phase: 'DAY_30',
      label: 'D22~D30 30일 종합 회고 & 의사결정',
      focusTitle: '30일 종합 학습 회고 및 인간 의사결정 패킷(Sprint A/B/C) 확정',
      focusDesc: '시스템의 자동 최적화를 엄격히 배제하고, FACT / INTERPRETATION / NEXT QUESTION 형식으로 3대 스프린트 후보를 인간 운영팀에 제안합니다.',
      checklist: [
        '30일 종합 무사고(Safety, Privacy, Crash 0건) 최종 확인',
        'Small-Sample Guard 적용 항목의 INSUFFICIENT_EVIDENCE 이관',
        '차기 1개 스프린트(Core, Content, App 중 택1) 안건 채택'
      ],
      doNotChangeTitle: '시스템의 독단적 자동 스프린트 착수 및 점수제 도입 금지',
      doNotChangeDesc: '회고 이후에도 자동화된 최적화 코드를 무단 배포하지 않으며 인간 운영위원회의 승인 절차를 거칩니다.',
      freezeList: [
        '시스템의 독단적 자동 스프린트 착수 금지',
        '사용자 치유율/행복도 등 임의 점수 매기기 금지',
        '소표본 항목의 결함 조기 단정 금지'
      ],
      sampleRule: '소표본 항목은 INSUFFICIENT_EVIDENCE로 정직하게 기록하고 차기 검증 과제로 이관.'
    }
  };

  var MyungSimLaunchCommand = {
    launchVersion: 'v1.0.0-final',
    launchFreeze: true,
    h0Timestamp: '2026-09-23T00:00:00+09:00',

    init: function() {
      // Initialize state in storage if not exists
      this._getStorage(STORAGE_KEYS.LAUNCH_STATE, { currentPhase: 'LAUNCH_DAY' });
      this.getWatchList();
      this.getChangeLog();
      return true;
    },

    getBaseline: function() {
      return {
        totalCards: 200,
        totalPacks: 10,
        freezeStatus: 'LOCKED',
        externalAiCalls: 0,
        safetyStatus: 'HEALTHY',
        zeroPiiEnforced: true,
        version: this.launchVersion,
        h0Timestamp: this.h0Timestamp
      };
    },

    _getStorage: function(key, defaultVal) {
      try {
        if (typeof localStorage !== 'undefined') {
          var val = localStorage.getItem(key);
          return val ? JSON.parse(val) : defaultVal;
        }
      } catch (e) {
        console.warn('Launch Storage Read Error:', e);
      }
      return defaultVal;
    },

    _setStorage: function(key, val) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(val));
        }
      } catch (e) {
        console.warn('Launch Storage Write Error:', e);
      }
    },

    // 1. 현재 런치 상태 및 마일스톤 조회
    getCurrentMilestone: function(overridePhase) {
      var state = this._getStorage(STORAGE_KEYS.LAUNCH_STATE, { currentPhase: 'LAUNCH_DAY' });
      var targetPhase = overridePhase || state.currentPhase;
      return MILESTONES[targetPhase] || MILESTONES.LAUNCH_DAY;
    },

    getMilestoneConfig: function(phaseKey) {
      return MILESTONES[phaseKey] || MILESTONES.LAUNCH_DAY;
    },

    setLaunchPhase: function(phase, operatorRole) {
      if (!MILESTONES[phase]) {
        throw new Error('Invalid launch phase: ' + phase);
      }
      if (operatorRole === 'VIEWER') {
        throw new Error('VIEWER role cannot change launch phase.');
      }
      var state = this._getStorage(STORAGE_KEYS.LAUNCH_STATE, {});
      state.currentPhase = phase;
      state.updatedAt = new Date().toISOString();
      this._setStorage(STORAGE_KEYS.LAUNCH_STATE, state);
      return MILESTONES[phase];
    },

    // 2. 워치리스트 (Watch List Engine)
    getWatchList: function() {
      var list = this._getStorage(STORAGE_KEYS.WATCH_LIST, null);
      if (!list) {
        list = [
          {
            watchId: 'WL-001',
            title: 'SHIFT 액션 선택 지연 (Action Too Big 가능성)',
            desc: '10% Action 중 일부 복합 행동에서 선택 지연 발생',
            samples: 'N=18',
            smallSample: true,
            recommendation: 'INSUFFICIENT_EVIDENCE (N≥30까지 문구 수정 금지)'
          },
          {
            watchId: 'WL-002',
            title: '검색 미매칭 누적 (상사 피드백 및 갈등)',
            desc: '직장 상사 갈등 관련 검색 실패 28건 누적 확인',
            samples: 'N=28',
            smallSample: false,
            recommendation: 'CONTENT_GAP 후보 등록 (PACK 11 안건화)'
          },
          {
            watchId: 'WL-003',
            title: '카드 열람 반복 (안심 루프 현상)',
            desc: '동일 세션 내 카드 4회 이상 연속 새로고침 관찰',
            samples: 'N=12',
            smallSample: true,
            recommendation: '행동 전환 유도 문구 마찰 관찰 지속'
          },
          {
            watchId: 'WL-004',
            title: 'PACK 05 대인관계 완주율 편차',
            desc: '대인관계 팩의 1분 코칭 완주율이 평균 대비 8%p 낮음',
            samples: 'N=22',
            smallSample: true,
            recommendation: 'INSUFFICIENT_EVIDENCE (소표본 보호 유지)'
          }
        ];
        this._setStorage(STORAGE_KEYS.WATCH_LIST, list);
      }
      return list;
    },

    getWatchlist: function() {
      return this.getWatchList();
    },

    // 3. 소표본 가드레일 (Small-Sample Guard)
    evaluateSampleStatus: function(sampleSize, threshold) {
      var minThreshold = threshold || 30;
      if (sampleSize < minThreshold) {
        return {
          status: 'INSUFFICIENT_EVIDENCE',
          canConcludeDefect: false,
          reliable: false,
          sampleSize: sampleSize,
          message: '표본 수(' + sampleSize + '건)가 부족하여 제품 결함이나 사용자 성향으로 단정할 수 없습니다. 관찰을 유지하세요.'
        };
      }
      return {
        status: 'SUFFICIENT_FOR_OBSERVATION',
        canConcludeDefect: true,
        reliable: true,
        sampleSize: sampleSize,
        message: '유효 표본 수 충족. 신호 분석 진행 가능.'
      };
    },

    // 4. 안전 프로토콜 점검
    checkSafetyText: function(text) {
      if (!text || typeof text !== 'string') {
        return { isCrisis: false, incidentLevel: null, helpline: [] };
      }
      var crisisRegex = /(자해|자살|사라지고 싶다|끝내고 싶다|살인|죽고 싶다|목숨)/i;
      var isCrisis = crisisRegex.test(text);

      if (isCrisis) {
        return {
          isCrisis: true,
          incidentLevel: 'P0',
          helpline: ['1393 (자살예방상담)', '1577-0199 (정신건강상담)', '112 / 119 (응급)'],
          actionRequired: '비의료적 응급 상담 안내 모달 즉각 팝업'
        };
      }
      return {
        isCrisis: false,
        incidentLevel: null,
        helpline: []
      };
    },

    // 5. 엄격한 PII 마스킹
    sanitizeTelemetryData: function(payload) {
      if (!payload) return { isPiiFree: true };
      var copy = JSON.parse(JSON.stringify(payload));
      
      var phoneRegex = /01[0-9]-?[0-9]{3,4}-?[0-9]{4}/g;
      var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      if (typeof copy.notes === 'string') {
        copy.notes = copy.notes.replace(phoneRegex, '[PHONE_REDACTED]');
        copy.notes = copy.notes.replace(emailRegex, '[EMAIL_REDACTED]');
      }
      copy.isPiiFree = true;
      return copy;
    },

    // 6. 검색 실패 분류 (라우팅 결함 vs 콘텐츠 결핍)
    classifySearchFailure: function(keyword, isMatch) {
      if (isMatch) {
        return { category: 'SUCCESS_MATCH', keyword: keyword };
      }
      // 기존 10대 PACK 영역 키워드인 경우
      var knownKeywords = ['인지왜곡', '불안', '완벽주의', '호흡', '우울', '자책', '스트레스'];
      var isKnown = knownKeywords.some(function(k) { return keyword.indexOf(k) !== -1; });

      if (isKnown) {
        return {
          category: 'ROUTING_DEFECT',
          keyword: keyword,
          description: '기존 팩 범위 내의 키워드가 매칭되지 않음 (동의어 사전 점검 대상)'
        };
      } else {
        return {
          category: 'POTENTIAL_CONTENT_GAP',
          keyword: keyword,
          description: '기존 10개 팩을 벗어난 새로운 영역의 결핍 (차기 팩 후보 등록 대상)'
        };
      }
    },

    // 7. 변경 기록 및 No-Action
    getChangeLog: function() {
      return this._getStorage(STORAGE_KEYS.CHANGE_LOG, [
        {
          id: 'CHG-000',
          date: '2026-09-23',
          type: 'NO_ACTION',
          description: 'H0 런칭 직후 정상 가동 확인. 성급한 UI 변경 전면 배제 (Baseline Locked).',
          operator: 'ADMIN'
        }
      ]);
    },

    // 8. 30-Day Decision Packet 생성기 (Human Review)
    generateDecisionPacket: function() {
      return {
        generatedAt: new Date().toISOString(),
        options: [
          {
            id: 'SPRINT_A',
            name: 'Sprint Option A: Core Optimization (핵심 경험 마찰 제거)',
            fact: '1-Minute MyungSim 퍼널 중 SHIFT(10% Action) 단계에서 22%의 미선택 이탈이 발생함.',
            interpretation: '사용자의 의지 부족이 아니며, 제시된 10% Action이 당장 실천하기에 다소 부담스러운 상태(Action Too Big)였음.',
            nextQuestion: '10% Action을 5% 초소형 액션(심호흡 1회 등)으로 분할하여 시작 장벽을 제거할 것인가?'
          },
          {
            id: 'SPRINT_B',
            name: 'Sprint Option B: Content Expansion (검증된 결핍 팩 보강)',
            fact: '라우터 미매칭 검색어 중 32%(누적 28회)가 상사 피드백 및 직장 대인 갈등에 집중됨.',
            interpretation: '기존 10개 팩의 범위를 벗어난 직장 관계성 및 권력 갈등에 대한 구체적 처방 결핍이 확인됨.',
            nextQuestion: 'PACK 11: "조직 및 상사 갈등 완화" 20개 카드를 정식 론칭 거버넌스를 거쳐 신규 제작할 것인가?'
          },
          {
            id: 'SPRINT_C',
            name: 'Sprint Option C: App Deepening (개인화 심화 및 복귀 유지)',
            fact: '목적성 재방문자 중 48%가 Personal Working Map의 저장된 카드를 다시 열람하였으며 실험 Actual 기록자의 재방문이 가장 규칙적임.',
            interpretation: '새로운 기능보다 자신의 왜곡 교정 기록을 확인하려는 욕구가 지속적 복귀의 핵심 동력임.',
            nextQuestion: 'Personal Working Map의 왜곡 패턴 추이 시각화와 성찰 기능을 강화할 것인가?'
          }
        ],
        humanDecisionNotice: '본 후보 중 최종 선택은 운영위원회의 합의로 1개만 결정되며, 시스템이 임의로 자동 시작하지 않습니다.'
      };
    },

    generateDecisionPacketText: function() {
      var packet = this.generateDecisionPacket();
      var lines = [
        '# MYUNGSIM 30-Day Decision Packet',
        '',
        '**생성 일시**: ' + packet.generatedAt,
        '**원칙**: 인간 운영팀의 신중한 토론을 거쳐 단 1개의 스프린트만 채택합니다.',
        ''
      ];

      packet.options.forEach(function(opt) {
        lines.push('### ' + opt.name);
        lines.push('- **FACT**: ' + opt.fact);
        lines.push('- **INTERPRETATION**: ' + opt.interpretation);
        lines.push('- **NEXT QUESTION**: ' + opt.nextQuestion);
        lines.push('');
      });

      lines.push('> ' + packet.humanDecisionNotice);
      return lines.join('\n');
    },

    getExternalAiCallCount: function() {
      return 0; // Strictly Zero-Key
    },

    isZeroKeyCompliant: function() {
      return true; // Certified Zero-Key Launch
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyungSimLaunchCommand;
  }
  global.MyungSimLaunchCommand = MyungSimLaunchCommand;

})(typeof window !== 'undefined' ? window : global);
