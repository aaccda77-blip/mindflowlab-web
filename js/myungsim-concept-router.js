/**
 * =================================================================
 * MYUNGSIM CONCEPT ROUTER v3
 * NO-AI CANONICAL RETRIEVAL ENGINE
 * (c) 2026 Mindflow Lab. All rights reserved.
 * 
 * 사용자 표현 -> SAFETY -> KOREAN NORMALIZATION -> SEARCH VOCABULARY
 * -> CANONICAL CONCEPT MAPPING -> CONTEXT -> KNOWLEDGE GRAPH 1-HOP
 * -> CANDIDATE MERGE -> 3대 GUARD -> RERANK -> DIVERSIFY -> PREWRITTEN WHY
 * 
 * [철칙]
 * 1. NO-AI Production Mode: 외부 LLM, Embedding, Vector DB, Semantic API 전면 금지 (Zero-Key, API 호출 0건).
 * 2. Retrieval Normalization Layer: 심리 분석기나 진단기가 아니며, 오직 카드를 찾기 위한 정규화 검색 엔진.
 * 3. Safety First: Safety Router 최우선 평가, 위기 감지 시 즉시 안전 흐름 전환.
 * 4. Rule Router 보존: RuleBasedRouter를 절대 제거하지 않으며 100% 무소음 Fallback 보장.
 * 5. Feature Mode: 기본 초기값은 'shadow' (프로덕션 안전성 확보).
 * 6. Privacy: rawQuery 및 개인 사연 원문 Analytics 저장 절대 금지.
 * =================================================================
 */

(function(global) {
  'use strict';

  var ROUTER_VERSION = 'myungsim-concept-router-v3.0';

  // 0. Configuration
  var CONCEPT_ROUTER_CONFIG = {
    MODE: 'shadow', // 'off' | 'shadow' (Default) | 'assist'
    MAX_RECOMMENDATIONS: 3,
    MIN_RECOMMENDATIONS: 2,
    MAX_GRAPH_HOPS: 1, // DIRECT + 1-HOP 제한 (2-HOP 기본 OFF, Graph Drift 방지)
    ENABLE_2HOP: false,
    CONFIDENCE_THRESHOLD: 0.65,
    ZERO_RAW_QUERY_LOG: true,
    EXTERNAL_AI_CALLS: 0
  };

  // 1. Korean Normalizer (공백, 조사, 반복문자, 구두점, 오타 교정)
  var ConceptNormalizer = {
    TYPO_MAP: {
      '못하겟': '못하겠',
      '안와': '안 와',
      '안되': '안 돼',
      '확인해여': '확인해요',
      '망함': '망했',
      '망햇': '망했',
      '폰만봐': '폰만 봐',
      '폰보': '폰 보',
      '톡안': '카톡 안',
      '읽씹당': '읽씹 당',
      '읽씹함': '읽씹 함',
      '안읽씹': '안 읽음'
    },

    JOSA_REGEX: /(?:에서는|에게는|으로는|에서는|에서|에게|으로|까지|부터|마저|조차|처럼|하고|이랑|이나|이라|으로|로|은|는|이|가|을|를|에|의|와|과|랑|도|만)$/,

    normalize: function(text) {
      if (!text || typeof text !== 'string') return '';
      var clean = text.trim().toLowerCase();

      // 자모 반복 (ㅋㅋㅋ, ㅠㅠㅠ, ㅎㅎㅎ) 완화
      clean = clean.replace(/[ㅋㅎㅠㅜ]{2,}/g, '');

      // 오타 및 구어 축약어 치환
      for (var typo in this.TYPO_MAP) {
        if (Object.prototype.hasOwnProperty.call(this.TYPO_MAP, typo)) {
          clean = clean.split(typo).join(this.TYPO_MAP[typo]);
        }
      }

      // 문장부호 정리 (공백으로 치환)
      clean = clean.replace(/[!?,.~@#$%^&*()_+=\-[\]{};:'"<>/\\|]/g, ' ');

      // 다중 공백 단일화
      clean = clean.replace(/\s+/g, ' ').trim();

      return clean;
    },

    tokenize: function(normalizedText) {
      if (!normalizedText) return [];
      var rawTokens = normalizedText.split(' ').filter(function(w) { return w.length > 0; });
      var tokens = [];
      var self = this;

      rawTokens.forEach(function(token) {
        tokens.push(token);
        if (token.length > 2) {
          var stripped = token.replace(self.JOSA_REGEX, '');
          if (stripped && stripped !== token && stripped.length > 1) {
            tokens.push(stripped);
          }
        }
      });

      return Array.from(new Set(tokens));
    }
  };

  // 2. Search Vocabulary Mapper (사용자 일상 표현 -> Canonical Concept)
  var SearchVocabularyMapper = {
    VOCABULARY: [
      // 1) Layer 2: Triggers / Scenes
      { term: '읽씹', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '안읽씹', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '카톡 안봄', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장 안와', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장 안 오', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장 안오', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장이 없', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장 안 옴', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.95 },
      { term: '답장 늦', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.92 },
      { term: '연락 두절', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.90 },
      { term: '연락 안 와', conceptId: 'TRIG_MESSAGE_NO_REPLY', canonicalKey: 'message_no_reply', confidence: 0.92 },
      { term: '엄마 부탁', conceptId: 'TRIG_MOTHER_REQUEST', canonicalKey: 'mother_request', confidence: 0.98 },
      { term: '부모 부탁', conceptId: 'TRIG_MOTHER_REQUEST', canonicalKey: 'mother_request', confidence: 0.95 },
      { term: '삼재', conceptId: 'TRIG_FORTUNE_WARNING', canonicalKey: 'fortune_warning_heard', confidence: 0.98 },
      { term: '사주 불길', conceptId: 'TRIG_FORTUNE_WARNING', canonicalKey: 'fortune_warning_heard', confidence: 0.95 },
      { term: '비판', conceptId: 'TRIG_CRITICISM_HEARD', canonicalKey: 'criticism_heard', confidence: 0.95 },
      { term: '비난', conceptId: 'TRIG_CRITICISM_HEARD', canonicalKey: 'criticism_heard', confidence: 0.92 },
      { term: '지적 들', conceptId: 'TRIG_CRITICISM_HEARD', canonicalKey: 'criticism_heard', confidence: 0.90 },

      // 2) Layer 3: Interpretation (Story / Fact)
      { term: '마음 식었나', conceptId: 'STORY_RELATIONSHIP_ENDING', canonicalKey: 'relationship_is_ending', confidence: 0.95 },
      { term: '마음이 식었', conceptId: 'STORY_RELATIONSHIP_ENDING', canonicalKey: 'relationship_is_ending', confidence: 0.95 },
      { term: '끝난 건가', conceptId: 'STORY_RELATIONSHIP_ENDING', canonicalKey: 'relationship_is_ending', confidence: 0.90 },
      { term: '관계 끝', conceptId: 'STORY_RELATIONSHIP_ENDING', canonicalKey: 'relationship_is_ending', confidence: 0.90 },
      { term: '나쁜 딸', conceptId: 'STORY_BAD_CHILD', canonicalKey: 'bad_child_self_judgment', confidence: 0.98 },
      { term: '나쁜 아들', conceptId: 'STORY_BAD_CHILD', canonicalKey: 'bad_child_self_judgment', confidence: 0.98 },
      { term: '불효녀', conceptId: 'STORY_BAD_CHILD', canonicalKey: 'bad_child_self_judgment', confidence: 0.95 },
      { term: '불효자', conceptId: 'STORY_BAD_CHILD', canonicalKey: 'bad_child_self_judgment', confidence: 0.95 },
      { term: '원래 실패자', conceptId: 'STORY_GLOBAL_FAILURE', canonicalKey: 'global_failure_story', confidence: 0.98 },
      { term: '계약 취소', conceptId: 'FACT_CONTRACT_CANCELLED', canonicalKey: 'contract_cancelled', confidence: 0.98 },

      // 3) Layer 4: Internal Signals (Body Signal vs Emotion)
      { term: '가슴 철렁', conceptId: 'BODY_CHEST_DROP', canonicalKey: 'chest_drop', confidence: 0.98 },
      { term: '심장 쿵', conceptId: 'BODY_CHEST_DROP', canonicalKey: 'chest_drop', confidence: 0.95 },
      { term: '가슴이 철렁', conceptId: 'BODY_CHEST_DROP', canonicalKey: 'chest_drop', confidence: 0.98 },
      { term: '숨막혀', conceptId: 'BODY_BREATH_SHALLOW', canonicalKey: 'breath_shallow', confidence: 0.92 },
      { term: '숨이 턱', conceptId: 'BODY_BREATH_SHALLOW', canonicalKey: 'breath_shallow', confidence: 0.95 },
      { term: '숨 턱', conceptId: 'BODY_BREATH_SHALLOW', canonicalKey: 'breath_shallow', confidence: 0.95 },
      { term: '숨이 얕', conceptId: 'BODY_BREATH_SHALLOW', canonicalKey: 'breath_shallow', confidence: 0.92 },
      { term: '목 긴장', conceptId: 'BODY_MUSCLE_TENSE', canonicalKey: 'muscle_tense', confidence: 0.90 },
      { term: '어깨 긴장', conceptId: 'BODY_MUSCLE_TENSE', canonicalKey: 'muscle_tense', confidence: 0.90 },
      { term: '무서워', conceptId: 'EMO_FEAR', canonicalKey: 'fear', confidence: 0.98 },
      { term: '무섭', conceptId: 'EMO_FEAR', canonicalKey: 'fear', confidence: 0.95 },
      { term: '겁나', conceptId: 'EMO_FEAR', canonicalKey: 'fear', confidence: 0.95 },
      { term: '두려워', conceptId: 'EMO_FEAR', canonicalKey: 'fear', confidence: 0.95 },
      { term: '불안해', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.98 },
      { term: '초조해', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.95 },
      { term: '초조', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.92 },
      { term: '불안', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.90 },
      { term: '남의 시선', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.92 },
      { term: '시선 때문', conceptId: 'EMO_ANXIETY', canonicalKey: 'anxiety', confidence: 0.90 },
      { term: '죄책감', conceptId: 'EMO_GUILT', canonicalKey: 'guilt', confidence: 0.95 },
      { term: '미안함', conceptId: 'EMO_GUILT', canonicalKey: 'guilt', confidence: 0.90 },

      // 4) Layer 5: Urge
      { term: '확인하고 싶어', conceptId: 'URGE_CHECK', canonicalKey: 'urge_to_check', confidence: 0.98 },
      { term: '확인 충동', conceptId: 'URGE_CHECK', canonicalKey: 'urge_to_check', confidence: 0.98 },
      { term: '확인하고 싶은', conceptId: 'URGE_CHECK', canonicalKey: 'urge_to_check', confidence: 0.95 },
      { term: '연락해보고 싶어', conceptId: 'URGE_CHECK', canonicalKey: 'urge_to_check', confidence: 0.90 },
      { term: '사과하고 싶', conceptId: 'URGE_APOLOGIZE', canonicalKey: 'urge_to_apologize', confidence: 0.95 },
      { term: '도망치고 싶', conceptId: 'URGE_ESCAPE', canonicalKey: 'urge_to_escape', confidence: 0.95 },
      { term: '밖에 나가기 싫', conceptId: 'URGE_ESCAPE', canonicalKey: 'urge_to_escape', confidence: 0.92 },
      { term: '나가기 싫', conceptId: 'URGE_ESCAPE', canonicalKey: 'urge_to_escape', confidence: 0.90 },
      { term: '숨고 싶', conceptId: 'URGE_ESCAPE', canonicalKey: 'urge_to_escape', confidence: 0.95 },
      { term: '얼어붙', conceptId: 'URGE_FREEZE', canonicalKey: 'urge_to_freeze', confidence: 0.92 },
      { term: '퇴사하고 싶어', conceptId: 'URGE_QUIT', canonicalKey: 'urge_to_quit', confidence: 0.98 },
      { term: '사표 내고 싶', conceptId: 'URGE_QUIT', canonicalKey: 'urge_to_quit', confidence: 0.98 },
      { term: '때려치고 싶다', conceptId: 'URGE_QUIT', canonicalKey: 'urge_to_quit', confidence: 0.95 },
      { term: '그만두고 싶', conceptId: 'URGE_QUIT', canonicalKey: 'urge_to_quit', confidence: 0.92 },

      // 5) Layer 6: Action
      { term: '폰 뒤적', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '폰 계속 봄', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.98 },
      { term: '폰 확인', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '폰 봐', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '폰을 봐', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '폰 열어', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '폰을 열어', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '스마트폰 열어', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '카톡 봐', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.92 },
      { term: '카톡 봐요', conceptId: 'ACT_PHONE_CHECK', canonicalKey: 'action_phone_check', confidence: 0.95 },
      { term: '퇴사했어', conceptId: 'ACT_QUIT_JOB', canonicalKey: 'action_quit_job', confidence: 0.98 },
      { term: '사표 냈어', conceptId: 'ACT_QUIT_JOB', canonicalKey: 'action_quit_job', confidence: 0.98 },
      { term: '차단했어', conceptId: 'ACT_BLOCK_CONTACT', canonicalKey: 'action_block_contact', confidence: 0.95 }
    ],

    matchTerms: function(normalizedQuery) {
      var matches = [];
      if (!normalizedQuery) return matches;

      for (var i = 0; i < this.VOCABULARY.length; i++) {
        var item = this.VOCABULARY[i];
        if (normalizedQuery.indexOf(item.term) !== -1) {
          matches.push({
            matchedTerm: item.term,
            conceptId: item.conceptId,
            canonicalKey: item.canonicalKey,
            confidence: item.confidence
          });
        }
      }

      return matches;
    }
  };

  // 3. Canonical Concept Mapper (detectedConcepts 추출, 부정문 및 Unsupported Inference 차단)
  var CanonicalConceptMapper = {
    // 부정문 완화 패턴 (아닌, 아니, 않, 절대, 없 등 지원)
    isNegatedTerm: function(canonicalKey, normalizedQuery) {
      if (canonicalKey === 'urge_to_check') {
        return /(?:확인하고\s*싶은\s*건\s*(?:아닌|아니|절대|않)|확인\s*충동(?:은\s*아닌|은\s*아니|은\s*없)|확인하려는\s*건\s*(?:아닌|아니))/i.test(normalizedQuery);
      }
      if (canonicalKey === 'anxiety') {
        return /(?:불안한\s*건\s*(?:아닌|아니|절대|않)|불안해서\s*그런\s*건\s*(?:아닌|아니))/i.test(normalizedQuery);
      }
      if (canonicalKey === 'fear') {
        return /(?:무서운\s*건\s*(?:아닌|아니|절대|않)|겁나는\s*건\s*(?:아닌|아니))/i.test(normalizedQuery);
      }
      if (canonicalKey === 'urge_to_quit') {
        return /(?:퇴사하고\s*싶은\s*건\s*(?:아닌|아니|절대|않)|사표\s*내려는\s*건\s*(?:아닌|아니))/i.test(normalizedQuery);
      }
      return false;
    },

    mapToDetectedConcepts: function(normalizedQuery) {
      var detected = [];
      var vocabMatches = SearchVocabularyMapper.matchTerms(normalizedQuery);
      var self = this;

      vocabMatches.forEach(function(m) {
        var isNegated = self.isNegatedTerm(m.canonicalKey, normalizedQuery);
        if (!isNegated) {
          var exists = detected.some(function(d) { return d.conceptId === m.conceptId; });
          if (!exists) {
            detected.push({
              conceptId: m.conceptId,
              canonicalKey: m.canonicalKey,
              sourceTerm: m.matchedTerm,
              confidence: m.confidence,
              explicit: true
            });
          }
        }
      });

      return detected;
    }
  };

  // 4. Context Detector (발화 주체 기반 맥락 식별 - Identity 아님)
  var ContextDetector = {
    CONTEXT_CUES: {
      romantic: ['남친', '여친', '애인', '연인', '데이트', '사귀', '연애', '썸', '남편', '아내', '와이프', '배우자'],
      family: ['엄마', '아빠', '부모', '어머니', '아버지', '시댁', '시어머니', '장모', '동생', '형', '누나', '오빠', '가족', '원가족'],
      work: ['팀장', '부장', '대표', '사수', '상사', '회사', '출근', '퇴근', '업무', '회의', '직장', '이직', '퇴사', '사표', '동료'],
      friendship: ['친구', '동창', '지인', '모임', '친구들'],
      money: ['돈', '월급', '통장', '잔고', '빚', '대출', '투자', '주식', '코인', '적금', '계약 취소'],
      belief_fate: ['사주', '삼재', '운세', '점', '신점', '타로', '팔자', '대운', '운명']
    },

    detect: function(normalizedQuery) {
      var matchedContexts = [];
      if (!normalizedQuery) return matchedContexts;

      for (var ctxKey in this.CONTEXT_CUES) {
        if (Object.prototype.hasOwnProperty.call(this.CONTEXT_CUES, ctxKey)) {
          var cues = this.CONTEXT_CUES[ctxKey];
          var hit = cues.some(function(cue) {
            return normalizedQuery.indexOf(cue) !== -1;
          });
          if (hit) {
            matchedContexts.push(ctxKey);
          }
        }
      }

      return matchedContexts;
    }
  };

  // 5. Concept Graph Retriever (DIRECT + 1-HOP 제한적 탐색)
  var ConceptGraphRetriever = {
    expandConcepts: function(detectedConcepts, knowledgeGraph, options) {
      var maxHops = (options && options.maxHops) || CONCEPT_ROUTER_CONFIG.MAX_GRAPH_HOPS;
      var retrievalConcepts = [];
      var seenIds = new Set();

      // 1) detectedConcepts (Direct)
      detectedConcepts.forEach(function(dc) {
        seenIds.add(dc.conceptId);
        retrievalConcepts.push({
          conceptId: dc.conceptId,
          canonicalKey: dc.canonicalKey,
          hop: 0,
          source: 'DIRECT',
          confidence: dc.confidence
        });
      });

      // 2) Graph 1-Hop 탐색
      if (knowledgeGraph && knowledgeGraph.enabled && maxHops >= 1) {
        detectedConcepts.forEach(function(dc) {
          var connected = knowledgeGraph.getConnectedConcepts(dc.conceptId, 1);
          connected.forEach(function(c) {
            if (!seenIds.has(c.node.id)) {
              seenIds.add(c.node.id);
              retrievalConcepts.push({
                conceptId: c.node.id,
                canonicalKey: c.node.key,
                hop: 1,
                source: 'GRAPH_1HOP',
                edgeType: c.edgeType,
                confidence: (dc.confidence || 0.9) * 0.75
              });
            }
          });
        });
      }

      return retrievalConcepts;
    }
  };

  // 6. Concept Card Retriever (카드 매칭 및 후보 수집)
  var ConceptCardRetriever = {
    findCandidates: function(retrievalConcepts, cardsData, knowledgeGraph) {
      var candidateMap = {};
      var cards = cardsData || [];

      // 1) 지식 그래프 인스턴스 역인접 간선 검색
      if (knowledgeGraph && knowledgeGraph.nodes) {
        retrievalConcepts.forEach(function(rc) {
          var incomingEdges = knowledgeGraph.reverseAdjacency[rc.conceptId] || [];
          incomingEdges.forEach(function(edgeId) {
            var edge = knowledgeGraph.edges[edgeId];
            if (edge && edge.from && edge.from.indexOf('CARD_') === 0) {
              var cardId = edge.from.replace('CARD_', '');
              if (!candidateMap[cardId]) {
                candidateMap[cardId] = {
                  cardId: cardId,
                  matchedConcepts: [],
                  conceptScore: 0,
                  provenance: rc.hop === 0 ? 'CONCEPT_DIRECT' : 'GRAPH_1HOP'
                };
              }
              candidateMap[cardId].matchedConcepts.push(rc);
              candidateMap[cardId].conceptScore += (rc.hop === 0 ? 3.0 : 1.5) * rc.confidence;
            }
          });
        });
      }

      // 2) 인메모리 카드 메타데이터 직접 매칭 안전망
      cards.forEach(function(card) {
        var cardId = String(card.id);
        var cardText = [
          card.question || '',
          (card.triggers || []).join(' '),
          (card.keywords || []).join(' '),
          card.story || '',
          card.bodySignal || '',
          card.urge || ''
        ].join(' ').toLowerCase();

        retrievalConcepts.forEach(function(rc) {
          var key = (rc.canonicalKey || '').toLowerCase();
          if (key && cardText.indexOf(key) !== -1) {
            if (!candidateMap[cardId]) {
              candidateMap[cardId] = {
                cardId: cardId,
                matchedConcepts: [],
                conceptScore: 0,
                provenance: rc.hop === 0 ? 'CONCEPT_DIRECT' : 'GRAPH_1HOP'
              };
            }
            candidateMap[cardId].matchedConcepts.push(rc);
            candidateMap[cardId].conceptScore += (rc.hop === 0 ? 2.5 : 1.0) * rc.confidence;
          }
        });
      });

      return candidateMap;
    }
  };

  // 7. Candidate Merger (Concept 후보 + Rule 후보 병합 & Provenance 태깅)
  var CandidateMerger = {
    merge: function(conceptCandidateMap, ruleResult, cardsData) {
      var mergedMap = {};
      var cardLookup = {};
      (cardsData || []).forEach(function(c) { cardLookup[String(c.id)] = c; });

      // 1) Rule 후보 주입 (r.card.id 또는 r.cardId 지원)
      var ruleRecs = (ruleResult && (ruleResult.recommendations || ruleResult.recs)) || [];
      ruleRecs.forEach(function(r) {
        var cid = String((r.card && r.card.id) || r.cardId || (r.card && r.card.cardId));
        if (cid && cid !== 'undefined') {
          mergedMap[cid] = {
            cardId: cid,
            card: cardLookup[cid] || r.card,
            ruleScore: r.score || 0,
            conceptScore: 0,
            matchedConcepts: [],
            provenance: 'LEGACY_RULE',
            ruleMatchReasons: r.matchReasons || []
          };
        }
      });

      // 2) Concept 후보 병합
      for (var cid in conceptCandidateMap) {
        if (Object.prototype.hasOwnProperty.call(conceptCandidateMap, cid)) {
          var cCand = conceptCandidateMap[cid];
          if (mergedMap[cid]) {
            mergedMap[cid].conceptScore = cCand.conceptScore;
            mergedMap[cid].matchedConcepts = cCand.matchedConcepts;
            mergedMap[cid].provenance = 'MULTIPLE'; // Concept + Rule 동시 지지
          } else {
            mergedMap[cid] = {
              cardId: cid,
              card: cardLookup[cid],
              ruleScore: 0,
              conceptScore: cCand.conceptScore,
              matchedConcepts: cCand.matchedConcepts,
              provenance: cCand.provenance,
              ruleMatchReasons: []
            };
          }
        }
      }

      return Object.values(mergedMap).filter(function(item) { return Boolean(item.card); });
    }
  };

  // 8. 3대 가드 시스템 (ContextGuard, NegativeGuard, RealityGuard)
  var GuardEngine = {
    applyGuards: function(candidates, detectedContexts, normalizedQuery) {
      return candidates.map(function(cand) {
        var card = cand.card;
        var scoreAdjustment = 0;
        var guardTags = [];

        // 1) Context Guard
        var cardContexts = card.contextTags || [];
        if (detectedContexts.indexOf('family') !== -1 && cardContexts.indexOf('family') === -1 && cardContexts.indexOf('romantic_only') !== -1) {
          scoreAdjustment -= 20.0;
          guardTags.push('CONTEXT_MISMATCH_FAMILY_PENALTY');
        }
        if (detectedContexts.indexOf('romantic') !== -1 && cardContexts.indexOf('romantic') === -1 && cardContexts.indexOf('family_only') !== -1) {
          scoreAdjustment -= 20.0;
          guardTags.push('CONTEXT_MISMATCH_ROMANTIC_PENALTY');
        }

        // 2) Negative Guard
        var negTags = card.negativeTags || [];
        negTags.forEach(function(tag) {
          if (normalizedQuery.indexOf(tag) !== -1) {
            scoreAdjustment -= 15.0;
            guardTags.push('NEGATIVE_TAG_TRIGGERED:' + tag);
          }
        });

        // 3) Reality Guard
        var realitySignals = ['폭행', '맞았', '부채', '빚', '압류', '계약 취소', '임금', '해고', '퇴사'];
        var hasReality = realitySignals.some(function(s) { return normalizedQuery.indexOf(s) !== -1; });
        if (hasReality) {
          var isFactCard = (card.category || '').indexOf('돈') !== -1 || 
                           (card.category || '').indexOf('직장') !== -1 || 
                           (card.contextTags || []).indexOf('money') !== -1 ||
                           (card.contextTags || []).indexOf('work') !== -1;
          if (isFactCard) {
            scoreAdjustment += 10.0;
            guardTags.push('REALITY_GUARD_PROTECTION');
          }
        }

        return Object.assign({}, cand, {
          guardAdjustment: scoreAdjustment,
          guardTags: guardTags
        });
      });
    }
  };

  // 9. Concept Reranker & Result Diversifier
  var ConceptReranker = {
    rerank: function(guardedCandidates) {
      var scored = guardedCandidates.map(function(item) {
        var baseScore = (item.ruleScore * 0.45) + (item.conceptScore * 0.55);
        var finalScore = Math.max(0, baseScore + (item.guardAdjustment || 0));

        if (item.provenance === 'MULTIPLE') {
          finalScore += 2.0;
        }

        return Object.assign({}, item, {
          finalScore: Math.round(finalScore * 10) / 10
        });
      });

      scored.sort(function(a, b) {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        return String(a.cardId).localeCompare(String(b.cardId));
      });

      return scored;
    },

    diversify: function(rankedCandidates, maxRecs, minRecs, cardsPool) {
      var limit = maxRecs || CONCEPT_ROUTER_CONFIG.MAX_RECOMMENDATIONS;
      var minLimit = minRecs || CONCEPT_ROUTER_CONFIG.MIN_RECOMMENDATIONS;
      var selected = [];
      var seenPacks = new Set();
      var seenCategories = new Set();

      if (rankedCandidates.length > 0) {
        var first = rankedCandidates[0];
        selected.push(first);
        if (first.card.pack) seenPacks.add(first.card.pack);
        if (first.card.category) seenCategories.add(first.card.category);
      }

      for (var i = 1; i < rankedCandidates.length; i++) {
        if (selected.length >= limit) break;
        var cand = rankedCandidates[i];
        if (cand.finalScore < 0.5) continue;

        var pack = cand.card.pack;
        var cat = cand.card.category;

        if (!seenPacks.has(pack) || !seenCategories.has(cat) || cand.finalScore > 3.0) {
          selected.push(cand);
          if (pack) seenPacks.add(pack);
          if (cat) seenCategories.add(cat);
        }
      }

      // 최소 2~3장 확보를 위한 보충
      if (selected.length < minLimit && rankedCandidates.length >= minLimit) {
        for (var j = 1; j < rankedCandidates.length; j++) {
          if (selected.length >= minLimit) break;
          var fallbackCand = rankedCandidates[j];
          if (!selected.some(function(s) { return s.cardId === fallbackCand.cardId; })) {
            selected.push(fallbackCand);
          }
        }
      }

      // 그래도 후보가 부족한 경우 인기/대표 카드에서 안전 보충 (억지 채우기 금지 원칙 준수하되 최소 2장 보장)
      if (selected.length < minLimit && cardsPool && cardsPool.length >= minLimit) {
        for (var k = 0; k < cardsPool.length; k++) {
          if (selected.length >= minLimit) break;
          var poolCard = cardsPool[k];
          var poolCid = String(poolCard.id);
          if (!selected.some(function(s) { return s.cardId === poolCid; })) {
            selected.push({
              cardId: poolCid,
              card: poolCard,
              finalScore: 1.0,
              provenance: 'LEGACY_RULE',
              matchedConcepts: [],
              guardTags: []
            });
          }
        }
      }

      return selected;
    }
  };

  // 10. Match Reason Builder
  var MatchReasonBuilder = {
    buildWhy: function(candidate, detectedConcepts, detectedContexts) {
      var card = candidate.card;
      var reasons = [];

      if (card.matchReasons && card.matchReasons.length > 0) {
        reasons.push(card.matchReasons[0]);
      }

      var explicitMatches = (candidate.matchedConcepts || []).filter(function(mc) {
        return mc.hop === 0 || mc.source === 'DIRECT';
      });

      if (explicitMatches.length > 0) {
        var termNames = explicitMatches.map(function(m) { return m.sourceTerm || m.canonicalKey; }).join(', ');
        reasons.push("입력하신 '" + termNames + "' 상황에 대한 자동 반응을 관찰하고 작은 대안을 찾습니다.");
      } else if (candidate.provenance === 'GRAPH_1HOP') {
        reasons.push("남겨주신 장면과 연결된 핵심 행동 충동을 점검하도록 안내합니다.");
      } else {
        reasons.push("해당 상황에서 바로 적용할 수 있는 10% 작은 행동을 제안합니다.");
      }

      return reasons.slice(0, 2).join(' ');
    }
  };

  // 11. Concept Router 메인 오케스트레이터 클래스
  function ConceptRouter(cardsData, options) {
    this.version = ROUTER_VERSION;
    this.cards = cardsData || (typeof window !== 'undefined' ? window.MIND_CARDS_DATA : []) || [];
    this.options = Object.assign({}, CONCEPT_ROUTER_CONFIG, options || {});
    this.knowledgeGraph = (typeof window !== 'undefined' && window.MyungSimKnowledgeGraph) ? window.MyungSimKnowledgeGraph : null;
    this.ruleRouter = (typeof window !== 'undefined' && window.RuleBasedRouter) ? new window.RuleBasedRouter(this.cards) : null;
  }

  ConceptRouter.prototype.setMode = function(mode) {
    if (['off', 'shadow', 'assist'].indexOf(mode) !== -1) {
      this.options.MODE = mode;
      return true;
    }
    return false;
  };

  ConceptRouter.prototype.getMode = function() {
    return this.options.MODE;
  };

  ConceptRouter.prototype.getExternalAiCallCount = function() {
    return 0;
  };

  ConceptRouter.prototype.isZeroKeyCompliant = function() {
    return true;
  };

  ConceptRouter.prototype.route = function(rawUserQuery, runOptions) {
    var query = (rawUserQuery || '').trim();
    var currentMode = (runOptions && runOptions.mode) || this.options.MODE;

    // 0. Safety Router 최우선 평가
    if (this.ruleRouter) {
      var safety = this.ruleRouter.checkSafety(query);
      if (!safety.isSafe) {
        return {
          status: 'high_risk_blocked',
          safety: safety,
          routerMode: currentMode,
          recommendations: [],
          disclaimer: '긴급 위기 지원을 최우선으로 안내합니다.'
        };
      }
    }

    // 1. 빈 쿼리 처리
    if (!query) {
      return {
        status: 'empty_query',
        recommendations: [],
        routerMode: currentMode
      };
    }

    // 2. 모드가 'off'인 경우 RuleBasedRouter로 위임
    if (currentMode === 'off' || !this.ruleRouter) {
      if (this.ruleRouter) {
        return this.ruleRouter.route(query, runOptions);
      }
      return { status: 'router_disabled', recommendations: [] };
    }

    // 3. 한국어 정규화 및 토큰 추출
    var normalized = ConceptNormalizer.normalize(query);
    var tokens = ConceptNormalizer.tokenize(normalized);

    // 4. Canonical Concept 매핑
    var detectedConcepts = CanonicalConceptMapper.mapToDetectedConcepts(normalized);

    // 5. 발화 주체 기반 맥락 감지
    var detectedContexts = ContextDetector.detect(normalized);

    // 6. Knowledge Graph Direct + 1-Hop 제한적 확장
    var retrievalConcepts = ConceptGraphRetriever.expandConcepts(
      detectedConcepts,
      this.knowledgeGraph,
      { maxHops: this.options.MAX_GRAPH_HOPS }
    );

    // 7. 카드 후보 검색
    var conceptCandidateMap = ConceptCardRetriever.findCandidates(
      retrievalConcepts,
      this.cards,
      this.knowledgeGraph
    );

    // 8. 기존 Legacy Rule Router 실행
    var ruleResult = this.ruleRouter.route(query, Object.assign({}, runOptions, { debug: true }));

    // 9. 후보 병합 & Provenance 태깅
    var mergedCandidates = CandidateMerger.merge(conceptCandidateMap, ruleResult, this.cards);

    // 10. 3대 가드 적용
    var guardedCandidates = GuardEngine.applyGuards(mergedCandidates, detectedContexts, normalized);

    // 11. Rerank
    var rankedCandidates = ConceptReranker.rerank(guardedCandidates);

    // 12. Diversify
    var diversifiedCandidates = ConceptReranker.diversify(
      rankedCandidates,
      this.options.MAX_RECOMMENDATIONS,
      this.options.MIN_RECOMMENDATIONS,
      this.cards
    );

    // 13. Prewritten Match Reason (WHY) 생성
    var finalRecommendations = diversifiedCandidates.map(function(item) {
      return {
        cardId: item.cardId,
        card: item.card,
        score: item.finalScore,
        provenance: item.provenance,
        matchedConcepts: (item.matchedConcepts || []).map(function(m) { return m.canonicalKey; }),
        why: MatchReasonBuilder.buildWhy(item, detectedConcepts, detectedContexts),
        guardTags: item.guardTags || []
      };
    });

    // 14. 3대 갭(Gap) 상태 진단
    var gapDiagnosis = null;
    if (finalRecommendations.length === 0) {
      if (detectedConcepts.length === 0) {
        gapDiagnosis = 'ONTOLOGY_GAP_CANDIDATE';
      } else if (Object.keys(conceptCandidateMap).length === 0) {
        gapDiagnosis = 'CONTENT_GAP_CANDIDATE';
      } else {
        gapDiagnosis = 'ROUTER_FAILURE';
      }
    }

    var executionData = {
      status: finalRecommendations.length > 0 ? 'success' : 'no_match',
      safety: (this.ruleRouter && this.ruleRouter.checkSafety(query)) || { isSafe: true },
      routerMode: currentMode,
      conceptRouterVersion: this.version,
      detectedConcepts: detectedConcepts.map(function(dc) { return dc.canonicalKey; }),
      detectedContexts: detectedContexts,
      retrievalConceptsCount: retrievalConcepts.length,
      provenanceSummary: {
        direct: finalRecommendations.filter(function(r) { return r.provenance === 'CONCEPT_DIRECT'; }).length,
        oneHop: finalRecommendations.filter(function(r) { return r.provenance === 'GRAPH_1HOP'; }).length,
        legacyRule: finalRecommendations.filter(function(r) { return r.provenance === 'LEGACY_RULE'; }).length,
        multiple: finalRecommendations.filter(function(r) { return r.provenance === 'MULTIPLE'; }).length
      },
      gapDiagnosis: gapDiagnosis,
      recommendations: finalRecommendations
    };

    if (currentMode === 'shadow') {
      return Object.assign({}, ruleResult, {
        shadowConceptResult: executionData,
        routerMode: 'shadow'
      });
    }

    if (currentMode === 'assist') {
      if (finalRecommendations.length === 0 && ruleResult && ruleResult.recommendations && ruleResult.recommendations.length > 0) {
        return Object.assign({}, ruleResult, {
          fallbackReason: 'concept_empty_fallback_to_rule',
          routerMode: 'assist_fallback'
        });
      }
      return executionData;
    }

    return executionData;
  };

  // Export
  var MyungSimConceptRouter = {
    version: ROUTER_VERSION,
    config: CONCEPT_ROUTER_CONFIG,
    ConceptNormalizer: ConceptNormalizer,
    SearchVocabularyMapper: SearchVocabularyMapper,
    CanonicalConceptMapper: CanonicalConceptMapper,
    ContextDetector: ContextDetector,
    ConceptGraphRetriever: ConceptGraphRetriever,
    ConceptCardRetriever: ConceptCardRetriever,
    CandidateMerger: CandidateMerger,
    GuardEngine: GuardEngine,
    ConceptReranker: ConceptReranker,
    MatchReasonBuilder: MatchReasonBuilder,
    ConceptRouter: ConceptRouter,
    create: function(cardsData, options) {
      return new ConceptRouter(cardsData, options);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyungSimConceptRouter;
  }
  global.MyungSimConceptRouter = MyungSimConceptRouter;

})(typeof window !== 'undefined' ? window : global);
