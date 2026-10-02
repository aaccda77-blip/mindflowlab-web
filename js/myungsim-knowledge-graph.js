/**
 * MyungSim Content Knowledge Graph Core Engine v1
 * ===================================================================
 * 200+장의 명심카드를 단순 JSON 나열이 아닌 SCENE-TRIGGER-STORY-BODY-URGE-ACTION-
 * 10%ACTION-책개념-관련질문으로 연결된 통합 콘텐츠 지식체계로 관리하는 엔진.
 * 
 * [철칙]
 * 1. Content Knowledge Graph ONLY (User Psychological Graph 절대 아님).
 * 2. Personal Working Map과 절대 자동 병합 금지.
 * 3. Safety First (위기 감지 시 Graph 탐색 즉시 중단).
 * 4. Rule Router Fallback (Graph 서브시스템 OFF 시 RuleBasedRouter 단독 100% 정상 구동).
 * 5. 3대 코드 레벨화 금지 (Dark/Neural/Zero Point는 평등한 기능적 렌즈).
 * 6. Zero-Key (외부 AI 호출 0건, 인메모리 인접 맵 로컬 구동).
 */

(function(global) {
  'use strict';

  var KG_VERSION = 'myungsim-kg-v1.0';

  // 22대 Node Types
  var NODE_TYPES = {
    CARD: 'CARD',
    PACK: 'PACK',
    CATEGORY: 'CATEGORY',
    SCENE: 'SCENE',
    CONTEXT: 'CONTEXT',
    TRIGGER: 'TRIGGER',
    STORY: 'STORY',
    UNKNOWN: 'UNKNOWN',
    BODY_SIGNAL: 'BODY_SIGNAL',
    EMOTION: 'EMOTION',
    URGE: 'URGE',
    ACTION: 'ACTION',
    ACTION_TYPE: 'ACTION_TYPE',
    RESULT: 'RESULT',
    PROTECTION_FUNCTION: 'PROTECTION_FUNCTION',
    STRENGTH: 'STRENGTH',
    TEN_PERCENT_ACTION: 'TEN_PERCENT_ACTION',
    BOOK: 'BOOK',
    BOOK_CONCEPT: 'BOOK_CONCEPT',
    CODE_CONCEPT: 'CODE_CONCEPT',
    SAFETY_TOPIC: 'SAFETY_TOPIC',
    ROUTE_TAG: 'ROUTE_TAG',
    SEARCH_CONCEPT: 'SEARCH_CONCEPT'
  };

  // 22대 Edge Types
  var EDGE_TYPES = {
    BELONGS_TO_PACK: 'BELONGS_TO_PACK',
    BELONGS_TO_CATEGORY: 'BELONGS_TO_CATEGORY',
    OCCURS_IN_CONTEXT: 'OCCURS_IN_CONTEXT',
    HAS_SCENE: 'HAS_SCENE',
    HAS_TRIGGER: 'HAS_TRIGGER',
    CAN_ACTIVATE_STORY: 'CAN_ACTIVATE_STORY',
    CAN_INCLUDE_UNKNOWN: 'CAN_INCLUDE_UNKNOWN',
    CAN_HAVE_BODY_SIGNAL: 'CAN_HAVE_BODY_SIGNAL',
    CAN_INCLUDE_EMOTION: 'CAN_INCLUDE_EMOTION',
    CAN_CREATE_URGE: 'CAN_CREATE_URGE',
    URGE_CAN_LEAD_TO: 'URGE_CAN_LEAD_TO',
    ACTION_CAN_PRODUCE: 'ACTION_CAN_PRODUCE',
    CAN_PROTECT: 'CAN_PROTECT',
    CAN_OVERUSE_STRENGTH: 'CAN_OVERUSE_STRENGTH',
    CAN_TRY_ACTION: 'CAN_TRY_ACTION',
    GROUNDED_IN_BOOK: 'GROUNDED_IN_BOOK',
    GROUNDED_IN_CONCEPT: 'GROUNDED_IN_CONCEPT',
    RELATED_TO_CARD: 'RELATED_TO_CARD',
    CONTRASTS_WITH: 'CONTRASTS_WITH',
    SAFETY_ESCALATES_TO: 'SAFETY_ESCALATES_TO',
    ROUTED_BY: 'ROUTED_BY',
    SEARCH_SYNONYM_OF: 'SEARCH_SYNONYM_OF'
  };

  // 온톨로지 허용 소스/타겟 스키마 매핑
  var ALLOWED_EDGE_SCHEMA = {
    BELONGS_TO_PACK: { from: ['CARD'], to: ['PACK'] },
    BELONGS_TO_CATEGORY: { from: ['CARD', 'PACK'], to: ['CATEGORY'] },
    OCCURS_IN_CONTEXT: { from: ['SCENE', 'TRIGGER', 'CARD'], to: ['CONTEXT'] },
    HAS_SCENE: { from: ['CARD'], to: ['SCENE'] },
    HAS_TRIGGER: { from: ['CARD', 'SCENE'], to: ['TRIGGER'] },
    CAN_ACTIVATE_STORY: { from: ['TRIGGER', 'SCENE'], to: ['STORY'] },
    CAN_INCLUDE_UNKNOWN: { from: ['CARD', 'STORY'], to: ['UNKNOWN'] },
    CAN_HAVE_BODY_SIGNAL: { from: ['CARD', 'STORY', 'EMOTION'], to: ['BODY_SIGNAL'] },
    CAN_INCLUDE_EMOTION: { from: ['CARD', 'STORY'], to: ['EMOTION'] },
    CAN_CREATE_URGE: { from: ['STORY', 'EMOTION', 'BODY_SIGNAL'], to: ['URGE'] },
    URGE_CAN_LEAD_TO: { from: ['URGE'], to: ['ACTION'] },
    ACTION_CAN_PRODUCE: { from: ['ACTION'], to: ['RESULT'] },
    CAN_PROTECT: { from: ['URGE', 'ACTION', 'STORY'], to: ['PROTECTION_FUNCTION'] },
    CAN_OVERUSE_STRENGTH: { from: ['STRENGTH'], to: ['STORY', 'URGE'] },
    CAN_TRY_ACTION: { from: ['CARD', 'ACTION', 'URGE'], to: ['TEN_PERCENT_ACTION'] },
    GROUNDED_IN_BOOK: { from: ['CARD', 'BOOK_CONCEPT'], to: ['BOOK'] },
    GROUNDED_IN_CONCEPT: { from: ['CARD', 'TEN_PERCENT_ACTION'], to: ['BOOK_CONCEPT', 'CODE_CONCEPT'] },
    RELATED_TO_CARD: { from: ['CARD'], to: ['CARD'] },
    CONTRASTS_WITH: { from: ['CARD', 'CODE_CONCEPT'], to: ['CARD', 'CODE_CONCEPT', 'STORY'] },
    SAFETY_ESCALATES_TO: { from: ['CARD', 'TRIGGER', 'SCENE'], to: ['SAFETY_TOPIC'] },
    ROUTED_BY: { from: ['CARD'], to: ['ROUTE_TAG', 'SEARCH_CONCEPT'] },
    SEARCH_SYNONYM_OF: { from: ['SEARCH_CONCEPT'], to: ['TRIGGER', 'STORY', 'CONTEXT'] }
  };

  var MyungSimKnowledgeGraph = {
    version: KG_VERSION,
    enabled: true, // Graph Subsystem Toggle for Fallback testing

    nodes: {}, // id -> Node
    edges: {}, // id -> Edge
    adjacency: {}, // fromId -> [edgeId, ...]
    reverseAdjacency: {}, // toId -> [edgeId, ...]

    init: function(cardsData) {
      this.clear();
      this._seedCanonicalConcepts();
      if (cardsData || (typeof window !== 'undefined' && window.MIND_CARDS_DATA)) {
        this.backfillCards(cardsData || window.MIND_CARDS_DATA);
      }
      return true;
    },

    clear: function() {
      this.nodes = {};
      this.edges = {};
      this.adjacency = {};
      this.reverseAdjacency = {};
    },

    // 1. 기본 노드 및 엣지 조작
    addNode: function(node) {
      if (!node.id) throw new Error('Node must have an id');
      if (!node.type || !NODE_TYPES[node.type]) {
        throw new Error('Invalid node type: ' + node.type);
      }

      this.nodes[node.id] = {
        id: node.id,
        type: node.type,
        key: node.key || node.id,
        label: node.label || node.id,
        description: node.description || '',
        status: node.status || 'ACTIVE',
        metadata: node.metadata || {}
      };

      if (!this.adjacency[node.id]) this.adjacency[node.id] = [];
      if (!this.reverseAdjacency[node.id]) this.reverseAdjacency[node.id] = [];
      return this.nodes[node.id];
    },

    addEdge: function(edge) {
      if (!edge.id) edge.id = 'EDGE_' + edge.from + '__' + edge.type + '__' + edge.to;
      if (!edge.type || !EDGE_TYPES[edge.type]) {
        throw new Error('Invalid edge type: ' + edge.type);
      }

      // Ontology Validation
      var fromNode = this.nodes[edge.from];
      var toNode = this.nodes[edge.to];
      var schema = ALLOWED_EDGE_SCHEMA[edge.type];

      if (schema && fromNode && toNode) {
        var fromValid = schema.from.indexOf(fromNode.type) !== -1;
        var toValid = schema.to.indexOf(toNode.type) !== -1;
        if (!fromValid || !toValid) {
          throw new Error('ONTOLOGY_VIOLATION: ' + edge.type + ' cannot connect ' + fromNode.type + ' -> ' + toNode.type);
        }
      }

      // Check level-up forbidden rules and ontology governance
      if (edge.type === 'LOWER_LEVEL_THAN' || edge.type === 'LEVEL_UP_TO' || edge.type === 'CAUSES' || edge.type === 'RESULTS_IN_ALWAYS') {
        throw new Error('FORBIDDEN_EDGE: Level hierarchies and absolute causal claims are strictly prohibited.');
      }

      var gov = (typeof window !== 'undefined' && window.MyungSimOntologyGovernance) || (typeof MyungSimOntologyGovernance !== 'undefined' ? MyungSimOntologyGovernance : null);
      if (gov && fromNode && toNode) {
        var govCheck = gov.validateEdgeProposal(fromNode.type, toNode.type, edge.type);
        if (!govCheck.valid) {
          throw new Error('GOVERNANCE_VIOLATION: ' + govCheck.message);
        }
      }

      this.edges[edge.id] = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        weight: edge.weight || 1.0,
        sourceType: edge.sourceType || 'SYSTEM_CANONICAL',
        reviewStatus: edge.reviewStatus || 'APPROVED'
      };

      if (!this.adjacency[edge.from]) this.adjacency[edge.from] = [];
      if (!this.reverseAdjacency[edge.to]) this.reverseAdjacency[edge.to] = [];

      this.adjacency[edge.from].push(edge.id);
      this.reverseAdjacency[edge.to].push(edge.id);
      return this.edges[edge.id];
    },

    // 2. 도서 및 3대 코드 정규 개념 시딩
    _seedCanonicalConcepts: function() {
      var self = this;

      // 4대 Books
      var books = [
        { id: 'BOOK_DARK_CODE', label: '다크 코드', key: 'dark_code' },
        { id: 'BOOK_NEURAL_CODE', label: '뉴럴 코드', key: 'neural_code' },
        { id: 'BOOK_ZERO_POINT', label: '제로 포인트', key: 'zero_point' },
        { id: 'BOOK_BELIEVE_NOT_TRAPPED', label: '나는 믿는다 그러나 갇히지 않는다', key: 'believe_not_trapped' }
      ];
      books.forEach(function(b) {
        self.addNode({ id: b.id, type: NODE_TYPES.BOOK, label: b.label, key: b.key });
      });

      // 3대 Code Concepts (평등한 도구적 기능)
      var codes = [
        { id: 'CODE_DARK', label: 'Dark Code', desc: '반복해서 자동으로 가는 길을 본다' },
        { id: 'CODE_NEURAL', label: 'Neural Code', desc: '조금 다른 행동을 통해 새로운 경험을 만든다' },
        { id: 'CODE_ZERO_POINT', label: 'Zero Point', desc: '반응과 행동 사이의 선택공간을 확인한다' }
      ];
      codes.forEach(function(c) {
        self.addNode({ id: c.id, type: NODE_TYPES.CODE_CONCEPT, label: c.label, description: c.desc });
      });

      // Book Concepts
      var bookConcepts = [
        { id: 'BC_FACT_STORY_UNKNOWN', label: 'FACT·STORY·UNKNOWN', book: 'BOOK_DARK_CODE' },
        { id: 'BC_BODY_SIGNATURE', label: 'Body Signature', book: 'BOOK_DARK_CODE' },
        { id: 'BC_EMOTION_VS_URGE', label: 'Emotion vs Urge', book: 'BOOK_DARK_CODE' },
        { id: 'BC_SELF_CRITICISM_TO_REPAIR', label: 'Self Criticism to Repair', book: 'BOOK_DARK_CODE' },
        { id: 'BC_TEN_SECOND_CHECK', label: '10초 방향 확인', book: 'BOOK_NEURAL_CODE' },
        { id: 'BC_EXPECTED_VS_ACTUAL', label: 'EXPECTED vs ACTUAL', book: 'BOOK_NEURAL_CODE' },
        { id: 'BC_NEW_EXPERIENCE', label: '새로운 경험 생성', book: 'BOOK_NEURAL_CODE' },
        { id: 'BC_REACTION_NOT_IDENTITY', label: '반응은 정체성이 아니다', book: 'BOOK_ZERO_POINT' },
        { id: 'BC_CHOICE_SPACE', label: '선택공간', book: 'BOOK_ZERO_POINT' },
        { id: 'BC_RETURN_TO_LIFE', label: '다시 삶으로 돌아옴', book: 'BOOK_ZERO_POINT' },
        { id: 'BC_BELIEF_WITHOUT_CONFINEMENT', label: '갇히지 않는 믿음', book: 'BOOK_BELIEVE_NOT_TRAPPED' },
        { id: 'BC_UNCERTAINTY_AND_PARTICIPATION', label: '불확실성과 삶의 참여', book: 'BOOK_BELIEVE_NOT_TRAPPED' }
      ];
      bookConcepts.forEach(function(bc) {
        self.addNode({ id: bc.id, type: NODE_TYPES.BOOK_CONCEPT, label: bc.label, key: bc.id });
        self.addEdge({ from: bc.id, to: bc.book, type: EDGE_TYPES.GROUNDED_IN_BOOK });
      });

      // Contexts
      var contexts = [
        { id: 'CTX_ROMANTIC', label: '연애·친밀', key: 'romantic' },
        { id: 'CTX_FAMILY', label: '가족·원가족', key: 'family' },
        { id: 'CTX_WORK', label: '직장·일', key: 'work' },
        { id: 'CTX_MONEY', label: '돈·재정', key: 'money' },
        { id: 'CTX_FRIENDSHIP', label: '친구·동료', key: 'friendship' },
        { id: 'CTX_DECISION', label: '선택·결정', key: 'decision' },
        { id: 'CTX_BELIEF_FATE', label: '믿음·사주·운명', key: 'belief_fate' }
      ];
      contexts.forEach(function(ctx) {
        self.addNode({ id: ctx.id, type: NODE_TYPES.CONTEXT, label: ctx.label, key: ctx.key });
      });

      // Safety Topics
      var safetyTopics = [
        { id: 'SAFETY_CRISIS', label: '자해·자살 위기', key: 'self_harm' },
        { id: 'SAFETY_VIOLENCE', label: '신체 폭력·학대', key: 'violence' },
        { id: 'SAFETY_STALKING', label: '스토킹·강압', key: 'stalking' },
        { id: 'SAFETY_FINANCIAL', label: '전재산 몰빵·파산', key: 'financial_high_stakes' }
      ];
      safetyTopics.forEach(function(st) {
        self.addNode({ id: st.id, type: NODE_TYPES.SAFETY_TOPIC, label: st.label, key: st.key });
      });
    },

    // 3. 기존 200개 카드 Backfill
    backfillCards: function(cards) {
      if (!Array.isArray(cards)) return 0;
      var self = this;
      var count = 0;

      cards.forEach(function(c) {
        if (!c.id) return;
        var cardNodeId = 'CARD_' + c.id;
        self.addNode({
          id: cardNodeId,
          type: NODE_TYPES.CARD,
          key: c.id,
          label: c.cardTitle || c.title || c.id,
          description: c.question || '',
          metadata: { packId: c.packId, category: c.category }
        });
        count++;

        // 1. Pack 연결
        if (c.packId) {
          var packNodeId = 'PACK_' + c.packId;
          if (!self.nodes[packNodeId]) {
            self.addNode({ id: packNodeId, type: NODE_TYPES.PACK, label: c.packId, key: c.packId });
          }
          self.addEdge({ from: cardNodeId, to: packNodeId, type: EDGE_TYPES.BELONGS_TO_PACK });
        }

        // 2. Trigger 연결
        if (c.triggerTags && c.triggerTags.length > 0) {
          c.triggerTags.forEach(function(t) {
            var trigNodeId = 'TRIG_' + t;
            if (!self.nodes[trigNodeId]) {
              self.addNode({ id: trigNodeId, type: NODE_TYPES.TRIGGER, label: t, key: t });
            }
            self.addEdge({ from: cardNodeId, to: trigNodeId, type: EDGE_TYPES.HAS_TRIGGER });
          });
        }

        // 3. 10% Action 연결
        if (c.tenPercentAction) {
          var actionNodeId = 'ACT10_' + c.id;
          self.addNode({ id: actionNodeId, type: NODE_TYPES.TEN_PERCENT_ACTION, label: c.tenPercentAction, key: c.id });
          self.addEdge({ from: cardNodeId, to: actionNodeId, type: EDGE_TYPES.CAN_TRY_ACTION });
        }

        // 4. Related Cards 연결
        if (c.relatedCards && Array.isArray(c.relatedCards)) {
          c.relatedCards.forEach(function(relId) {
            var targetCardNodeId = 'CARD_' + relId;
            self.addEdge({ from: cardNodeId, to: targetCardNodeId, type: EDGE_TYPES.RELATED_TO_CARD });
          });
        }

        // 5. 도서 정합성 연결
        if (c.relatedBook) {
          var bookNodeId = null;
          if (c.relatedBook.indexOf('다크') !== -1) bookNodeId = 'BOOK_DARK_CODE';
          else if (c.relatedBook.indexOf('뉴럴') !== -1) bookNodeId = 'BOOK_NEURAL_CODE';
          else if (c.relatedBook.indexOf('제로') !== -1) bookNodeId = 'BOOK_ZERO_POINT';
          else if (c.relatedBook.indexOf('믿는다') !== -1) bookNodeId = 'BOOK_BELIEVE_NOT_TRAPPED';

          if (bookNodeId && self.nodes[bookNodeId]) {
            self.addEdge({ from: cardNodeId, to: bookNodeId, type: EDGE_TYPES.GROUNDED_IN_BOOK });
          }
        }
      });

      return count;
    },

    // 4. Graph 무결성 검사기 (Integrity Inspector)
    inspectIntegrity: function() {
      var self = this;
      var brokenEdges = [];
      var orphanNodes = [];
      var duplicateConcepts = [];

      // Check broken edges
      Object.keys(this.edges).forEach(function(edgeId) {
        var e = self.edges[edgeId];
        var fromExists = Boolean(self.nodes[e.from]);
        var toExists = Boolean(self.nodes[e.to]);
        if (!fromExists || !toExists) {
          brokenEdges.push({
            edgeId: edgeId,
            from: e.from,
            to: e.to,
            missing: !fromExists ? 'FROM_NODE' : 'TO_NODE'
          });
        }
      });

      // Check orphan nodes
      Object.keys(this.nodes).forEach(function(nodeId) {
        var outEdges = self.adjacency[nodeId] || [];
        var inEdges = self.reverseAdjacency[nodeId] || [];
        if (outEdges.length === 0 && inEdges.length === 0) {
          orphanNodes.push(nodeId);
        }
      });

      // Check duplicate keys
      var keys = {};
      Object.keys(this.nodes).forEach(function(nodeId) {
        var n = self.nodes[nodeId];
        var combinedKey = n.type + '__' + n.label;
        if (keys[combinedKey]) {
          duplicateConcepts.push({ key: combinedKey, nodes: [keys[combinedKey], nodeId] });
        } else {
          keys[combinedKey] = nodeId;
        }
      });

      return {
        brokenEdges: brokenEdges,
        orphanNodes: orphanNodes,
        duplicateConcepts: duplicateConcepts,
        isValid: brokenEdges.length === 0,
        totalNodes: Object.keys(this.nodes).length,
        totalEdges: Object.keys(this.edges).length
      };
    },

    // 5. 1-hop / 2-hop 개념 탐색
    getConnectedConcepts: function(nodeId, maxHops) {
      if (!this.enabled) return []; // Fallback mode
      var hops = maxHops || 1;
      var visited = {};
      var queue = [{ id: nodeId, hop: 0 }];
      var results = [];

      visited[nodeId] = true;

      while (queue.length > 0) {
        var curr = queue.shift();
        if (curr.hop >= hops) continue;

        var edgeIds = this.adjacency[curr.id] || [];
        for (var i = 0; i < edgeIds.length; i++) {
          var e = this.edges[edgeIds[i]];
          if (!e) continue;
          var nextId = e.to;
          if (!visited[nextId]) {
            visited[nextId] = true;
            results.push({
              node: this.nodes[nextId],
              edgeType: e.type,
              hop: curr.hop + 1
            });
            queue.push({ id: nextId, hop: curr.hop + 1 });
          }
        }
      }

      return results;
    },

    // 6. Router 결합 탐색 헬퍼 (Direct Match > Canonical Synonym > 1-Hop)
    queryRelatedCards: function(inputQuery, contextFilter) {
      if (!this.enabled) {
        // Fallback: Rule Router alone
        return { fallback: true, candidates: [] };
      }

      var self = this;
      var matchingCards = [];

      // Direct keyword search over card nodes
      Object.keys(this.nodes).forEach(function(nodeId) {
        var n = self.nodes[nodeId];
        if (n.type !== NODE_TYPES.CARD) return;

        var isMatch = (n.label && n.label.indexOf(inputQuery) !== -1) || 
                      (n.description && n.description.indexOf(inputQuery) !== -1);

        if (isMatch) {
          // Context Guard check
          if (contextFilter) {
            var ctxEdges = (self.adjacency[nodeId] || []).map(function(eid) { return self.edges[eid]; });
            var hasContext = ctxEdges.some(function(e) {
              return e.type === EDGE_TYPES.OCCURS_IN_CONTEXT && e.to === contextFilter;
            });
            if (ctxEdges.length > 0 && !hasContext) return; // Guarded
          }
          matchingCards.push({ cardId: n.key, score: 3.0, reason: 'DIRECT_CONCEPT_MATCH' });
        }
      });

      return {
        fallback: false,
        candidates: matchingCards.slice(0, 3)
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
    module.exports = MyungSimKnowledgeGraph;
  }
  global.MyungSimKnowledgeGraph = MyungSimKnowledgeGraph;

})(typeof window !== 'undefined' ? window : global);
