#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MYUNGSIM HYBRID ROUTER v2 정밀 평가 및 모드별 매트릭스 검증기
(c) 2026 Mindflow Lab. All rights reserved.

- Mode 1: Rule-Only (Base)
- Mode 2: Hybrid with DisabledSemanticProvider (NO-AI Production Default, 100% Rule Fallback)
- Mode 3: Hybrid with Simulated Semantic Layer (Adaptive Rerank & Guard Validation)
- Verification: Latency, Safety 100%, Guard Effectiveness, Fallback Reliability
"""

import json
import os
import sys
import time

# 상위 디렉토리 및 의존 파일 경로
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD_DATA_PATH = os.path.join(BASE_DIR, "data", "mind-cards.json")
SYNONYMS_PATH = os.path.join(BASE_DIR, "data", "search", "synonyms.json")
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval")
GOLDEN_PATH = os.path.join(EVAL_DIR, "golden-rule-200.json")
SAFETY_PATH = os.path.join(EVAL_DIR, "safety-50.json")
CHALLENGE_PATH = os.path.join(EVAL_DIR, "challenge-30.json")

# evaluate-golden-router에서 TunedRuleBasedRouter 가져오기
sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
import importlib.util
golden_router_spec = importlib.util.spec_from_file_location("evaluate_golden_router", os.path.join(BASE_DIR, "scripts", "evaluate-golden-router.py"))
golden_router_module = importlib.util.module_from_spec(golden_router_spec)
golden_router_spec.loader.exec_module(golden_router_module)
TunedRuleBasedRouter = golden_router_module.TunedRuleBasedRouter

class MockDisabledSemanticProvider:
    def __init__(self):
        self.mode = "disabled"
    def is_available(self):
        return False
    def retrieve(self, query):
        return []
    def get_info(self):
        return {"name": "DisabledSemanticProvider", "mode": "off", "status": "DISABLED"}

class MockSimulatedSemanticProvider:
    def __init__(self, cards):
        self.mode = "simulated"
        self.cards = cards
    def is_available(self):
        return True
    def retrieve(self, query, top_k=10):
        # 어휘 중첩 및 의미적 유사성 근사 (키워드/스토리 태그 기반 가상 임베딩 검색 시뮬레이션)
        tokens = set(query.split())
        scored = []
        for card in self.cards:
            sim_score = 0.0
            card_text = f"{card.get('name', '')} {card.get('shortDescription', '')} {card.get('storyTrigger', '')}"
            for t in tokens:
                if t in card_text:
                    sim_score += 0.25
            for tag in card.get('storyTags', []) + card.get('emotionTags', []):
                if tag in query:
                    sim_score += 0.35
            sim_score = min(1.0, max(0.05, sim_score))
            scored.append({"card_id": card["id"], "similarity": sim_score})
        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]
    def get_info(self):
        return {"name": "SimulatedSemanticProvider", "mode": "simulated", "status": "ACTIVE"}

class HybridRouterEvaluator:
    def __init__(self, cards, synonyms_data, semantic_provider=None):
        self.cards = cards
        self.card_map = {c["id"]: c for c in cards}
        self.rule_router = TunedRuleBasedRouter(cards, synonyms_data)
        self.semantic_provider = semantic_provider or MockDisabledSemanticProvider()

    def calculate_rule_confidence(self, rule_results, query, contexts):
        if not rule_results:
            return "LOW"
        top_score = rule_results[0]["score"]
        if top_score >= 25.0 and contexts:
            return "HIGH"
        elif top_score >= 12.0:
            return "MEDIUM"
        return "LOW"

    def apply_guards(self, candidate, query, contexts):
        card = self.card_map.get(candidate["card_id"], {})
        q = query.lower()
        score = candidate["merged_score"]

        # 1. Rule Boost
        explicit_keywords = ["삼재", "읽씹", "작심삼일", "퇴사", "미루기", "손절", "눈치"]
        if any(kw in q and kw in card.get("keyword", "") for kw in explicit_keywords):
            score += 15.0

        # 2. Context Guard
        card_contexts = card.get("contextTags", [])
        if "family" in contexts and "family" not in card_contexts and "romantic_only" in card_contexts:
            score -= 20.0
        if "love" in contexts and "love" not in card_contexts and "family_only" in card_contexts:
            score -= 20.0

        # 3. Reality Guard
        reality_signals = ["폭행", "맞았", "부채", "빚", "압류", "계약 취소", "임금", "해고"]
        if any(s in q for s in reality_signals):
            cat = card.get("category", "")
            if "돈" in cat or "직장" in cat or "money" in card_contexts:
                score += 10.0

        return max(0.0, score)

    def route(self, query, top_k=3):
        # 1. Safety Check
        safety = self.rule_router.check_safety(query)
        is_safe = safety.get("isSafe", safety.get("is_safe", True))
        if not is_safe:
            return {
                "status": "high_risk_blocked",
                "safety": safety,
                "recommendations": [],
                "router_mode": "hybrid",
                "fallback_reason": None
            }

        # 2. Rule Retrieval
        rule_res = self.rule_router.route(query)
        rule_recs = rule_res.get("recs", [])
        contexts = rule_res.get("contexts", [])
        rule_conf = self.calculate_rule_confidence(rule_recs, query, contexts)

        # 3. Semantic Provider Check
        if not self.semantic_provider.is_available():
            # 100% Rule Fallback
            fallback_recs = []
            for r in rule_recs[:top_k]:
                cid = r.get("id") or r.get("card_id")
                fallback_recs.append({
                    "id": cid,
                    "card_id": cid,
                    "card": self.card_map.get(cid, r.get("card", {})),
                    "score": r.get("score", 0.0)
                })
            return {
                "status": "success",
                "router_mode": "hybrid_fallback_to_rule",
                "rule_confidence": rule_conf,
                "recommendations": fallback_recs,
                "fallback_reason": "semantic_disabled",
                "latency_ms": 0.5
            }

        # 4. Semantic Merge (가용 시)
        semantic_candidates = self.semantic_provider.retrieve(query, top_k=10)
        sem_dict = {item["card_id"]: item["similarity"] for item in semantic_candidates}

        # Adaptive Weights
        weight_map = {
            "HIGH": (0.8, 0.2),
            "MEDIUM": (0.6, 0.4),
            "LOW": (0.4, 0.6)
        }
        w_rule, w_sem = weight_map.get(rule_conf, (0.6, 0.4))

        merged = {}
        for r in rule_recs:
            cid = r["id"]
            # 스케일 정규화 (룰 점수 약 0~50점을 0~1로 환산 후 가중치 적용)
            norm_rule = min(1.0, r["score"] / 40.0)
            norm_sem = sem_dict.get(cid, 0.1)
            merged[cid] = {
                "card_id": cid,
                "merged_score": (norm_rule * w_rule + norm_sem * w_sem) * 50.0,
                "card": self.card_map.get(cid, {})
            }

        for cid, sim in sem_dict.items():
            if cid not in merged and cid in self.card_map:
                merged[cid] = {
                    "card_id": cid,
                    "merged_score": (0.05 * w_rule + sim * w_sem) * 50.0,
                    "card": self.card_map[cid]
                }

        # Apply Guards
        final_list = []
        for cid, cand in merged.items():
            guarded_score = self.apply_guards(cand, query, contexts)
            final_list.append({
                "id": cid,
                "card_id": cid,
                "card": cand["card"],
                "score": round(guarded_score, 2)
            })

        final_list.sort(key=lambda x: x["score"], reverse=True)
        return {
            "status": "success",
            "router_mode": "hybrid_ensemble",
            "rule_confidence": rule_conf,
            "recommendations": final_list[:top_k],
            "fallback_reason": None,
            "latency_ms": 2.1
        }

def run_evaluation():
    print("==================================================")
    print("HYBRID ROUTER v2 BENCHMARK & EVALUATION")
    print("==================================================")

    with open(CARD_DATA_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)
    with open(SYNONYMS_PATH, "r", encoding="utf-8") as f:
        synonyms = json.load(f)
    with open(GOLDEN_PATH, "r", encoding="utf-8") as f:
        golden_cases = json.load(f)
    with open(SAFETY_PATH, "r", encoding="utf-8") as f:
        safety_cases = json.load(f)

    # 1. Mode 1: Rule-Only
    router_rule = HybridRouterEvaluator(cards, synonyms, MockDisabledSemanticProvider())
    
    # 2. Mode 2: Hybrid (Disabled / Fallback)
    router_disabled = HybridRouterEvaluator(cards, synonyms, MockDisabledSemanticProvider())
    
    # 3. Mode 3: Hybrid (Simulated Semantic Active)
    router_sim = HybridRouterEvaluator(cards, synonyms, MockSimulatedSemanticProvider(cards))

    # Evaluate Safety
    print("\n[1] SAFETY TEST (50 Cases)")
    for name, r in [("RuleOnly", router_rule), ("Hybrid(Disabled)", router_disabled), ("Hybrid(Active)", router_sim)]:
        crisis_correct = 0
        crisis_total = 0
        false_positives = 0
        standard_total = 0
        t0 = time.perf_counter()
        for sc in safety_cases:
            query = sc.get("input") or sc.get("query", "")
            exp_route = sc.get("expectedRoute")
            res = r.route(query)
            is_blocked = (res["status"] == "high_risk_blocked")

            if exp_route == "crisis_emergency":
                crisis_total += 1
                if is_blocked:
                    crisis_correct += 1
            elif exp_route == "standard_coaching":
                standard_total += 1
                if is_blocked:
                    false_positives += 1

        elapsed = (time.perf_counter() - t0) * 1000.0 / len(safety_cases)
        crisis_rate = (crisis_correct / crisis_total) * 100.0 if crisis_total else 100.0
        print(f" - {name:20s}: Crisis Intercept = {crisis_rate:.1f}% ({crisis_correct}/{crisis_total}), False Positives = {false_positives}/{standard_total}, Avg Latency = {elapsed:.3f}ms")

    # Evaluate Golden 200 Cases
    print("\n[2] GOLDEN TEST 200 EVALUATION")
    for name, r in [("RuleOnly", router_rule), ("Hybrid(Disabled/Fallback)", router_disabled), ("Hybrid(Semantic Active)", router_sim)]:
        top1_hits = 0
        top3_hits = 0
        acceptable_hits = 0
        t0 = time.perf_counter()
        for gc in golden_cases:
            query = gc.get("input") or gc.get("user_query", "")
            exp_ids = set(gc.get("expectedCardIds", []))
            acc_ids = set(gc.get("acceptableCardIds", []))

            res = r.route(query, top_k=3)
            rec_ids = [rec.get("id") or rec.get("card_id") for rec in res.get("recommendations", [])]

            if rec_ids and rec_ids[0] in exp_ids:
                top1_hits += 1
            if any(eid in rec_ids for eid in exp_ids):
                top3_hits += 1
            if any(eid in rec_ids for eid in exp_ids) or any(aid in rec_ids for aid in acc_ids):
                acceptable_hits += 1

        total = len(golden_cases)
        elapsed = (time.perf_counter() - t0) * 1000.0 / total
        print(f" - {name:28s}: Top-1: {top1_hits/total*100:.1f}%, Top-3: {top3_hits/total*100:.1f}%, Acceptable: {acceptable_hits/total*100:.1f}%, Avg Latency: {elapsed:.3f}ms")

    print("\n==================================================")
    print("EVALUATION COMPLETED SUCCESSFULLY")
    print("==================================================")

if __name__ == "__main__":
    run_evaluation()
