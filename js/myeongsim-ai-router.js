/**
 * =================================================================
 * MYUNGSIM NO-AI PRODUCTION CORE ROUTER v1
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * High-performance, Zero-API, Privacy-safe Rule-Based Card Router
 * Architecture: RouterInterface -> RuleBasedRouter (Default) / SemanticRouter / HybridRouter
 * =================================================================
 */

(function(window) {
  'use strict';

  // 0. Configuration
  const ROUTER_CONFIG = {
    ROUTER_MODE: 'rule', // 'rule' (Default) | 'semantic' | 'hybrid'
    MAX_RECOMMENDATIONS: 3,
    MIN_SCORE_THRESHOLD: 2.0,
    FALLBACK_THRESHOLD: 1.0,
    ZERO_RAW_QUERY_LOG: true,
    DEBUG_MODE: false
  };

  // 1. Safety Router 사전 및 패턴 (최우선 검사)
  // 1-1. 긴급 고위험 (자해, 자살, 타해, 신체 폭력, 스토킹, 성폭력)
  const HIGH_RISK_PATTERNS = [
    /(?:자해|자살|목숨을?\s*끊|유서\s*쓰|스스로\s*세상을?)/i,
    /(?:죽고\s*싶|살기\s*싫|죽을\s*래|죽는\s*게\s*낫|사라지고\s*싶어?)/i,
    /(?:칼로|목을?\s*매|투신|뛰어내리|다량\s*복용|약을?\s*모아)/i,
    /(?:폭행|맞았|때렸|가정폭력|학대|감금|스토킹|성폭행|성추행|강간|성폭력|협박받)/i,
    /(?:누구를?\s*죽이고|해치고\s*싶|칼부림|살해)/i
  ];

  // Near-miss 구어체 과잉 반응 방지 예외 패턴 ("일 때문에 죽을 것 같아요", "배고파 죽겠네" 등)
  const IDIOMATIC_EXPRESSIONS = [
    /(?:힘들어|피곤해|귀찮아|웃겨|배고파|바빠|더워|추워|답답해|숨막혀)\s*죽겠/i,
    /일\s*(?:때문에|많아서)\s*죽을\s*것\s*같/i,
    /죽도록\s*(?:일|공부|노력|사랑)/i
  ];

  // 1-2. 고위험 재무/투자 (전재산, 빚보증, 영끌 투기)
  const FINANCIAL_HIGH_STAKES_PATTERNS = [
    /(?:전재산|전\s*재산)\s*(?:투자|몰빵|넣|배팅)/i,
    /(?:빚|대출|사채)\s*(?:내서|끌어모아|영끌해서)\s*(?:투자|코인|주식)/i,
    /(?:보증\s*서|빚보증)/i,
    /(?:파산|개인회생|압류)/i
  ];

  // 1-3. 고위험 의료/전문법률
  const PROFESSIONAL_ADVICE_PATTERNS = [
    /(?:정신과\s*약|우울증약|수면제|약물\s*중단|약물\s*과다|진단서|처방)/i,
    /(?:이혼소송|고소장|형사소송|변호사\s*선임|합의금)/i
  ];

  // 1-4. 단순 운세/예언 질의
  const FORTUNE_QUERY_PATTERNS = [
    /(?:대운\s*(?:언제|오나|있나)|올해\s*(?:운|재수|운세)|결혼운|재물운)/i,
    /(?:삼재\s*(?:언제|끝나|풀이)|사주\s*봐|점\s*쳐|신점|타로\s*봐|미래\s*알려)/i
  ];

  // 2. 한국어 Normalizer 불용어 및 조사 목록
  const STOP_WORDS = new Set([
    '나', '저', '내', '제', '이', '그', '저', '것', '수', '등', '들',
    '진짜', '너무', '정말', '자꾸', '계속', '좀', '왜', '어떻게', '때문에',
    '같아요', '싶어요', '돼요', '해요', '하는', '있는', '있는데', '하는데',
    '것만', '같아', '하고', '해서', '해서요', '거예요', '인가요', '걸까요',
    '있을까', '있을까요', '되나요', '되죠', '어쩌죠', '어쩌면', '마음이'
  ]);

  const KOREAN_JOSA_REGEX = /(?:에서는|에게는|으로는|에서는|에서|에게|으로|까지|부터|마저|조차|처럼|하고|이랑|이나|이라|으로|로|은|는|이|가|을|를|에|의|와|과|랑|도|만)$/;

  // 공통 구어체/오타 교정 사전
  const COMMON_TYPO_MAP = {
    '못하겟': '못하겠',
    '안와': '안 와',
    '안되': '안 돼',
    '확인해여': '확인해요',
    '망함': '망했',
    '망햇': '망했',
    '폰만봐': '폰만 봐',
    '폰보': '폰 보',
    '톡안': '카톡 안'
  };

  // 3. 인메모리 기본 동의어 및 테마 매핑 사전 (Synonym Dictionary)
  const DEFAULT_SYNONYMS = {
    "읽씹": ["답장 없음", "읽고 답 없음", "안 읽음", "연락 두절", "대화 중단", "답장 안 옴"],
    "손절": ["관계 끝내기", "거리두기", "연락 끊기", "절교", "인연 정리", "손절하기"],
    "눈치": ["상대 반응 확인", "표정 읽기", "기분 관리", "비위 맞추기", "평가 불안", "눈치보기"],
    "유리멘탈": ["상처", "흔들림", "자책", "감정 회복", "마음 약함", "쿠쿠다스", "멘탈 붕괴"],
    "작심삼일": ["습관 중단", "계획 포기", "다시 시작", "의지박약", "미루기", "시작 공포"],
    "삼재": ["운세", "불운", "미래 불안", "사주", "운명", "팔자", "대운", "점", "미신"],
    "카톡": ["연락", "메시지", "문자", "전화", "톡", "카카오톡", "dm", "알림"],
    "답장": ["연락", "메시지", "회신", "답변", "카톡", "문자", "전화"],
    "퇴사": ["이직", "그만두기", "퇴직", "사표", "회사 탈출", "번아웃", "사직"],
    "엄마": ["부모", "어머니", "가족", "부모님", "원가족", "가정"],
    "아빠": ["부모", "아버지", "가족", "부모님", "원가족", "가정"],
    "부모": ["엄마", "아빠", "부모님", "어머니", "아버지", "가족"],
    "남편": ["배우자", "결혼", "부부", "가족", "연인"],
    "아내": ["배우자", "결혼", "부부", "가족", "연인", "와이프"],
    "남친": ["남자친구", "연인", "애인", "데이트", "연애"],
    "여친": ["여자친구", "연인", "애인", "데이트", "연애"],
    "팀장": ["상사", "부장", "대표", "임원", "회사", "직장", "사수"],
    "사업": ["창업", "매출", "가게", "회사 운영", "장사", "비즈니스"],
    "실패": ["망함", "좌절", "실수", "끝장", "낙담"],
    "질투": ["비교", "부러움", "열등감", "초라함", "시기심"],
    "칭찬": ["인정", "평가", "칭찬 불안", "가면 증후군", "가짜"],
    "인스타": ["sns", "소셜미디어", "염탐", "프로필", "피드", "스토리"],
    "자책": ["자기비하", "내 탓", "자괴감", "스스로 미움", "후회", "부끄러움"],
    "빚": ["대출", "통장", "잔고", "적자", "파산", "돈 문제", "경제적 압박"],
    "미루기": ["회피", "게으름", "시작 지연", "딴짓", "결정 보류"],
    "다크코드": ["반복 패턴", "자동반응", "트리거", "동일시", "무의식 습관"],
    "뉴럴코드": ["10% 행동", "작은 실험", "신체 훈련", "신경계 리셋"],
    "제로포인트": ["영점", "선택의 공간", "거리두기", "중립 관찰", "마음의 중심"]
  };

  // 4. 한국어 Normalizer 엔진
  class KoreanNormalizer {
    static normalize(text) {
      if (!text || typeof text !== 'string') return '';
      let clean = text.trim().toLowerCase();

      // 1) 자모 반복(ㅋㅋㅋㅋ, ㅠㅠㅠ, ㅎㅎㅎ) 완화
      clean = clean.replace(/[ㅋㅎㅠㅜ]{2,}/g, '');

      // 2) 흔한 오타 및 축약어 치환
      for (const [typo, fixed] of Object.entries(COMMON_TYPO_MAP)) {
        clean = clean.split(typo).join(fixed);
      }

      // 3) 문장부호 정리 (공백으로 치환)
      clean = clean.replace(/[!?,.~@#$%^&*()_+=\-[\]{};:'"<>/\\|]/g, ' ');

      // 4) 다중 공백 단일화
      clean = clean.replace(/\s+/g, ' ').trim();

      return clean;
    }

    static extractTokens(normalizedText) {
      if (!normalizedText) return [];
      const words = normalizedText.split(' ').filter(w => w.length > 0);
      const tokens = new Set();

      for (let word of words) {
        // 기본 어절 추가
        if (word.length >= 2 && !STOP_WORDS.has(word)) {
          tokens.add(word);
        }

        // 조사 제거 토큰 추가
        if (word.length >= 3) {
          const stripped = word.replace(KOREAN_JOSA_REGEX, '');
          if (stripped.length >= 2 && !STOP_WORDS.has(stripped)) {
            tokens.add(stripped);
          }
        }
      }

      // 동의어 사전 확장
      const currentTokens = Array.from(tokens);
      for (const t of currentTokens) {
        for (const [key, list] of Object.entries(DEFAULT_SYNONYMS)) {
          if (t === key || t.includes(key) || key.includes(t)) {
            tokens.add(key);
            list.forEach(item => {
              item.split(' ').forEach(sub => {
                if (sub.length >= 2 && !STOP_WORDS.has(sub)) tokens.add(sub);
              });
            });
          }
        }
      }

      return Array.from(tokens);
    }

    static detectContexts(tokens, rawQuery) {
      const q = rawQuery.toLowerCase();
      const detected = new Set();

      if (/엄마|아빠|부모|가족|형제|자매|효도|친정|시댁/.test(q)) detected.add('family');
      if (/회사|직장|팀장|상사|부장|출근|퇴근|퇴사|이직|업무|회의|성과|보고/.test(q)) detected.add('career');
      if (/남친|여친|남자친구|여자친구|애인|연인|연애|이별|데이트|결혼|남편|아내/.test(q)) detected.add('love');
      if (/돈|빚|대출|통장|사업|망했|투자|월급|적자|경제/.test(q)) detected.add('money');
      if (/사주|삼재|대운|운명|팔자|점|타로|운세|신점|미래/.test(q)) detected.add('fortune');
      if (/완벽|비교|인정|칭찬|뒤처|초라|열등|질투/.test(q)) detected.add('perfection');
      if (/자책|자기비하|내 탓|후회|부끄|실수|유리멘탈/.test(q)) detected.add('self_compassion');
      if (/미루|결정|시작|작심삼일|습관|딴짓/.test(q)) detected.add('decision');

      return Array.from(detected);
    }
  }

  // 5. RouterInterface (추상 인터페이스 규격)
  class RouterInterface {
    route(query, options) {
      throw new Error("RouterInterface.route() must be implemented.");
    }
    scoreCard(card, tokens, contexts, rawQuery) {
      throw new Error("RouterInterface.scoreCard() must be implemented.");
    }
  }

  // 6. RuleBasedRouter (100% NO-AI 핵심 구현체)
  class RuleBasedRouter extends RouterInterface {
    constructor(cards) {
      super();
      this.cards = Array.isArray(cards) ? cards : [];
      this.sessionBrowseCount = 0;
    }

    setCards(cards) {
      if (Array.isArray(cards)) {
        this.cards = cards;
      }
    }

    /**
     * 1단계: Safety Router (카드 검색보다 먼저 실행)
     */
    checkSafety(rawQuery) {
      if (!rawQuery || typeof rawQuery !== 'string') {
        return { isSafe: true };
      }
      const text = rawQuery.trim();

      // Idiomatic check (과잉 반응 방지)
      let isIdiomatic = false;
      for (const pattern of IDIOMATIC_EXPRESSIONS) {
        if (pattern.test(text)) {
          isIdiomatic = true;
          break;
        }
      }

      // 1. 고위험 긴급 위기 감지
      if (!isIdiomatic) {
        for (const pattern of HIGH_RISK_PATTERNS) {
          if (pattern.test(text)) {
            return {
              isSafe: false,
              isHighRisk: true,
              routeType: 'crisis_emergency',
              title: "지금 많이 버겁고 위험한 순간에 계신가요?",
              message: "혼자 감당하기 어려운 고통이나 긴급한 위험 속에서는 명심카드보다 24시간 언제든 도움을 받을 수 있는 전문가와 먼저 연결되는 것이 가장 안전합니다.",
              contacts: [
                { name: "자살예방 상담전화", tel: "109", note: "24시간 무료 전문상담" },
                { name: "정신건강 위기상담전화", tel: "1577-0199", note: "24시간 정신건강 상담" },
                { name: "경찰청 긴급신고", tel: "112", note: "신변 위협 및 긴급 구조" },
                { name: "여성긴급전화", tel: "1366", note: "가정폭력·스토킹·성폭력 24시간" }
              ]
            };
          }
        }
      }

      // 2. 고위험 재정/투자 질의 감지
      for (const pattern of FINANCIAL_HIGH_STAKES_PATTERNS) {
        if (pattern.test(text)) {
          return {
            isSafe: true,
            isFinancialHighStakes: true,
            routeType: 'financial_high_stakes',
            notice: "전재산 투자나 큰 대출, 보증과 같은 중대한 재정적 결정은 심리적 확신이나 운세가 아닌 객관적 재무 위험과 현실적 감당 능력을 기준으로 신중히 검토하셔야 합니다."
          };
        }
      }

      // 3. 전문 의료/법률 질의 감지
      for (const pattern of PROFESSIONAL_ADVICE_PATTERNS) {
        if (pattern.test(text)) {
          return {
            isSafe: true,
            needsProfessional: true,
            routeType: 'professional_stakes',
            notice: "약물 조절이나 법적 소송과 같은 전문적 문제는 반드시 공인된 전문 의료진이나 법률 전문가의 직접적인 자문을 받으시기 바랍니다."
          };
        }
      }

      // 4. 운세/예언 질의
      for (const pattern of FORTUNE_QUERY_PATTERNS) {
        if (pattern.test(text)) {
          return {
            isSafe: true,
            isFortuneQuery: true,
            routeType: 'fortune_inquiry',
            fortuneNotice: "명심코칭은 미래의 운세를 점치거나 판정하지 않습니다. 대신 그 질문이 지금 왜 중요해졌는지 내면의 불안과 선택권을 함께 살펴봅니다."
          };
        }
      }

      return { isSafe: true, routeType: 'standard_coaching' };
    }

    /**
     * 2단계: 개별 카드 스코어링 공식
     */
    scoreCard(card, tokens, contexts, rawQuery) {
      let kwScore = 0;
      let tagScore = 0;
      let contextScore = 0;
      let penalty = 0;

      const title = (card.cardTitle || '').toLowerCase();
      const question = (card.question || '').toLowerCase();
      const keyword = (card.keyword || '').toLowerCase();
      const category = (card.category || '').toLowerCase();
      const soda = (card.sodaAnswer || '').toLowerCase();

      const searchKeywords = (card.searchKeywords || []).map(k => String(k).toLowerCase());
      const routeTags = (card.routeTags || []).map(t => String(t).toLowerCase());
      const triggerTags = (card.triggerTags || []).map(t => String(t).toLowerCase());
      const storyTags = (card.storyTags || []).map(t => String(t).toLowerCase());
      const urgeTags = (card.urgeTags || []).map(t => String(t).toLowerCase());
      const actionTags = (card.actionTags || []).map(t => String(t).toLowerCase());
      const cardContexts = (card.contextTags || []).map(c => String(c).toLowerCase());
      const negativeTags = (card.negativeTags || []).map(n => String(n).toLowerCase());

      const fullCardText = `${title} ${question} ${keyword} ${category} ${soda} ${searchKeywords.join(' ')}`;

      // 1. Exact phrase match (+8.0)
      if (rawQuery.length >= 3 && fullCardText.includes(rawQuery.toLowerCase())) {
        kwScore += 8.0;
      }

      // 2. Token Matching
      for (const token of tokens) {
        const t = token.toLowerCase();

        // Title keyword match (+3.0)
        if (title.includes(t)) kwScore += 3.0;

        // Question lexical match (+2.0)
        if (question.includes(t)) kwScore += 2.0;

        // Keyword match (+3.5)
        if (keyword.includes(t)) kwScore += 3.5;

        // searchKeyword match (+5.0)
        if (searchKeywords.some(sk => sk.includes(t) || t.includes(sk))) tagScore += 5.0;

        // triggerTag match (+4.0)
        if (triggerTags.some(tt => tt.includes(t) || t.includes(tt))) tagScore += 4.0;

        // storyTag match (+4.0)
        if (storyTags.some(st => st.includes(t) || t.includes(st))) tagScore += 4.0;

        // urgeTag match (+4.0)
        if (urgeTags.some(ut => ut.includes(t) || t.includes(ut))) tagScore += 4.0;

        // actionTag match (+3.0)
        if (actionTags.some(at => at.includes(t) || t.includes(at))) tagScore += 3.0;

        // routeTag match (+2.0)
        if (routeTags.some(rt => rt.includes(t) || t.includes(rt))) tagScore += 2.0;

        // Category intent match (+3.0)
        if (category.includes(t)) tagScore += 3.0;
      }

      // 3. Context Tag Matching (+5.0 per match)
      for (const ctx of contexts) {
        if (cardContexts.includes(ctx)) {
          contextScore += 5.0;
        }
      }

      // 4. Negative Penalty (-6.0 ~ -10.0)
      // 예: 사용자가 가족 맥락인데 카드가 romantic_only 이면 감점
      if (contexts.includes('family') && negativeTags.includes('romantic_only')) {
        penalty += 8.0;
      }
      if (contexts.includes('love') && negativeTags.includes('family_only')) {
        penalty += 8.0;
      }
      if (contexts.includes('career') && negativeTags.includes('romantic_breakup')) {
        penalty += 6.0;
      }

      // 5. Featured & Popularity 보너스 (미세 가중치, relevancy를 절대 뒤흔들지 않음)
      let featureBonus = 0;
      if (card.isFeatured || card.featured) featureBonus += 0.2;
      if (card.popularity && card.popularity >= 80) featureBonus += 0.1;

      const finalScore = Math.max(0, kwScore + tagScore + contextScore + featureBonus - penalty);

      return {
        card,
        kwScore: parseFloat(kwScore.toFixed(1)),
        tagScore: parseFloat(tagScore.toFixed(1)),
        contextScore: parseFloat(contextScore.toFixed(1)),
        penalty: parseFloat(penalty.toFixed(1)),
        finalScore: parseFloat(finalScore.toFixed(2))
      };
    }

    /**
     * 3단계: 사전 작성된 matchReasons 기반의 안전한 WHY 생성 (No AI, Max 2 sentences)
     */
    generateWhy(card, rawQuery, tokens, dominantSignals) {
      const reasons = card.matchReasons || {};
      const q = rawQuery.toLowerCase();

      // 1. 카드 데이터에 등록된 정밀 matchReasons 활용
      if (reasons.trigger && (q.includes('답장') || q.includes('연락') || q.includes('카톡') || q.includes('상사') || q.includes('엄마'))) {
        return `${reasons.trigger} ${reasons.story || ''}`.trim();
      }
      if (reasons.story && (q.includes('실패') || q.includes('망했') || q.includes('비교') || q.includes('초라') || q.includes('질투'))) {
        return `${reasons.story} ${reasons.urge || ''}`.trim();
      }
      if (reasons.urge && (q.includes('미루') || q.includes('계획') || q.includes('인스타') || q.includes('확인'))) {
        return `${reasons.urge} ${reasons.context || ''}`.trim();
      }

      // 2. 기본 matchReasons 조합
      if (reasons.trigger) {
        return reasons.trigger;
      }

      // 3. Fallback 비진단 문구
      const kw = card.keyword || card.cardTitle || '현재 마음에 걸리는 지점';
      return `‘${kw}’과 관련된 생각 패턴을 멈추고 안전하게 10%의 행동 실험을 해볼 수 있는 관점입니다.`;
    }

    /**
     * 4단계: 3대 Code Routing 힌트 추출
     */
    extractCodeHint(topCards, rawQuery) {
      const q = rawQuery.toLowerCase();
      if (/왜|계속|자꾸|원인|이유|패턴|반복/.test(q)) {
        return {
          code: "Dark Code",
          tag: "Dark Code",
          hint: "지금은 먼저 반복되는 패턴을 관찰하는 것이 도움이 될 수 있습니다."
        };
      } else if (/어떻게|행동|시작|미루|실행|바뀌|실천/.test(q)) {
        return {
          code: "Neural Code",
          tag: "Neural Code",
          hint: "패턴을 이미 알고 계신다면, 이번에는 10%의 작은 행동 실험을 해볼 때입니다."
        };
      } else {
        return {
          code: "Zero Point",
          tag: "Zero Point",
          hint: "생각과 감정에 휩쓸리지 않고 내면의 선택권을 회복하는 영점 질문입니다."
        };
      }
    }

    /**
     * 메인 라우트 함수 (100% NO-AI 핵심 파이프라인)
     */
    route(rawUserQuery, options = {}) {
      if (!this.cards || this.cards.length === 0) {
        if (window.MIND_CARDS_DATA && Array.isArray(window.MIND_CARDS_DATA)) {
          this.cards = window.MIND_CARDS_DATA;
        }
      }

      const query = (rawUserQuery || '').trim();

      // 1. Safety Router Check (최우선)
      const safety = this.checkSafety(query);
      if (!safety.isSafe) {
        return {
          status: 'high_risk_blocked',
          safety,
          routerMode: ROUTER_CONFIG.ROUTER_MODE,
          recommendations: [],
          disclaimer: "긴급 위기 지원을 최우선으로 안내합니다."
        };
      }

      if (query.length < 2) {
        return {
          status: 'empty_query',
          routerMode: ROUTER_CONFIG.ROUTER_MODE,
          message: '마음에 걸리는 고민을 조금 더 적어주시면 가장 가까운 질문을 찾아드립니다.',
          recommendations: []
        };
      }

      // 2. Normalization & Token/Context Extraction
      const normalized = KoreanNormalizer.normalize(query);
      const tokens = KoreanNormalizer.extractTokens(normalized);
      const contexts = KoreanNormalizer.detectContexts(tokens, query);

      // 3. 230개 카드 스코어링
      const scoredResults = [];
      for (const card of this.cards) {
        const scoreObj = this.scoreCard(card, tokens, contexts, query);
        if (scoreObj.finalScore > 0) {
          scoredResults.push(scoreObj);
        }
      }

      // 점수 내림차순 정렬
      scoredResults.sort((a, b) => b.finalScore - a.finalScore);

      // 4. Deduplication & Diversification (관점 다양화 Top 3)
      let selectedCandidates = [];
      let isFallback = false;

      if (scoredResults.length > 0 && scoredResults[0].finalScore >= ROUTER_CONFIG.MIN_SCORE_THRESHOLD) {
        // 최고 점수 카드
        selectedCandidates.push(scoredResults[0]);

        // 2, 3위 카드는 가능한 서로 다른 관점/팩에서 선발
        for (let i = 1; i < scoredResults.length; i++) {
          if (selectedCandidates.length >= ROUTER_CONFIG.MAX_RECOMMENDATIONS) break;
          const candidate = scoredResults[i];

          // 유사 카드 중복 방지 (동일 키워드나 동일 질문 방지)
          const isTooSimilar = selectedCandidates.some(sel => 
            sel.card.cardTitle === candidate.card.cardTitle ||
            (sel.card.keyword === candidate.card.keyword && sel.card.category === candidate.card.category)
          );

          if (!isTooSimilar || selectedCandidates.length < 2) {
            selectedCandidates.push(candidate);
          }
        }
      } else {
        // Fallback: 적절한 카드가 없을 때 인기/대표 질문 제안
        isFallback = true;
        const featured = this.cards.filter(c => c.isFeatured || c.featured);
        const pool = featured.length >= 3 ? featured : this.cards;
        selectedCandidates = pool.slice(0, 2).map(c => ({
          card: c,
          kwScore: 0, tagScore: 0, contextScore: 0, penalty: 0, finalScore: 1.0
        }));
      }

      // 5. 추천 객체 완성 (안전한 WHY 포함)
      const recommendations = selectedCandidates.map(item => ({
        card: item.card,
        score: item.finalScore,
        debugBreakdown: options.debug ? {
          kwScore: item.kwScore,
          tagScore: item.tagScore,
          contextScore: item.contextScore,
          penalty: item.penalty
        } : null,
        why: this.generateWhy(item.card, query, tokens, contexts),
        whySource: "rule_match_reasons"
      }));

      const codeHint = this.extractCodeHint(recommendations.map(r => r.card), query);

      return {
        status: 'success',
        safety,
        isFallback,
        routerMode: ROUTER_CONFIG.ROUTER_MODE,
        queryLength: query.length,
        normalizedTerms: options.debug ? tokens : undefined,
        detectedContexts: options.debug ? contexts : undefined,
        resultCount: recommendations.length,
        recommendations,
        codeHint,
        uiHeadline: "지금 고민과 가까운 질문을 찾았습니다.",
        disclaimer: "이 결과는 심리진단이나 성격판정이 아닙니다. 지금 이야기와 가장 가까운 질문을 찾은 것입니다."
      };
    }

    getRelatedCards(cardId) {
      if (!cardId) return [];
      const card = this.cards.find(c => c.id === cardId);
      if (!card || !card.relatedCards) return [];
      const related = [];
      for (const rid of card.relatedCards.slice(0, 3)) {
        const rc = this.cards.find(c => c.id === rid);
        if (rc) related.push(rc);
      }
      return related;
    }

    incrementSessionBrowse() {
      this.sessionBrowseCount += 1;
      return this.sessionBrowseCount >= 3;
    }

    resetSessionBrowse() {
      this.sessionBrowseCount = 0;
    }
  }

  // 7. SemanticRouter (향후 API/로컬 임베딩 연동용 스켈레톤)
  class SemanticRouter extends RouterInterface {
    constructor(cards) {
      super();
      this.cards = cards;
      this.fallbackRouter = new RuleBasedRouter(cards);
    }
    async route(query, options) {
      // API 키가 없으므로 즉시 RuleBasedRouter로 안전하게 위임
      return this.fallbackRouter.route(query, options);
    }
  }

  // 8. HybridRouter (Rule + Semantic 앙상블 스켈레톤)
  class HybridRouter extends RouterInterface {
    constructor(cards) {
      super();
      this.cards = cards;
      this.ruleRouter = new RuleBasedRouter(cards);
      this.semanticRouter = new SemanticRouter(cards);
    }
    async route(query, options) {
      // API 키가 없으므로 즉시 RuleBasedRouter로 완벽하게 위임
      return this.ruleRouter.route(query, options);
    }
  }

  // 9. RouterFactory 및 전역 등록
  class MyeongsimRouterFactory {
    static create(mode = ROUTER_CONFIG.ROUTER_MODE) {
      const cards = window.MIND_CARDS_DATA || [];
      if (mode === 'semantic') {
        return new SemanticRouter(cards);
      } else if (mode === 'hybrid') {
        return new HybridRouter(cards);
      } else {
        return new RuleBasedRouter(cards);
      }
    }
  }

  // 전역 인스턴스 등록
  const activeEngine = MyeongsimRouterFactory.create('rule');
  window.MyeongsimAIRouter = activeEngine;
  window.RuleBasedRouter = RuleBasedRouter;
  window.KoreanNormalizer = KoreanNormalizer;
  window.MyeongsimRouterFactory = MyeongsimRouterFactory;

})(window);
