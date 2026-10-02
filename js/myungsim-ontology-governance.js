/**
 * MyungSim Knowledge Graph QA & Ontology Governance Engine v1
 * ===================================================================
 * 개념이 늘어나도 의미가 중복·오염되지 않도록 10대 온톨로지 계층(Layer 1~10)과
 * canonical ontology, 5대 엄격 분리 원칙, 변경 거버넌스 및 Dry Run/Rollback을 고정하는 핵심 엔진.
 * 
 * [10대 온톨로지 계층]
 * Layer 1: CONTEXT (어디에서: 삶의 맥락)
 * Layer 2: SCENE / TRIGGER (어떤 장면 / 무엇이 시작 신호인가)
 * Layer 3: INTERPRETATION (어떤 생각·해석인가 / 무엇이 미확인인가)
 * Layer 4: INTERNAL SIGNAL (몸의 신호 / 정서 - 둘을 엄격 분리)
 * Layer 5: URGE (당장 무엇을 하고 싶은 충동인가)
 * Layer 6: BEHAVIOR (실제 일어난 구체적 행동)
 * Layer 7: RESULT / FUNCTION (행동의 결과 / 무의식적 보호 기능 vs 본래 강점 분리)
 * Layer 8: ALTERNATIVE ACTION (10% 다른 작은 행동 실험)
 * Layer 9: BOOK / CODE CONCEPT (4대 도서 및 3대 코드 도구)
 * Layer 10: SAFETY (안전 위기 네임스페이스)
 * 
 * [철칙]
 * 1. NO-AI Production Mode: 외부 AI 호출 0건 (Zero-Key).
 * 2. USER IDENTITY NODE 절대 금지 (IDENTITY-TYPE ONTOLOGY: DISABLED).
 * 3. 3대 코드 레벨화 금지 (DARK → NEURAL → ZERO LEVEL HIERARCHY: DISABLED).
 * 4. 인과 단정 언어 금지 (CAUSES 금지, CAN_TRIGGER 등 확률적 관계만 허용).
 * 5. Search Vocabulary 분리 (USER TERM → ALIAS → CANONICAL CONCEPT).
 */

(function(global) {
  'use strict';

  var ONTOLOGY_VERSION = 'myungsim-ontology-v1.0';

  // 1. 10대 온톨로지 계층 정의
  var ONTOLOGY_LAYERS = {
    LAYER_1_CONTEXT: {
      layer: 1,
      name: 'CONTEXT',
      description: '삶의 영역 및 상황적 배경',
      nodeTypes: ['CONTEXT'],
      allowedEdges: ['OCCURS_IN_CONTEXT']
    },
    LAYER_2_SCENE_TRIGGER: {
      layer: 2,
      name: 'SCENE_TRIGGER',
      description: '객관적 장면 및 외적/내적 촉발 신호',
      nodeTypes: ['SCENE', 'TRIGGER'],
      allowedEdges: ['HAS_SCENE', 'HAS_TRIGGER', 'OCCURS_IN_CONTEXT']
    },
    LAYER_3_INTERPRETATION: {
      layer: 3,
      name: 'INTERPRETATION',
      description: '주관적 해석·이야기 및 미확인 사실',
      nodeTypes: ['STORY', 'UNKNOWN', 'FACT'],
      allowedEdges: ['CAN_ACTIVATE_STORY', 'CAN_INCLUDE_UNKNOWN']
    },
    LAYER_4_INTERNAL_SIGNAL: {
      layer: 4,
      name: 'INTERNAL_SIGNAL',
      description: '몸의 생리적 신호와 정서 (서로 엄격 분리)',
      nodeTypes: ['BODY_SIGNAL', 'EMOTION'],
      allowedEdges: ['CAN_HAVE_BODY_SIGNAL', 'CAN_INCLUDE_EMOTION']
    },
    LAYER_5_URGE: {
      layer: 5,
      name: 'URGE',
      description: '즉각적인 행동 충동',
      nodeTypes: ['URGE'],
      allowedEdges: ['CAN_CREATE_URGE']
    },
    LAYER_6_BEHAVIOR: {
      layer: 6,
      name: 'BEHAVIOR',
      description: '실제 일어난 구체적 행동',
      nodeTypes: ['ACTION', 'ACTION_TYPE'],
      allowedEdges: ['URGE_CAN_LEAD_TO', 'ACTION_CAN_PRODUCE']
    },
    LAYER_7_RESULT_FUNCTION: {
      layer: 7,
      name: 'RESULT_FUNCTION',
      description: '단기 결과 및 무의식적 보호 기능과 강점',
      nodeTypes: ['RESULT', 'PROTECTION_FUNCTION', 'STRENGTH'],
      allowedEdges: ['CAN_PROTECT', 'CAN_OVERUSE_STRENGTH']
    },
    LAYER_8_ALTERNATIVE_ACTION: {
      layer: 8,
      name: 'ALTERNATIVE_ACTION',
      description: '10% 작고 다른 대안적 행동 실험',
      nodeTypes: ['TEN_PERCENT_ACTION'],
      allowedEdges: ['CAN_TRY_ACTION']
    },
    LAYER_9_BOOK_CODE_CONCEPT: {
      layer: 9,
      name: 'BOOK_CODE_CONCEPT',
      description: '4대 도서 및 3대 핵심 코드 기반 개념',
      nodeTypes: ['BOOK', 'BOOK_CONCEPT', 'CODE_CONCEPT'],
      allowedEdges: ['GROUNDED_IN_BOOK', 'GROUNDED_IN_CONCEPT', 'CONTRASTS_WITH']
    },
    LAYER_10_SAFETY: {
      layer: 10,
      name: 'SAFETY',
      description: '안전 위기 네임스페이스 및 긴급 개입',
      nodeTypes: ['SAFETY_TOPIC'],
      allowedEdges: ['SAFETY_ESCALATES_TO']
    }
  };

  // 노드 타입별 소속 계층 매핑
  var NODE_TYPE_TO_LAYER = {};
  Object.keys(ONTOLOGY_LAYERS).forEach(function(lKey) {
    var lObj = ONTOLOGY_LAYERS[lKey];
    lObj.nodeTypes.forEach(function(nt) {
      NODE_TYPE_TO_LAYER[nt] = lObj.layer;
    });
  });

  // 금지된 엣지 및 인과 단정 관계
  var FORBIDDEN_EDGES = [
    'LOWER_LEVEL_THAN',
    'LEVEL_UP_TO',
    'CAUSES',
    'RESULTS_IN_ALWAYS',
    'IDENTITY_LABEL',
    'DIAGNOSED_AS',
    'DEFINES_USER'
  ];

  // 2. Canonical Concepts 초기 시드 데이터 (10대 계층별 정규 노드)
  var CANONICAL_SEEDS = [
    // Layer 1: Context (7개)
    { id: 'CTX_ROMANTIC', type: 'CONTEXT', label: '연애·친밀', key: 'romantic', layer: 1 },
    { id: 'CTX_FAMILY', type: 'CONTEXT', label: '가족·원가족', key: 'family', layer: 1 },
    { id: 'CTX_WORK', type: 'CONTEXT', label: '직장·일', key: 'work', layer: 1 },
    { id: 'CTX_MONEY', type: 'CONTEXT', label: '돈·재정', key: 'money', layer: 1 },
    { id: 'CTX_FRIENDSHIP', type: 'CONTEXT', label: '친구·동료', key: 'friendship', layer: 1 },
    { id: 'CTX_DECISION', type: 'CONTEXT', label: '선택·결정', key: 'decision', layer: 1 },
    { id: 'CTX_BELIEF_FATE', type: 'CONTEXT', label: '믿음·사주·운명', key: 'belief_fate', layer: 1 },

    // Layer 2: Scene / Trigger
    { id: 'SCENE_REPLY_DELAYED', type: 'SCENE', label: '답장 지연 장면', key: 'scene_reply_delayed', layer: 2 },
    { id: 'SCENE_FAMILY_MEETING', type: 'SCENE', label: '가족 대화 장면', key: 'scene_family_meeting', layer: 2 },
    { id: 'SCENE_OFFICE_WORK', type: 'SCENE', label: '직장 업무 장면', key: 'scene_office_work', layer: 2 },
    { id: 'TRIG_MESSAGE_NO_REPLY', type: 'TRIGGER', label: '메시지 무응답', key: 'message_no_reply', layer: 2 },
    { id: 'TRIG_MOTHER_REQUEST', type: 'TRIGGER', label: '어머니의 부탁', key: 'mother_request', layer: 2 },
    { id: 'TRIG_FORTUNE_WARNING', type: 'TRIGGER', label: '불길한 점괘/삼재 경고', key: 'fortune_warning_heard', layer: 2 },
    { id: 'TRIG_CRITICISM_HEARD', type: 'TRIGGER', label: '비판을 들음', key: 'criticism_heard', layer: 2 },

    // Layer 3: Interpretation (Story / Fact / Unknown)
    { id: 'FACT_CONTRACT_CANCELLED', type: 'FACT', label: '계약 취소 통보받음 (객관 사실)', key: 'contract_cancelled', layer: 3 },
    { id: 'STORY_RELATIONSHIP_ENDING', type: 'STORY', label: '마음이 식었다/관계가 끝났다', key: 'relationship_is_ending', layer: 3 },
    { id: 'STORY_BAD_CHILD', type: 'STORY', label: '나는 나쁜 자식이다', key: 'bad_child_self_judgment', layer: 3 },
    { id: 'STORY_BAD_PERIOD_DANGER', type: 'STORY', label: '운이 안 좋은 시기라 망할 것이다', key: 'bad_period_means_dangerous', layer: 3 },
    { id: 'STORY_GLOBAL_FAILURE', type: 'STORY', label: '나는 원래 실패자다', key: 'global_failure_story', layer: 3 },
    { id: 'UNK_OTHER_INTENTION', type: 'UNKNOWN', label: '상대방의 진짜 의도 (미확인)', key: 'other_intention_unknown', layer: 3 },

    // Layer 4: Internal Signal (Body Signal vs Emotion 분리)
    { id: 'BODY_CHEST_DROP', type: 'BODY_SIGNAL', label: '가슴 철렁/내려앉음', key: 'chest_drop', layer: 4 },
    { id: 'BODY_BREATH_SHALLOW', type: 'BODY_SIGNAL', label: '호흡 얕아짐', key: 'breath_shallow', layer: 4 },
    { id: 'BODY_MUSCLE_TENSE', type: 'BODY_SIGNAL', label: '어깨/목 긴장', key: 'muscle_tense', layer: 4 },
    { id: 'EMO_FEAR', type: 'EMOTION', label: '두려움/공포', key: 'fear', layer: 4 },
    { id: 'EMO_ANXIETY', type: 'EMOTION', label: '불안/초조', key: 'anxiety', layer: 4 },
    { id: 'EMO_GUILT', type: 'EMOTION', label: '죄책감/미안함', key: 'guilt', layer: 4 },
    { id: 'EMO_SADNESS', type: 'EMOTION', label: '슬픔/무기력', key: 'sadness', layer: 4 },

    // Layer 5: Urge
    { id: 'URGE_CHECK', type: 'URGE', label: '계속 확인하고 싶은 충동', key: 'urge_to_check', layer: 5 },
    { id: 'URGE_APOLOGIZE', type: 'URGE', label: '즉시 사과하고 싶은 충동', key: 'urge_to_apologize', layer: 5 },
    { id: 'URGE_ESCAPE', type: 'URGE', label: '도망치고 싶은 충동', key: 'urge_to_escape', layer: 5 },
    { id: 'URGE_FREEZE', type: 'URGE', label: '아무것도 하지 않고 얼어붙는 충동', key: 'urge_to_freeze', layer: 5 },
    { id: 'URGE_QUIT', type: 'URGE', label: '당장 그만두고 싶은 충동', key: 'urge_to_quit', layer: 5 },

    // Layer 6: Behavior (Action)
    { id: 'ACT_PHONE_CHECK', type: 'ACTION', label: '스마트폰 계속 열어보기', key: 'action_phone_check', layer: 6 },
    { id: 'ACT_QUIT_JOB', type: 'ACTION', label: '실제 사직서 제출/퇴사', key: 'action_quit_job', layer: 6 },
    { id: 'ACT_AUTOMATIC_YES', type: 'ACTION', label: '생각해볼 틈 없이 바로 수락함', key: 'action_automatic_yes', layer: 6 },
    { id: 'ACT_BLOCK_CONTACT', type: 'ACTION', label: '연락처 차단하기', key: 'action_block_contact', layer: 6 },

    // Layer 7: Result / Function
    { id: 'RES_TEMPORARY_RELIEF', type: 'RESULT', label: '일시적 안도감 (단기)', key: 'temporary_relief', layer: 7 },
    { id: 'RES_REGRET_LATER', type: 'RESULT', label: '나중에 후회/자책 (장기)', key: 'regret_later', layer: 7 },
    { id: 'PROT_AVOID_CONFLICT', type: 'PROTECTION_FUNCTION', label: '갈등과 거절 회피를 통한 관계 보호', key: 'avoid_conflict', layer: 7 },
    { id: 'STR_CARE_FOR_OTHERS', type: 'STRENGTH', label: '타인에 대한 깊은 배려와 책임감', key: 'care_for_others', layer: 7 },
    { id: 'STR_PRUDENCE', type: 'STRENGTH', label: '신중함과 리스크 민감도', key: 'prudence', layer: 7 },

    // Layer 8: Alternative Action (10% Action)
    { id: 'ACT10_PAUSE_10SEC', type: 'TEN_PERCENT_ACTION', label: '폰 열기 전 10초 멈추기', key: 'pause_10sec', layer: 8 },
    { id: 'ACT10_WRITE_FACT_STORY', type: 'TEN_PERCENT_ACTION', label: '사실과 생각을 종이에 한 줄씩 적기', key: 'write_fact_story', layer: 8 },
    { id: 'ACT10_POSTPONE_DECISION', type: 'TEN_PERCENT_ACTION', label: '결정 하루 미루기 (10% 간격두기)', key: 'postpone_decision', layer: 8 },

    // Layer 9: Book / Code Concept
    { id: 'BOOK_DARK_CODE', type: 'BOOK', label: '다크 코드', key: 'dark_code', layer: 9 },
    { id: 'BOOK_NEURAL_CODE', type: 'BOOK', label: '뉴럴 코드', key: 'neural_code', layer: 9 },
    { id: 'BOOK_ZERO_POINT', type: 'BOOK', label: '제로 포인트', key: 'zero_point', layer: 9 },
    { id: 'BOOK_BELIEVE_NOT_TRAPPED', type: 'BOOK', label: '나는 믿는다 그러나 갇히지 않는다', key: 'believe_not_trapped', layer: 9 },
    { id: 'CODE_DARK', type: 'CODE_CONCEPT', label: 'Dark Code', description: '자동 반응 경로 관찰', layer: 9 },
    { id: 'CODE_NEURAL', type: 'CODE_CONCEPT', label: 'Neural Code', description: '작은 새로운 행동 경험 생성', layer: 9 },
    { id: 'CODE_ZERO_POINT', type: 'CODE_CONCEPT', label: 'Zero Point', description: '반응과 행동 사이 선택공간 확보', layer: 9 },
    { id: 'BC_FACT_STORY_UNKNOWN', type: 'BOOK_CONCEPT', label: 'FACT·STORY·UNKNOWN 구분', key: 'fact_story_unknown', layer: 9 },
    { id: 'BC_CHOICE_SPACE', type: 'BOOK_CONCEPT', label: '선택공간', key: 'choice_space', layer: 9 },
    { id: 'BC_EXPECTED_ACTUAL', type: 'BOOK_CONCEPT', label: 'EXPECTED vs ACTUAL', key: 'expected_actual', layer: 9 },

    // Layer 10: Safety
    { id: 'SAFETY_CRISIS', type: 'SAFETY_TOPIC', label: '자해·자살 위기', key: 'safety.self_harm', layer: 10 },
    { id: 'SAFETY_VIOLENCE', type: 'SAFETY_TOPIC', label: '신체 폭력·학대', key: 'safety.violence', layer: 10 },
    { id: 'SAFETY_STALKING', type: 'SAFETY_TOPIC', label: '스토킹·강압', key: 'safety.stalking', layer: 10 },
    { id: 'SAFETY_FINANCIAL', type: 'SAFETY_TOPIC', label: '전재산 몰빵·파산 위기', key: 'safety.financial', layer: 10 }
  ];

  // 3. User Search Aliases (사용자 일상어 -> Canonical Concept 매핑 사전)
  // 온톨로지 노드를 오염시키지 않고 순수 검색 어휘로 격리 관리
  var USER_SEARCH_ALIASES = [
    { alias: '카톡 안봄', targetId: 'TRIG_MESSAGE_NO_REPLY', confidence: 0.95 },
    { alias: '읽씹', targetId: 'TRIG_MESSAGE_NO_REPLY', confidence: 0.95 },
    { alias: '안읽씹', targetId: 'TRIG_MESSAGE_NO_REPLY', confidence: 0.95 },
    { alias: '답장 안와', targetId: 'TRIG_MESSAGE_NO_REPLY', confidence: 0.95 },
    { alias: '연락 두절', targetId: 'TRIG_MESSAGE_NO_REPLY', confidence: 0.90 },
    { alias: '마음 식었나', targetId: 'STORY_RELATIONSHIP_ENDING', confidence: 0.95 },
    { alias: '끝난 건가', targetId: 'STORY_RELATIONSHIP_ENDING', confidence: 0.90 },
    { alias: '가슴 철렁', targetId: 'BODY_CHEST_DROP', confidence: 0.98 },
    { alias: '심장 쿵', targetId: 'BODY_CHEST_DROP', confidence: 0.95 },
    { alias: '숨막혀', targetId: 'BODY_BREATH_SHALLOW', confidence: 0.92 },
    { alias: '무서워', targetId: 'EMO_FEAR', confidence: 0.98 },
    { alias: '겁나', targetId: 'EMO_FEAR', confidence: 0.95 },
    { alias: '불안해', targetId: 'EMO_ANXIETY', confidence: 0.98 },
    { alias: '초조해', targetId: 'EMO_ANXIETY', confidence: 0.95 },
    { alias: '확인하고 싶어', targetId: 'URGE_CHECK', confidence: 0.98 },
    { alias: '연락해보고 싶어', targetId: 'URGE_CHECK', confidence: 0.90 },
    { alias: '폰 뒤적', targetId: 'ACT_PHONE_CHECK', confidence: 0.95 },
    { alias: '폰 계속 봄', targetId: 'ACT_PHONE_CHECK', confidence: 0.98 },
    { alias: '나쁜 딸', targetId: 'STORY_BAD_CHILD', confidence: 0.98 },
    { alias: '불효녀', targetId: 'STORY_BAD_CHILD', confidence: 0.95 },
    { alias: '엄마 부탁', targetId: 'TRIG_MOTHER_REQUEST', confidence: 0.98 },
    { alias: '삼재', targetId: 'TRIG_FORTUNE_WARNING', confidence: 0.98 },
    { alias: '사주 불길', targetId: 'TRIG_FORTUNE_WARNING', confidence: 0.95 },
    { alias: '때렸어요', targetId: 'SAFETY_VIOLENCE', confidence: 1.0 },
    { alias: '맞았어요', targetId: 'SAFETY_VIOLENCE', confidence: 1.0 },
    { alias: '폭행', targetId: 'SAFETY_VIOLENCE', confidence: 1.0 },
    { alias: '퇴사하고 싶어', targetId: 'URGE_QUIT', confidence: 0.98 },
    { alias: '때려치고 싶다', targetId: 'URGE_QUIT', confidence: 0.95 },
    { alias: '퇴사했어', targetId: 'ACT_QUIT_JOB', confidence: 0.98 },
    { alias: '사표 냈어', targetId: 'ACT_QUIT_JOB', confidence: 0.98 },
    { alias: '원래 실패자', targetId: 'STORY_GLOBAL_FAILURE', confidence: 0.98 },
    { alias: '계약 취소', targetId: 'FACT_CONTRACT_CANCELLED', confidence: 0.98 }
  ];

  // 4. Governance Core Engine 객체
  var MyungSimOntologyGovernance = {
    version: ONTOLOGY_VERSION,
    layers: ONTOLOGY_LAYERS,
    nodeTypeToLayer: NODE_TYPE_TO_LAYER,
    forbiddenEdges: FORBIDDEN_EDGES,

    concepts: {}, // id -> Canonical Concept
    aliases: [], // Search Vocabulary List
    changeLog: [], // 변경 이력
    snapshots: {}, // id -> Snapshot object

    init: function() {
      var self = this;
      this.concepts = {};
      this.aliases = [];
      this.changeLog = [];
      this.snapshots = {};

      // Seed Canonical Concepts
      CANONICAL_SEEDS.forEach(function(c) {
        self.concepts[c.id] = Object.assign({}, c, {
          createdAt: '2026-09-23T00:00:00Z',
          updatedAt: '2026-09-23T00:00:00Z',
          status: 'ACTIVE'
        });
      });

      // Seed Aliases
      this.aliases = USER_SEARCH_ALIASES.slice();

      // 초기 스냅샷 생성
      this.createSnapshot('v1.0-baseline', '온톨로지 기본 베이스라인 스냅샷');
      return true;
    },

    // 5대 엄격 분리 원칙 검사 (Separation Principles)
    validateSeparationPrinciples: function(conceptA, conceptB) {
      if (!conceptA || !conceptB) return { valid: false, reason: 'INVALID_CONCEPTS' };

      // 1. Body != Emotion
      var isBodyA = conceptA.type === 'BODY_SIGNAL';
      var isBodyB = conceptB.type === 'BODY_SIGNAL';
      var isEmoA = conceptA.type === 'EMOTION';
      var isEmoB = conceptB.type === 'EMOTION';
      if ((isBodyA && isEmoB) || (isEmoA && isBodyB)) {
        return {
          valid: false,
          violation: 'BODY_EMOTION_COLLAPSE',
          message: '몸의 생리적 신호(BODY_SIGNAL)와 정서(EMOTION)는 엄격히 분리되어야 합니다.'
        };
      }

      // 2. Urge != Action
      var isUrgeA = conceptA.type === 'URGE';
      var isUrgeB = conceptB.type === 'URGE';
      var isActionA = conceptA.type === 'ACTION' || conceptA.type === 'ACTION_TYPE';
      var isActionB = conceptB.type === 'ACTION' || conceptB.type === 'ACTION_TYPE';
      if ((isUrgeA && isActionB) || (isActionA && isUrgeB)) {
        return {
          valid: false,
          violation: 'URGE_ACTION_COLLAPSE',
          message: '행동 충동(URGE)과 실제 일어난 행동(ACTION)은 엄격히 분리되어야 합니다.'
        };
      }

      // 3. Scene != Trigger
      var isSceneA = conceptA.type === 'SCENE';
      var isSceneB = conceptB.type === 'SCENE';
      var isTrigA = conceptA.type === 'TRIGGER';
      var isTrigB = conceptB.type === 'TRIGGER';
      if ((isSceneA && isTrigB) || (isTrigA && isSceneB)) {
        return {
          valid: false,
          violation: 'SCENE_TRIGGER_COLLAPSE',
          message: '상황 장면(SCENE)과 촉발 인자(TRIGGER)는 엄격히 분리되어야 합니다.'
        };
      }

      // 4. Story != Fact
      var isStoryA = conceptA.type === 'STORY';
      var isStoryB = conceptB.type === 'STORY';
      var isFactA = conceptA.type === 'FACT';
      var isFactB = conceptB.type === 'FACT';
      if ((isStoryA && isFactB) || (isFactA && isStoryB)) {
        return {
          valid: false,
          violation: 'STORY_FACT_COLLAPSE',
          message: '주관적 해석/이야기(STORY)와 객관적 현실 사실(FACT)은 엄격히 분리되어야 합니다.'
        };
      }

      // 5. Function != Strength
      var isFuncA = conceptA.type === 'PROTECTION_FUNCTION';
      var isFuncB = conceptB.type === 'PROTECTION_FUNCTION';
      var isStrA = conceptA.type === 'STRENGTH';
      var isStrB = conceptB.type === 'STRENGTH';
      if ((isFuncA && isStrB) || (isStrA && isFuncB)) {
        return {
          valid: false,
          violation: 'FUNCTION_STRENGTH_COLLAPSE',
          message: '무의식적 보호 기능(PROTECTION_FUNCTION)과 본래 강점(STRENGTH)은 엄격히 분리되어야 합니다.'
        };
      }

      return { valid: true };
    },

    // 금지된 엣지 및 인과 단정 관계 검사
    validateEdgeProposal: function(fromType, toType, edgeType) {
      if (FORBIDDEN_EDGES.indexOf(edgeType) !== -1) {
        return {
          valid: false,
          reason: 'FORBIDDEN_EDGE_TYPE',
          message: '금지된 엣지 타입입니다: ' + edgeType + ' (서열화/인과단정/정체성 라벨 금지)'
        };
      }

      // 코드 레벨화 시도 차단
      if (fromType === 'CODE_CONCEPT' && toType === 'CODE_CONCEPT') {
        if (edgeType === 'LOWER_LEVEL_THAN' || edgeType === 'HIGHER_LEVEL_THAN' || edgeType === 'LEVEL_UP_TO') {
          return {
            valid: false,
            reason: 'CODE_LEVELING_FORBIDDEN',
            message: '3대 코드 간의 우열/성숙도 서열화는 엄격히 금지됩니다.'
          };
        }
      }

      // 정체성 라벨화 차단
      if (toType === 'USER' || toType === 'IDENTITY' || edgeType === 'DEFINES_USER') {
        return {
          valid: false,
          reason: 'USER_IDENTITY_PROFILING_FORBIDDEN',
          message: '사용자 정체성 분류/프로파일링 온톨로지는 생성할 수 없습니다.'
        };
      }

      return { valid: true };
    },

    // 6대 질문 검증 및 개념 병합(Merge) Dry Run
    dryRunMerge: function(sourceId, targetId, answersTo6Questions, kgInstance) {
      var src = this.concepts[sourceId];
      var tgt = this.concepts[targetId];

      if (!src || !tgt) {
        return { canMerge: false, error: '존재하지 않는 개념 노드입니다.' };
      }

      // 1. 5대 분리 원칙 위반 여부 점검
      var sepCheck = this.validateSeparationPrinciples(src, tgt);
      if (!sepCheck.valid) {
        return {
          canMerge: false,
          error: sepCheck.message,
          violation: sepCheck.violation
        };
      }

      // 2. 다른 레이어 간 병합 시도 차단
      if (src.layer !== tgt.layer) {
        return {
          canMerge: false,
          error: '서로 다른 온톨로지 계층(Layer ' + src.layer + ' vs Layer ' + tgt.layer + ')은 병합할 수 없습니다.',
          violation: 'CROSS_LAYER_MERGE_FORBIDDEN'
        };
      }

      // 3. 6대 질문 전수 확인
      var questions = [
        '같은 장면(Scene)인가?',
        '같은 촉발 신호(Trigger)인가?',
        '같은 머릿속 이야기(Story)인가?',
        '같은 즉각적 충동(Urge)인가?',
        '같은 구체적 행동(Action)인가?',
        'Router 관점에서 상호 교환 가능한가?'
      ];

      var failedQuestions = [];
      if (answersTo6Questions && Array.isArray(answersTo6Questions)) {
        answersTo6Questions.forEach(function(ans, idx) {
          if (!ans) failedQuestions.push(questions[idx] || ('질문 ' + (idx + 1)));
        });
      }

      // 영향도 산출 (카드 수, 엣지 수, 회귀 테스트 영향)
      var affectedCards = 0;
      var affectedEdges = 0;
      if (kgInstance) {
        var edges = kgInstance.edges || {};
        Object.keys(edges).forEach(function(eid) {
          var e = edges[eid];
          if (e.from === sourceId || e.to === sourceId) {
            affectedEdges++;
            if (e.from.indexOf('CARD_') === 0) affectedCards++;
          }
        });
      }

      var canMerge = failedQuestions.length === 0;

      return {
        canMerge: canMerge,
        sourceId: sourceId,
        targetId: targetId,
        affectedCards: affectedCards,
        affectedEdges: affectedEdges,
        failedQuestions: failedQuestions,
        warnings: canMerge ? [] : ['6대 검증 질문 중 불일치 항목이 있어 병합이 반려됩니다.'],
        dryRunStatus: canMerge ? 'APPROVED_FOR_MERGE' : 'REJECTED_BY_GOVERNANCE'
      };
    },

    // 실제 개념 병합 수행 (Merge)
    mergeConcepts: function(sourceId, targetId, answersTo6Questions, kgInstance) {
      var dryRun = this.dryRunMerge(sourceId, targetId, answersTo6Questions, kgInstance);
      if (!dryRun.canMerge) {
        throw new Error('MERGE_REJECTED: ' + (dryRun.error || dryRun.warnings.join(', ')));
      }

      // 스냅샷 자동 생성 후 병합
      this.createSnapshot('pre-merge-' + sourceId + '-to-' + targetId, '개념 병합 전 안전 스냅샷');

      // 1. 소스 노드 별칭(Alias)으로 전환
      var src = this.concepts[sourceId];
      this.aliases.push({
        alias: src.label,
        targetId: targetId,
        confidence: 0.95,
        note: 'MERGED_FROM_' + sourceId
      });

      // 2. 소스 노드 상태 DEPRECATED 처리
      src.status = 'DEPRECATED';
      src.mergedInto = targetId;
      src.updatedAt = new Date().toISOString();

      // 3. 지식 그래프 인스턴스 엣지 재배선 (Re-wire)
      if (kgInstance) {
        var edges = kgInstance.edges || {};
        Object.keys(edges).forEach(function(eid) {
          var e = edges[eid];
          if (e.from === sourceId) e.from = targetId;
          if (e.to === sourceId) e.to = targetId;
        });
      }

      // 변경 로그 기록
      this.changeLog.push({
        action: 'MERGE_CONCEPT',
        sourceId: sourceId,
        targetId: targetId,
        timestamp: new Date().toISOString()
      });

      return { success: true, targetId: targetId };
    },

    // 개념 분할 Dry Run (Split)
    dryRunSplit: function(conceptId, newConcepts) {
      var target = this.concepts[conceptId];
      if (!target) return { canSplit: false, error: '개념을 찾을 수 없습니다.' };
      if (!Array.isArray(newConcepts) || newConcepts.length < 2) {
        return { canSplit: false, error: '분할 시 최소 2개 이상의 세부 정규 개념이 필요합니다.' };
      }

      return {
        canSplit: true,
        conceptId: conceptId,
        originalLabel: target.label,
        newConceptsCount: newConcepts.length,
        status: 'READY_TO_SPLIT'
      };
    },

    // 실제 개념 분할 수행 (Split)
    splitConcept: function(conceptId, newConcepts) {
      var dry = this.dryRunSplit(conceptId, newConcepts);
      if (!dry.canSplit) throw new Error(dry.error);

      var self = this;
      this.createSnapshot('pre-split-' + conceptId, '개념 분할 전 안전 스냅샷');

      newConcepts.forEach(function(nc) {
        self.concepts[nc.id] = Object.assign({}, nc, {
          createdAt: new Date().toISOString(),
          status: 'ACTIVE'
        });
      });

      var target = this.concepts[conceptId];
      target.status = 'SPLIT';
      target.updatedAt = new Date().toISOString();

      this.changeLog.push({
        action: 'SPLIT_CONCEPT',
        conceptId: conceptId,
        newConceptIds: newConcepts.map(function(c) { return c.id; }),
        timestamp: new Date().toISOString()
      });

      return { success: true };
    },

    // 스냅샷 생성
    createSnapshot: function(label, description) {
      var id = 'SNAP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      this.snapshots[id] = {
        id: id,
        label: label,
        description: description || '',
        createdAt: new Date().toISOString(),
        conceptsCount: Object.keys(this.concepts).length,
        conceptsData: JSON.parse(JSON.stringify(this.concepts)),
        aliasesData: JSON.parse(JSON.stringify(this.aliases))
      };
      return id;
    },

    // 롤백 (Rollback)
    rollback: function(snapshotId) {
      var snap = this.snapshots[snapshotId];
      if (!snap) throw new Error('SNAPSHOT_NOT_FOUND: ' + snapshotId);

      this.concepts = JSON.parse(JSON.stringify(snap.conceptsData));
      this.aliases = JSON.parse(JSON.stringify(snap.aliasesData));

      this.changeLog.push({
        action: 'ROLLBACK',
        snapshotId: snapshotId,
        timestamp: new Date().toISOString()
      });

      return { success: true, restoredConceptsCount: Object.keys(this.concepts).length };
    },

    // 온톨로지 품질 및 무결성 QA 검사기
    runQualityAudit: function(kgInstance) {
      var self = this;
      var duplicateCandidates = [];
      var overconnectedConcepts = [];
      var underdefinedConcepts = [];
      var invalidEdges = [];
      var identityLanguageIssues = [];
      var causalOverreachIssues = [];
      var codeLevelingIssues = [];
      var bookGroundingIssues = [];
      var safetyOntologyIssues = [];

      var conceptKeys = Object.keys(this.concepts);

      // 1. 잠재 중복 후보 검출 (동일 계층 내 라벨 유사도)
      for (var i = 0; i < conceptKeys.length; i++) {
        for (var j = i + 1; j < conceptKeys.length; j++) {
          var a = self.concepts[conceptKeys[i]];
          var b = self.concepts[conceptKeys[j]];
          if (a.layer === b.layer && a.status === 'ACTIVE' && b.status === 'ACTIVE') {
            if (a.label === b.label || (a.key && a.key === b.key)) {
              duplicateCandidates.push({ idA: a.id, idB: b.id, label: a.label, layer: a.layer });
            }
          }
        }
      }

      // 2. Overconnected / Underdefined 점검 (kgInstance 활용)
      if (kgInstance && kgInstance.nodes) {
        Object.keys(kgInstance.nodes).forEach(function(nid) {
          var n = kgInstance.nodes[nid];
          var outEdges = kgInstance.adjacency[nid] || [];
          var inEdges = kgInstance.reverseAdjacency[nid] || [];
          var degree = outEdges.length + inEdges.length;

          // Overconnected (의미가 흐려진 25개 이상 노드)
          if (degree >= 25 && n.type !== 'BOOK' && n.type !== 'PACK') {
            overconnectedConcepts.push({ id: nid, degree: degree, type: n.type });
          }

          // Underdefined (연결이 1개 이하로 고립된 노드)
          if (degree <= 1 && n.type !== 'CATEGORY') {
            underdefinedConcepts.push({ id: nid, degree: degree, type: n.type });
          }

          // Identity Language 검사
          if (n.label && (n.label.indexOf('불안형') !== -1 || n.label.indexOf('회피형') !== -1 || n.label.indexOf('환자') !== -1)) {
            identityLanguageIssues.push({ id: nid, label: n.label });
          }
        });

        // 3. Invalid Edges / Causal Overreach / Code Leveling 점검
        Object.keys(kgInstance.edges || {}).forEach(function(eid) {
          var e = kgInstance.edges[eid];
          if (FORBIDDEN_EDGES.indexOf(e.type) !== -1) {
            invalidEdges.push({ edgeId: eid, type: e.type });
          }
          if (e.type === 'CAUSES' || e.type === 'RESULTS_IN_ALWAYS') {
            causalOverreachIssues.push({ edgeId: eid, type: e.type });
          }
          if (e.type === 'LOWER_LEVEL_THAN' || e.type === 'LEVEL_UP_TO') {
            codeLevelingIssues.push({ edgeId: eid, type: e.type });
          }
        });
      }

      return {
        timestamp: new Date().toISOString(),
        totalConcepts: Object.keys(this.concepts).length,
        totalAliases: this.aliases.length,
        duplicateCandidates: duplicateCandidates,
        overconnectedConcepts: overconnectedConcepts,
        underdefinedConcepts: underdefinedConcepts,
        invalidEdges: invalidEdges,
        identityLanguageIssues: identityLanguageIssues,
        causalOverreachIssues: causalOverreachIssues,
        codeLevelingIssues: codeLevelingIssues,
        bookGroundingIssues: bookGroundingIssues,
        safetyOntologyIssues: safetyOntologyIssues,
        isClean: invalidEdges.length === 0 && identityLanguageIssues.length === 0 && codeLevelingIssues.length === 0
      };
    },

    // 5. 15대 Synthetic 자연어 매핑 파서 (비약 추론 차단 & Safety 가로채기)
    mapUserInputToOntology: function(userText) {
      if (!userText || typeof userText !== 'string') {
        return { mappedLayers: {}, candidates: [], safetyIntercepted: false };
      }

      var text = userText.trim();
      var mappedLayers = {
        context: null,
        scene: null,
        trigger: null,
        story: null,
        fact: null,
        bodySignal: null,
        emotion: null,
        urge: null,
        action: null,
        safety: null
      };

      var unsupportedInferencesBlocked = [];
      var safetyIntercepted = false;

      // =========================================================================
      // [Test 11 & Safety First] 신체 폭력, 자해 등 위기 감지 시 최우선 가로채기
      // =========================================================================
      if (text.indexOf('때렸') !== -1 || text.indexOf('맞았') !== -1 || text.indexOf('폭행') !== -1 || text.indexOf('폭력') !== -1) {
        mappedLayers.safety = this.concepts['SAFETY_VIOLENCE'];
        safetyIntercepted = true;
        return {
          mappedLayers: mappedLayers,
          safetyIntercepted: true,
          unsupportedInferencesBlocked: unsupportedInferencesBlocked,
          message: 'SAFETY_INTERCEPT: 신체 폭력·위기 감지됨. 일반 카드 추천을 즉각 중단하고 안전 개입을 활성화합니다.'
        };
      }

      // =========================================================================
      // [Test 1] "카톡이 안 와요" -> message_no_reply (relationship_is_ending 자동 추론 금지)
      // [Test 2] "카톡이 안 와서 마음이 식었나 싶어요" -> message_no_reply + relationship_is_ending
      // =========================================================================
      if (text.indexOf('카톡') !== -1 && (text.indexOf('안 와') !== -1 || text.indexOf('안봄') !== -1 || text.indexOf('읽씹') !== -1)) {
        mappedLayers.trigger = this.concepts['TRIG_MESSAGE_NO_REPLY'];
        mappedLayers.scene = this.concepts['SCENE_REPLY_DELAYED'];

        // 마음이 식었다는 명시적 해석이 있는지 확인
        if (text.indexOf('마음이 식었') !== -1 || text.indexOf('끝났') !== -1) {
          mappedLayers.story = this.concepts['STORY_RELATIONSHIP_ENDING'];
        } else {
          // Negative Guard: 입력에 없는 관계 단절/불안 억지 추론 차단
          unsupportedInferencesBlocked.push('STORY: relationship_is_ending (입력에 없는 비약적 추론 차단)');
          unsupportedInferencesBlocked.push('EMOTION: anxiety (신호만으로 감정 단정 금지)');
        }
      }

      // =========================================================================
      // [Test 3] "가슴이 철렁했어요" -> BODY_SIGNAL (anxiety 자동 추론 금지)
      // [Test 4] "무서워요" -> EMOTION fear (BODY 아님)
      // =========================================================================
      if (text.indexOf('가슴이 철렁') !== -1 || text.indexOf('심장이 쿵') !== -1) {
        mappedLayers.bodySignal = this.concepts['BODY_CHEST_DROP'];
        // Negative Guard: 생리적 감각만으로 불안(Emotion) 자동 추론 금지
        unsupportedInferencesBlocked.push('EMOTION: anxiety (신체 감각을 정서로 성급하게 변환 금지)');
      }

      if (text.indexOf('무서워') !== -1 || text.indexOf('겁나') !== -1) {
        mappedLayers.emotion = this.concepts['EMO_FEAR'];
        // Negative Guard: 정서를 신체 감각과 혼동하지 않음
      }

      if (text.indexOf('불안해') !== -1 || text.indexOf('초조해') !== -1) {
        mappedLayers.emotion = this.concepts['EMO_ANXIETY'];
      }

      // =========================================================================
      // [Test 5] "계속 확인하고 싶어요" -> URGE check (ACTION phone_check 아님)
      // [Test 6] "계속 폰을 열어봤어요" -> ACTION phone_check (URGE 아님)
      // =========================================================================
      if (text.indexOf('확인하고 싶') !== -1 || text.indexOf('연락해보고 싶') !== -1) {
        mappedLayers.urge = this.concepts['URGE_CHECK'];
        unsupportedInferencesBlocked.push('ACTION: action_phone_check (충동을 실제 일어난 행동으로 단정 금지)');
      }

      if (text.indexOf('폰을 열어봤') !== -1 || text.indexOf('폰 계속 봤') !== -1 || text.indexOf('확인했') !== -1) {
        if (text.indexOf('싶') === -1) {
          mappedLayers.action = this.concepts['ACT_PHONE_CHECK'];
        }
      }

      // =========================================================================
      // [Test 7] "제가 나쁜 딸 같아요" -> STORY bad_child_self_judgment (정체성 라벨 배제)
      // =========================================================================
      if (text.indexOf('나쁜 딸') !== -1 || text.indexOf('불효녀') !== -1) {
        mappedLayers.story = this.concepts['STORY_BAD_CHILD'];
        mappedLayers.context = this.concepts['CTX_FAMILY'];
        unsupportedInferencesBlocked.push('IDENTITY_NODE: bad_daughter_type (사용자 정체성 라벨링 절대 배제)');
      }

      // =========================================================================
      // [Test 8] "엄마가 부탁했어요" -> Scene/Trigger (guilt, automatic_yes 억지 추론 금지)
      // =========================================================================
      if (text.indexOf('엄마가 부탁') !== -1 || text.indexOf('어머니가 부탁') !== -1) {
        mappedLayers.scene = this.concepts['SCENE_FAMILY_MEETING'];
        mappedLayers.trigger = this.concepts['TRIG_MOTHER_REQUEST'];
        mappedLayers.context = this.concepts['CTX_FAMILY'];
        unsupportedInferencesBlocked.push('EMOTION: guilt (부탁 사실만으로 죄책감 억지 추론 금지)');
        unsupportedInferencesBlocked.push('ACTION: action_automatic_yes (승낙 여부 미확인 행동 추론 금지)');
      }

      // =========================================================================
      // [Test 9] "삼재래요" -> belief_fate, fortune_warning_heard (bad_event 억지 추론 금지)
      // [Test 10] "삼재라서 아무것도 하면 안 될 것 같아요" -> warning + bad_period + freeze
      // =========================================================================
      if (text.indexOf('삼재') !== -1 || text.indexOf('사주') !== -1) {
        mappedLayers.context = this.concepts['CTX_BELIEF_FATE'];
        mappedLayers.trigger = this.concepts['TRIG_FORTUNE_WARNING'];

        if (text.indexOf('아무것도 하면 안 될 것 같') !== -1 || text.indexOf('망할 것 같') !== -1) {
          mappedLayers.story = this.concepts['STORY_BAD_PERIOD_DANGER'];
          mappedLayers.urge = this.concepts['URGE_FREEZE'];
        } else {
          unsupportedInferencesBlocked.push('FACT: bad_event_occurred (점괘를 실제 현실 사고로 비약 금지)');
          unsupportedInferencesBlocked.push('URGE: freeze (불길한 말만 듣고 마비 충동 단정 금지)');
        }
      }

      // =========================================================================
      // [Test 12] "퇴사하고 싶어요" -> URGE quit (burnout, bad boss 억지 추론 금지)
      // [Test 13] "오늘 퇴사했어요" -> ACTION quit_job (URGE 아님)
      // =========================================================================
      if (text.indexOf('퇴사하고 싶') !== -1 || text.indexOf('그만두고 싶') !== -1) {
        mappedLayers.context = this.concepts['CTX_WORK'];
        mappedLayers.urge = this.concepts['URGE_QUIT'];
        unsupportedInferencesBlocked.push('STORY: toxic_boss (입력에 없는 상사 괴롭힘 억지 추론 금지)');
        unsupportedInferencesBlocked.push('ACTION: action_quit_job (퇴사 충동을 실제 퇴사로 단정 금지)');
      }

      if (text.indexOf('퇴사했') !== -1 || text.indexOf('사표 냈') !== -1) {
        mappedLayers.context = this.concepts['CTX_WORK'];
        mappedLayers.action = this.concepts['ACT_QUIT_JOB'];
      }

      // =========================================================================
      // [Test 14] "나는 원래 실패자야" -> Story/global self judgment (identity label 배제)
      // =========================================================================
      if (text.indexOf('원래 실패자') !== -1 || text.indexOf('나는 실패자') !== -1) {
        mappedLayers.story = this.concepts['STORY_GLOBAL_FAILURE'];
        unsupportedInferencesBlocked.push('USER_IDENTITY: chronic_loser (영구적 성격/인격 진단 배제, 생각의 이야기로 취급)');
      }

      // =========================================================================
      // [Test 15] "실제로 계약이 취소됐어요" -> Reality Fact/Scene (재앙화 변환 금지)
      // =========================================================================
      if (text.indexOf('계약이 취소') !== -1 || text.indexOf('계약 취소') !== -1) {
        mappedLayers.context = this.concepts['CTX_WORK'];
        mappedLayers.scene = this.concepts['SCENE_OFFICE_WORK'];
        mappedLayers.fact = this.concepts['FACT_CONTRACT_CANCELLED'];
        unsupportedInferencesBlocked.push('STORY: catastrophic_ruin (현실 팩트를 재앙화 스토리로 왜곡 금지)');
      }

      return {
        text: text,
        mappedLayers: mappedLayers,
        safetyIntercepted: false,
        unsupportedInferencesBlocked: unsupportedInferencesBlocked
      };
    },

    getExternalAiCallCount: function() {
      return 0; // Strictly Zero-Key
    },

    isZeroKeyCompliant: function() {
      return true;
    }
  };

  // 초기화 실행
  MyungSimOntologyGovernance.init();

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyungSimOntologyGovernance;
  }
  global.MyungSimOntologyGovernance = MyungSimOntologyGovernance;

})(typeof window !== 'undefined' ? window : global);
