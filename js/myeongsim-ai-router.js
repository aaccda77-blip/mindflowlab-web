/**
 * =================================================================
 * MYUNGSIM AI COUNSEL ROUTER ENGINE (명심AI 고민 라우터)
 * High-performance, Privacy-safe, Non-diagnostic Intent Matching Engine
 * =================================================================
 */

(function(window) {
  'use strict';

  // 1. 위기 및 고위험 키워드 사전 (Safety Router)
  const HIGH_RISK_PATTERNS = [
    /자해/i, /자살/i, /죽고\s*싶/i, /살기\s*싫/i, /죽을래/i, /죽는\s*게/i,
    /목숨/i, /유서/i, /스토킹/i, /폭행/i, /성폭력/i, /감금/i, /협박/i,
    /해치고\s*싶/i, /죽여/i, /칼로/i, /피\s*흘/i, /안전하지\s*않/i,
    /맞았/i, /때렸/i, /가정폭력/i, /학대/i
  ];

  const PROFESSIONAL_ADVICE_PATTERNS = [
    /진료|처방|약물|우울증약|공황장애약|정신과|의사/i,
    /소송|고소|변호사|법원|합의금|이혼소송/i,
    /전재산|빚|파산|개인회생|몰빵|영끌|보증/i
  ];

  const FORTUNE_QUERY_PATTERNS = [
    /대운\s*(언제|있|오)/i, /올해\s*(운|재수|운세)/i, /결혼운/i, /재물운/i,
    /돈복\s*있/i, /삼재\s*언제/i, /사주\s*봐/i, /점\s*쳐/i, /미래\s*알려/i
  ];

  // 불용어 목록
  const STOP_WORDS = new Set([
    '나', '저', '내', '제', '이', '그', '저', '것', '수', '등', '들',
    '진짜', '너무', '정말', '자꾸', '계속', '좀', '왜', '어떻게', '때문에',
    '같아요', '싶어요', '돼요', '해요', '하는', '있는', '있는데', '하는데',
    '것만', '같아', '하고', '해서', '해서요', '거예요', '인가요', '걸까요'
  ]);

  // 동의어 및 테마 매핑 사전 (Semantic Synonym Dictionary)
  const SYNONYM_MAP = {
    '남편': ['배우자', '가족', '결혼', '부부', '연인', '관계'],
    '아내': ['배우자', '가족', '결혼', '부부', '연인', '관계'],
    '남자친구': ['연인', '남친', '애인', '데이트', '친밀감', '연애'],
    '여자친구': ['연인', '여친', '애인', '데이트', '친밀감', '연애'],
    '카톡': ['연락', '메시지', '답장', '문자', '전화', '대기'],
    '답장': ['연락', '메시지', '카톡', '읽씹', '답변', '대기'],
    '팀장': ['상사', '회사', '직장', '보고', '회의', '평가'],
    '부장': ['상사', '회사', '직장', '보고', '회의', '평가'],
    '대표': ['상사', '회사', '직장', '임원', '평가', '성과'],
    '사업': ['돈', '매출', '창업', '실패', '고객', '경제'],
    '망했': ['실패', '좌절', '두려움', '끝', '실수'],
    '삼재': ['사주', '운명', '불운', '징크스', '확실성', '믿음'],
    '사주': ['운명', '팔자', '대운', '궁합', '미신', '믿음'],
    '엄마': ['부모', '가족', '독립', '경계', '죄책감'],
    '아빠': ['부모', '가족', '독립', '경계', '죄책감'],
    '질투': ['비교', '부러움', '열등감', '인정', '친구'],
    '미루': ['미루기', '회피', '시작', '결정', '완벽주의', '행동'],
    '숨': ['불안', '공황', '긴장', '신체반응', '두려움', '압박'],
    '다크코드': ['패턴', '자동반응', '트리거', '동일시', '관찰']
  };

  /**
   * 명심AI 고민 라우터 클래스
   */
  class MyeongsimAIRouter {
    constructor() {
      this.cards = [];
      this.sessionBrowseCount = 0;
      this.initCards();
    }

    initCards() {
      if (window.MIND_CARDS_DATA && Array.isArray(window.MIND_CARDS_DATA)) {
        this.cards = window.MIND_CARDS_DATA;
      }
    }

    setCards(cards) {
      if (Array.isArray(cards)) {
        this.cards = cards;
      }
    }

    /**
     * Safety Router 검사
     */
    checkSafety(input) {
      if (!input || typeof input !== 'string') {
        return { isSafe: true };
      }

      const cleanText = input.trim();

      // 1. 고위험 (자해, 자살, 타해, 폭력, 위기)
      for (const pattern of HIGH_RISK_PATTERNS) {
        if (pattern.test(cleanText)) {
          return {
            isSafe: false,
            isHighRisk: true,
            title: "지금 많이 버겁고 위험한 상황이신가요?",
            message: "혼자 감당하기 어려운 고통이나 긴급한 위험 속에 계신다면, 명심카드보다 24시간 언제든 도움을 받을 수 있는 전문가와 먼저 연결되는 것이 가장 안전합니다.",
            contacts: [
              { name: "자살예방 상담전화", tel: "109", note: "24시간 무료 전문상담" },
              { name: "정신건강 위기상담전화", tel: "1577-0199", note: "24시간 정신건강 상담" },
              { name: "경찰청 긴급신고", tel: "112", note: "신변 위협 및 긴급 구조" },
              { name: "여성긴급전화", tel: "1366", note: "가정폭력·스토킹·성폭력 24시간" }
            ]
          };
        }
      }

      // 2. 전문 상담 권고 (의료, 법률, 중대 재무)
      let needsProfessional = false;
      for (const pattern of PROFESSIONAL_ADVICE_PATTERNS) {
        if (pattern.test(cleanText)) {
          needsProfessional = true;
          break;
        }
      }

      // 3. 운세/예언 쿼리 검사
      let isFortuneQuery = false;
      for (const pattern of FORTUNE_QUERY_PATTERNS) {
        if (pattern.test(cleanText)) {
          isFortuneQuery = true;
          break;
        }
      }

      return {
        isSafe: true,
        isHighRisk: false,
        needsProfessional,
        isFortuneQuery,
        fortuneNotice: isFortuneQuery ? "명심코칭은 미래 운세를 판정하거나 맞히지 않습니다. 대신 그 질문이 지금 왜 중요해졌는지 내면의 불안과 선택권을 함께 살펴봅니다." : null
      };
    }

    /**
     * 한국어 텍스트 토큰화 및 시맨틱 확장
     */
    extractTokens(text) {
      if (!text) return [];
      const clean = text.replace(/[^\w\s가-힣]/g, ' ');
      const rawWords = clean.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));

      const tokenSet = new Set(rawWords);

      // 동의어 사전 확장
      for (const w of rawWords) {
        for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
          if (w.includes(key) || key.includes(w)) {
            tokenSet.add(key);
            synonyms.forEach(s => tokenSet.add(s));
          }
        }
      }

      return Array.from(tokenSet);
    }

    /**
     * 특정 카드와 쿼리 토큰 간의 매칭 점수 계산
     */
    scoreCard(card, tokens, rawQuery) {
      let score = 0;
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

      const fullCardText = `${title} ${question} ${keyword} ${category} ${soda} ${searchKeywords.join(' ')} ${routeTags.join(' ')} ${triggerTags.join(' ')}`;

      // 1. 원문 직접 포함 여부 (High Bonus)
      if (rawQuery.length >= 3 && fullCardText.includes(rawQuery.toLowerCase())) {
        score += 8.0;
      }

      // 2. 개별 토큰 매칭 가중치
      for (const token of tokens) {
        const t = token.toLowerCase();

        // Title match
        if (title.includes(t)) score += 5.0;

        // Question match
        if (question.includes(t)) score += 4.5;

        // Keyword & SearchKeywords match
        if (keyword.includes(t)) score += 3.5;
        if (searchKeywords.some(sk => sk.includes(t))) score += 3.5;

        // Trigger & Story Tags
        if (triggerTags.some(tt => tt.includes(t))) score += 3.0;
        if (storyTags.some(st => st.includes(t))) score += 2.5;

        // Route & Urge Tags
        if (routeTags.some(rt => rt.includes(t))) score += 2.0;
        if (urgeTags.some(ut => ut.includes(t))) score += 1.5;

        // Soda Answer
        if (soda.includes(t)) score += 1.0;
      }

      // 3. Featured 카드에 미세 가중치 (0.2)
      if (card.isFeatured) score += 0.2;

      return score;
    }

    /**
     * 추천 이유 (WHY) 생성기
     * 절대 진단하지 않고, 사용자의 상황과 질문의 연결 지점을 최대 2문장으로 설명
     */
    generateWhy(card, rawQuery) {
      const q = rawQuery.toLowerCase();
      const title = card.cardTitle || '';
      const keyword = card.keyword || '';
      const category = card.category || '';

      if (q.includes('답장') || q.includes('연락') || q.includes('카톡') || q.includes('전화')) {
        return "상대의 즉각적인 반응이 확인되기 전, 불안을 낮추기 위해 나쁜 결론을 먼저 예상하거나 확인하고 싶은 장면과 가깝습니다.";
      }
      if (q.includes('사업') || q.includes('망했') || q.includes('실패') || q.includes('돈')) {
        return "일이나 사업의 결과가 나 자신의 전체 가치 판결로 빠르게 연결되는 순간을 멈추고 관찰해보는 질문입니다.";
      }
      if (q.includes('회사') || q.includes('팀장') || q.includes('상사') || q.includes('회의') || q.includes('숨')) {
        return "상대나 조직의 미세한 평가 신호에 온 신경이 곤두서며 몸과 마음이 과긴장 상태로 전환되는 장면과 가깝습니다.";
      }
      if (q.includes('질투') || q.includes('비교') || q.includes('친구') || q.includes('동기')) {
        return "타인의 좋은 소식을 축하하면서도 내 안에서 비교와 결핍의 스토리 엔진이 켜지는 순간을 다룹니다.";
      }
      if (q.includes('엄마') || q.includes('아빠') || q.includes('부모') || q.includes('가족') || q.includes('거절')) {
        return "가족의 요구나 감정을 내 책임처럼 느끼며, 건강한 경계를 세울 때 찾아오는 죄책감을 분리해보는 질문입니다.";
      }
      if (q.includes('좋아') || q.includes('끊고') || q.includes('잠수') || q.includes('이별') || q.includes('연인')) {
        return "관계가 가까워질수록 상처받을까 두려워 먼저 거리를 두거나 통제하려는 자동반응과 연결됩니다.";
      }
      if (q.includes('계획') || q.includes('미루') || q.includes('시작') || q.includes('게으')) {
        return "부족한 의지 문제가 아니라 완벽하게 해내야 한다는 압박 때문에 시작 결정을 보류하고 있는 장면과 가깝습니다.";
      }
      if (q.includes('실수') || q.includes('자책') || q.includes('싫어') || q.includes('후회')) {
        return "사건 자체의 크기보다, 발생한 실수 뒤에 스스로를 가혹하게 몰아세우는 두 번째 화살을 관찰하는 질문입니다.";
      }
      if (q.includes('삼재') || q.includes('사주') || q.includes('운명') || q.includes('징크스') || q.includes('대운')) {
        return "미래의 불확실성을 감당하기 위해 믿음이나 외부의 말에 행동의 최종 결재권까지 넘겨주고 있는지 살펴보는 질문입니다.";
      }
      if (q.includes('다크코드') || q.includes('다크 코드') || q.includes('안 바뀌')) {
        return "패턴을 머리로 이해하는 것과 몸으로 다른 10% 행동을 실행해보는 경험 사이의 전환을 돕는 질문입니다.";
      }

      // 범용 매칭 (규칙 기반)
      if (category.includes('관계') || category.includes('연애')) {
        return `상대와의 관계에서 확인되지 않은 상대의 마음을 넘겨짚지 않고, 실제 일어난 사실과 내 감정을 분리해보는 질문입니다.`;
      } else if (category.includes('돈') || category.includes('성과')) {
        return `외부의 결과나 경제적 불확실성 앞에서 통제할 수 없는 걱정 대신 오늘 내가 할 수 있는 작은 행동을 찾는 관점입니다.`;
      } else if (category.includes('완벽') || category.includes('자책')) {
        return `상황을 100 아니면 0으로 나누는 자동 해석에서 벗어나 안전한 10%의 실험 공간을 여는 질문입니다.`;
      }

      return `지금 마음에 걸리는 ‘${keyword}’의 순간, 내 안에서 어떤 감정과 충동이 먼저 작동하는지 차분히 비춰보는 질문입니다.`;
    }

    /**
     * 3대 Code Routing 안내 배지/힌트 추출
     */
    extractCodeHint(cards, rawQuery) {
      const q = rawQuery.toLowerCase();
      if (q.includes('왜') || q.includes('계속') || q.includes('자꾸') || q.includes('원인') || q.includes('이유') || q.includes('패턴')) {
        return {
          code: "Dark Code",
          tag: "Dark Code",
          hint: "지금은 먼저 패턴을 보는 것이 도움이 될 수 있습니다."
        };
      } else if (q.includes('어떻게') || q.includes('행동') || q.includes('시작') || q.includes('미루') || q.includes('실행') || q.includes('바뀌')) {
        return {
          code: "Neural Code",
          tag: "Neural Code",
          hint: "패턴은 이미 잘 알고 있는 것 같습니다. 이번에는 작은 행동실험을 해볼 수 있습니다."
        };
      } else {
        return {
          code: "Zero Point",
          tag: "Zero Point",
          hint: "생각과 감정이 너무 강하게 ‘나 전체’처럼 느껴진다면 선택의 공간부터 살펴볼 수 있습니다."
        };
      }
    }

    /**
     * 메인 고민 라우팅 함수
     * @param {string} userProblem 사용자의 자연어 고민
     * @returns {object} 라우팅 결과 객체
     */
    route(userProblem) {
      if (!this.cards || this.cards.length === 0) {
        this.initCards();
      }

      const query = (userProblem || '').trim();

      // 1. Safety Router
      const safety = this.checkSafety(query);
      if (!safety.isSafe) {
        return {
          status: 'high_risk_blocked',
          safety
        };
      }

      if (query.length < 2) {
        return {
          status: 'empty_query',
          message: '마음에 걸리는 고민을 조금 더 적어주시면 가장 가까운 질문을 찾아드립니다.'
        };
      }

      // 2. 토큰 추출 및 스코어링
      const tokens = this.extractTokens(query);
      const scored = [];

      for (const c of this.cards) {
        const score = this.scoreCard(c, tokens, query);
        if (score > 0) {
          scored.push({ card: c, score });
        }
      }

      // 점수 내림차순 정렬
      scored.sort((a, b) => b.score - a.score);

      let topResults = [];
      let isFallback = false;

      if (scored.length >= 3 && scored[0].score >= 3.0) {
        // 충분히 매칭된 경우 상위 3개
        topResults = scored.slice(0, 3).map(item => item.card);
      } else if (scored.length === 2 && scored[0].score >= 2.0) {
        // 2개 매칭
        topResults = scored.map(item => item.card);
      } else if (scored.length > 0 && scored[0].score >= 1.5) {
        topResults = scored.slice(0, Math.min(3, scored.length)).map(item => item.card);
      } else {
        // 매칭 결과가 매우 약하거나 없을 때 (Fallback: 인기/주요 질문 3개 제안)
        isFallback = true;
        const featuredOrPopular = this.cards.filter(c => c.isFeatured || c.popularity >= 80);
        topResults = (featuredOrPopular.length >= 3 ? featuredOrPopular : this.cards).slice(0, 3);
      }

      // 추천 카드 객체 구성 (WHY 포함)
      const recommendations = topResults.map(c => ({
        card: c,
        why: this.generateWhy(c, query)
      }));

      const codeHint = this.extractCodeHint(topResults, query);

      return {
        status: 'success',
        safety,
        isFallback,
        queryLength: query.length,
        resultCount: recommendations.length,
        recommendations,
        codeHint,
        disclaimer: "이 결과는 심리진단이나 성격판정이 아닙니다. 지금 상황과 가까운 관점의 질문을 찾은 것입니다."
      };
    }

    /**
     * 연관 카드 (relatedCards) 탐색 및 루프 방지 로직
     */
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
      return this.sessionBrowseCount >= 3; // 3회 이상 탐색 시 루프 차단 및 행동 유도
    }

    resetSessionBrowse() {
      this.sessionBrowseCount = 0;
    }
  }

  // 전역 인스턴스 등록
  window.MyeongsimAIRouter = new MyeongsimAIRouter();

})(window);
