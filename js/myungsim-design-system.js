/**
 * =================================================================
 * MYUNGSIM DESIGN SYSTEM & CONTENT LANGUAGE SYSTEM v1.0
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * "당신을 규정하지 않고, 당신의 작동방식을 함께 봅니다."
 * Zero-AI Production Mode / Deterministic Registry
 * copyVersion: myungsim-language-v1.0
 * =================================================================
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------
  // 1. DESIGN PRINCIPLES (제품 전체의 3대 기준 문장)
  // -------------------------------------------------------------
  const DESIGN_PRINCIPLES = {
    CORE: "당신을 규정하지 않고, 당신의 작동방식을 함께 봅니다.",
    LIFE_RETURN: "자기 관찰은 다시 삶으로 돌아가기 위해 존재합니다.",
    TODAY_CARD: "오늘의 카드는 당신의 미래를 맞히지 않습니다. 지금의 당신에게 무슨 일이 일어나고 있는지 묻습니다."
  };

  // -------------------------------------------------------------
  // 2. CORE PRODUCT LANGUAGE (제품 표준 용어집)
  // -------------------------------------------------------------
  const CORE_TERMS = {
    SCENE: { ko: '장면', en: 'SCENE', desc: '일상에서 마음이 걸리거나 반응이 일어난 구체적인 상황' },
    FACT: { ko: '확인된 사실', en: 'FACT', desc: '누가 보아도 반박할 수 없는 객관적으로 일어난 사실' },
    STORY: { ko: '내가 붙인 의미 / 해석', en: 'STORY', desc: '사실이 확인되기 전에 머릿속에서 빠르게 만들어지는 하나의 해석' },
    UNKNOWN: { ko: '아직 모르는 것', en: 'UNKNOWN', desc: '아직 확인되지 않은 사실. 회피가 아닌 정확성의 공간 ("아직 모른다")' },
    BODY: { ko: '몸의 신호', en: 'BODY', desc: '생각보다 먼저 몸에서 올라오는 신체적 반응 (BODY SIGNAL ≠ VERDICT)' },
    EMOTION: { ko: '지금 올라오는 감정', en: 'EMOTION', desc: '좋음/나쁨으로 분류하지 않고 있는 그대로 알아차리는 감정' },
    URGE: { ko: '지금 당장 하고 싶은 충동', en: 'URGE', desc: '확인하기, 사과하기, 도망가기 등 즉각 튀어나오는 충동 (행동 명령 아님)' },
    ACTION: { ko: '실제로 한 행동', en: 'ACTION', desc: '충동과 분리되어 현실에서 실제로 취한 행동' },
    EXPECTED: { ko: '예상', en: 'EXPECTED', desc: '행동하기 전 머릿속으로 상상했던 파국적이거나 두려운 예상' },
    ACTUAL: { ko: '실제로 일어난 것', en: 'ACTUAL', desc: '10% 행동 후 현실에서 실제로 벌어진 객관적 결과' },
    ACTION_10: { ko: '10% 다른 행동', en: '10% ACTION', desc: '오늘 가능한, 조금 다른 선택 (미션이나 숙제가 아님)' },
    WORKING_MAP: { ko: '작동지도', en: 'WORKING MAP', desc: '최근 기록에서 반복해서 발견된 하나의 자동 작동 패턴 (정체성 아님)' }
  };

  // -------------------------------------------------------------
  // 3. CANONICAL CODE DESCRIPTIONS (Dark / Neural / Zero Point)
  // 사람의 등급이나 우열, 각성 단계가 아닌 기능과 관계의 차이로 설명
  // -------------------------------------------------------------
  const CODE_DESCRIPTIONS = {
    DARK_CODE: {
      name: 'Dark Code',
      short: '반복되는 자동 작동',
      summary: '반복해서 자동으로 가는 길',
      desc: '마음에 걸리는 장면이 오면 무의식적으로 빠르게 작동하는 익숙한 생각과 반응의 패턴입니다. 결함이나 나쁜 성격이 아니며, 그저 반복 작동을 바라봅니다.',
      forbiddenTerms: ['나쁜 코드', '결함', '내면의 어둠', '병리', '저주', 'Dark Code형']
    },
    NEURAL_CODE: {
      name: 'Neural Code',
      short: '새로운 경험을 만드는 연습',
      summary: '조금 다른 행동을 실제로 해보는 과정',
      desc: '예상과 다른 실제 경험을 통해 뇌에 선택지가 하나 더 있음을 알려주는 10% 작은 행동실험의 과정입니다.',
      forbiddenTerms: ['뇌가 재배선됨', '신경회로 치료', 'Neural Code 활성화 수치', '완치']
    },
    ZERO_POINT: {
      name: 'Zero Point',
      short: '반응과 나 사이의 작은 선택공간',
      summary: '반응이 있어도 그 반응이 내 전체는 아닌 상태를 잠깐 확인하는 기준점',
      desc: '충동이 올라와도 즉각 반응하지 않고, 나와 반응 사이에 한 호흡의 틈을 마련하는 일상의 기준점입니다. 높은 영적 레벨이나 깨달음 단계가 아닙니다.',
      forbiddenTerms: ['최고 단계', '각성 상태', '깨달음 단계', '영적 레벨', '진화 등급']
    }
  };

  // -------------------------------------------------------------
  // 4. SCAN / SYNC / SHIFT DEFINITIONS
  // -------------------------------------------------------------
  const SCAN_FLOW_DEFINITIONS = {
    SCAN: {
      name: 'SCAN',
      title: '내 경우를 1분 SCAN',
      userCopy: '지금 무슨 일이 일어나고 있는지 잠깐 확인합니다.',
      clarification: 'SCAN은 심리검사나 진단, 성격분석, 점수 측정이 아닙니다.'
    },
    SYNC: {
      name: 'SYNC',
      userCopy: '지금 이런 반응이 있구나.',
      longCopy: '이 반응이 올라오는 것은 인정하되, 이 반응을 나 전체로 만들지는 않습니다.'
    },
    SHIFT: {
      name: 'SHIFT',
      userCopy: '그럼 다음에는 무엇을 10% 다르게 해볼까요?',
      clarification: 'SHIFT는 완전한 변화, 각성, 치유, 초월이 아닙니다.'
    }
  };

  // -------------------------------------------------------------
  // 5. CORE CTA DICTIONARY (표준 버튼 명칭 사전)
  // 문맥상 의미가 불분명한 generic CTA(확인, 계속, GO 등) 최소화
  // -------------------------------------------------------------
  const CTA_DICTIONARY = {
    PICK_TODAY_CARD: '오늘의 카드 뽑기',
    FIND_BY_QUESTION: '내 고민으로 질문 찾기',
    FIND_CLOSE_QUESTION: '가까운 질문 찾기',
    VIEW_THIS_QUESTION: '이 질문으로 보기',
    START_1MIN_SCAN: '내 경우를 1분 SCAN',
    NEXT: '다음',
    SELECT_10PERCENT_ACTION: '오늘의 10% 선택',
    SAVE_DISCOVERY: '오늘 발견 저장하기',
    START_EXPERIMENT: '작은 행동실험으로 남기기',
    REVIEW_RESULT: '어떻게 됐는지 보기',
    VIEW_WORKING_MAP: '내 작동지도 보기',
    START_30DAY_JOURNEY: '30일 여정 시작',
    VIEW_ALL_HISTORY: '전체 기록 보기',
    END_SESSION: '여기서 끝내기',
    ENOUGH_FOR_TODAY: '이걸로 충분해요'
  };

  // -------------------------------------------------------------
  // 6. SAFETY COPY REGISTRY (8대 고위험군 표준 안내 및 긴급 지원)
  // -------------------------------------------------------------
  const SAFETY_COPY_REGISTRY = {
    EMERGENCY_CONTACTS: [
      { name: '자살예방 상담전화', number: '109', time: '24시간' },
      { name: '정신건강 상담전화', number: '1577-0199', time: '24시간' },
      { name: '생명의 전화', number: '1588-9191', time: '24시간' }
    ],
    CRISIS_HERO: '지금 안전과 도움이 가장 우선입니다.',
    CRISIS_SUB: '명심코칭은 전문적인 의료·상담 치료를 대신할 수 없습니다. 지금 힘든 마음을 겪고 계시다면 혼자 감당하지 마시고 아래 24시간 전문 상담 기관에 바로 도움을 요청해 주세요.',
    CATEGORIES: {
      selfHarm: { title: '자해 및 위기 지원', lead: '스스로를 해치고 싶은 충동이 들 때는 즉각적인 안전 확보가 필요합니다.' },
      harmOthers: { title: '타인 위해 및 충동', lead: '자신과 타인의 안전을 위해 즉시 전문 기관의 개입을 받으세요.' },
      violence: { title: '가정·데이트 폭력', lead: '폭력 상황에서는 혼자 해결하려 하지 마시고 여성긴급전화(1366) 또는 경찰(112)에 연락하세요.' },
      stalking: { title: '스토킹 및 괴롭힘', lead: '안전이 위협받을 때는 증거를 확보하고 112 경찰에 신변 보호를 요청하세요.' },
      coercion: { title: '강압 및 착취', lead: '거절하기 어려운 위력이나 착취 관계는 외부 전문 법률·상담 기관의 지원이 필요합니다.' },
      medicalHighStakes: { title: '의학적 긴급 상황', lead: '신체적 증상 및 급성 질환은 전문 의사의 진료가 필수적입니다.' },
      financialHighStakes: { title: '극심한 경제적 위기', lead: '서민금융진흥원(1397) 또는 신용회복위원회의 공식 구제 절차를 확인하세요.' },
      legalHighStakes: { title: '법적 긴급 분쟁', lead: '대한법률구조공단(132)을 통해 정식 법률 자문을 받으시기 바랍니다.' }
    }
  };

  // -------------------------------------------------------------
  // 7. PRIVACY & DATA PHILOSOPHY COPY
  // -------------------------------------------------------------
  const PRIVACY_COPY = {
    SEPARATION: '당신의 개인 기록은 공개 콘텐츠와 분리됩니다.',
    MINIMAL_SIGNAL: '서비스 개선에는 개인의 고민 원문 대신 최소한의 이용 신호를 사용합니다.',
    PHILOSOPHY: '사람의 비밀을 축적하지 않고, 사람들의 사용에서 배운 지혜를 축적합니다.',
    ZERO_RAW_TEXT: '개인 고민 원문 텍스트는 제품 분석 서버로 전송되지 않고 브라우저에만 머뭅니다.'
  };

  // -------------------------------------------------------------
  // 8. EMPTY / ERROR / LOADING / SUCCESS STATES
  // -------------------------------------------------------------
  const SYSTEM_STATES_COPY = {
    EMPTY_HISTORY: '아직 저장한 발견이 없습니다.',
    EMPTY_WORKING_MAP: '반복을 말하기에는 아직 기록이 충분하지 않습니다.',
    EMPTY_SEARCH: '정확히 같은 질문은 아직 없습니다. 다른 일상 단어로 검색해 보세요.',
    LOADING_ROUTER: '가까운 질문을 찾고 있습니다.',
    LOADING_MAP: '최근 기록을 정리하고 있습니다.',
    ERROR_GENERAL: '질문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    SUCCESS_SAVE: '오늘 선택을 저장했습니다.',
    SUCCESS_EXPERIMENT_DONE: '실제 결과를 하나 기록했습니다.',
    SUCCESS_MAP_UPDATED: '최근 지도에 반영했습니다.'
  };

  // -------------------------------------------------------------
  // 9. FORBIDDEN & SENSITIVE PHRASES (금지어 및 주의어 규칙)
  // -------------------------------------------------------------
  const FORBIDDEN_RULES = [
    {
      id: 'IDENTITY_LABEL',
      category: '정체성 낙인',
      patterns: ['당신은 .*형입니다', '당신은 원래', '당신의 성격은', '당신의 본질은', '불안형', '회피형', '유리멘탈'],
      replacement: '“이 장면에서는”, “최근 기록에서는 이런 반응이 나타날 수 있습니다.”'
    },
    {
      id: 'DIAGNOSIS',
      category: '의료/진단 단정',
      patterns: ['진단했습니다', '분석 결과 당신은', '심리적으로 문제가 있음', '치료가 필요', '병리적', '장애로 보임'],
      replacement: '명심코칭은 진단 도구가 아닙니다. 관찰과 질문을 제공합니다.'
    },
    {
      id: 'FORTUNE',
      category: '운세/예언',
      patterns: ['미래가 보입니다', '운이 좋습니다', '운이 나쁩니다', '올해는 위험', '대운', '재물운 예측', '연애운 예측'],
      replacement: '“이 믿음이 지금 선택에 어떤 영향을 주는지 볼 수 있습니다.”'
    },
    {
      id: 'OVERPROMISE',
      category: '과장/완치 약속',
      patterns: ['100% 변화', '완치', '패턴 완전 탈출', '30일 변화 보장', '30일 치유'],
      replacement: '“30일 동안 내 작동을 가볍게 관찰해봅니다.”'
    },
    {
      id: 'BRAIN_CLAIM',
      category: '신경과학 과장',
      patterns: ['뇌가 재배선됨', '신경회로가 치료됨', 'Neural Code 활성화 수치'],
      replacement: '“새로운 경험을 만드는 연습”'
    },
    {
      id: 'GAMIFICATION',
      category: '스트릭/죄책감 유발',
      patterns: ['출석 실패', '연속 스트릭 파괴', '결석', '놓친 미션', '의지박약'],
      replacement: '자율 속도 기반의 따뜻한 환대 안내'
    }
  ];

  // -------------------------------------------------------------
  // 10. DO / DON'T EXAMPLES
  // -------------------------------------------------------------
  const DO_DONT_EXAMPLES = [
    {
      context: '사용자 관찰',
      do: '최근 기록에서는 이런 반응이 반복되었습니다.',
      dont: '당신은 이런 사람입니다.'
    },
    {
      context: '행동 제안',
      do: '오늘 가능한, 작은 10% 선택',
      dont: '패턴 탈출 미션 / 오늘의 숙제'
    },
    {
      context: '결과 검토',
      do: '예상과 실제를 비교해봅니다.',
      dont: '부정적 사고를 교정하고 긍정적으로 생각하세요.'
    },
    {
      context: '상대방과의 갈등',
      do: '상대가 거짓말했다면 그 사실 자체는 스토리로 줄일 수 없습니다. 다만 그 사실 위에서 내가 내린 판결은 따로 볼 수 있습니다.',
      dont: '모든 것은 당신의 마음이 지어낸 착각입니다.'
    },
    {
      context: '질문하기',
      do: '상대가 불편해하면 내가 해결해야 한다는 생각이 바로 올라오나요?',
      dont: '당신은 상대의 감정을 지나치게 책임지는 착한아이 콤플렉스입니다.'
    }
  ];

  // -------------------------------------------------------------
  // 11. GLOBAL API EXPORT
  // -------------------------------------------------------------
  const MyungsimDesignSystem = {
    version: 'myungsim-language-v1.0',
    principles: DESIGN_PRINCIPLES,
    terms: CORE_TERMS,
    codes: CODE_DESCRIPTIONS,
    scanFlow: SCAN_FLOW_DEFINITIONS,
    cta: CTA_DICTIONARY,
    safety: SAFETY_COPY_REGISTRY,
    privacy: PRIVACY_COPY,
    states: SYSTEM_STATES_COPY,
    forbiddenRules: FORBIDDEN_RULES,
    doDont: DO_DONT_EXAMPLES,

    /**
     * 텍스트가 금지어 규칙에 위배되는지 검사
     */
    checkForbiddenText: function(text) {
      if (!text || typeof text !== 'string') return [];
      const issues = [];
      FORBIDDEN_RULES.forEach(rule => {
        rule.patterns.forEach(p => {
          const reg = new RegExp(p, 'i');
          if (reg.test(text)) {
            issues.push({
              ruleId: rule.id,
              category: rule.category,
              pattern: p,
              replacement: rule.replacement
            });
          }
        });
      });
      return issues;
    }
  };

  window.MyungsimDesignSystem = MyungsimDesignSystem;

  // Node.js 환경 호환
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyungsimDesignSystem;
  }

})(typeof window !== 'undefined' ? window : global);
