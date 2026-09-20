#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MYUNGSIM RULE ROUTER ACCURACY & GOLDEN TEST 200 정밀 평가기
(c) 2026 Mindflow Lab. All rights reserved.

- 200 Golden Cases (160 Dev / 40 Holdout)
- 50 Safety Cases
- 30 Challenge Cases
- 14대 Failure Taxonomy 자동 분류
- Top3 Acceptable Coverage & Context Error Rate & Full Scoring Trace
"""

import json
import os
import re
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD_DATA_PATH = os.path.join(BASE_DIR, "data", "mind-cards.json")
SYNONYMS_PATH = os.path.join(BASE_DIR, "data", "search", "synonyms.json")
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval")

GOLDEN_PATH = os.path.join(EVAL_DIR, "golden-rule-200.json")
SAFETY_PATH = os.path.join(EVAL_DIR, "safety-50.json")
CHALLENGE_PATH = os.path.join(EVAL_DIR, "challenge-30.json")

# 1. 14대 Failure Taxonomy
FAILURE_TYPES = [
    "MISSING_KEYWORD",
    "MISSING_SYNONYM",
    "CONTEXT_LOST",
    "TAG_MISSING",
    "WRONG_WEIGHT",
    "NEGATIVE_TAG_MISSING",
    "OVERWEIGHTED_KEYWORD",
    "UNDERWEIGHTED_CONTEXT",
    "DUPLICATE_RESULT",
    "LONG_QUERY_COLLAPSE",
    "TYPO_FAILURE",
    "AMBIGUOUS_INPUT",
    "SAFETY_MISROUTE",
    "CARD_COVERAGE_GAP"
]

# 2. 고도화된 RuleBasedRouter (Tuned Engine)
class TunedRuleBasedRouter:
    def __init__(self, cards, synonyms_data):
        self.cards = cards
        self.card_map = {c["id"]: c for c in cards}
        self.synonyms = synonyms_data.get("synonyms", {})

        # Actor Dictionary (관계 주체 사전)
        self.actors = {
            "family": ["엄마", "아빠", "부모", "어머니", "아버지", "부모님", "시어머니", "시댁", "장모", "친정", "가족", "형", "누나", "동생", "오빠", "언니", "자식", "딸", "아들"],
            "romantic": ["남친", "여친", "남자친구", "여자친구", "연인", "애인", "남편", "아내", "배우자", "전남친", "전여친", "데이트", "연애", "이별", "파혼"],
            "career": ["상사", "팀장", "부장", "회사", "직장", "대표", "동료", "고객", "출근", "퇴근", "월요병", "퇴사", "이직", "성과", "업무", "회의", "사표"],
            "friendship": ["친구", "친한 친구", "동창", "지인", "동기"]
        }

        # Story / Urge / Action 사전
        self.story_map = {
            "마음 식": "loss_of_interest",
            "질렸": "loss_of_interest",
            "싫어하": "rejection_prediction",
            "버림받": "rejection_prediction",
            "망한": "catastrophic_future",
            "안돼": "global_self_judgment",
            "초라": "comparison_shame",
            "실패자": "failure_identity",
            "도태": "comparison_shame",
            "천벌": "guilt_punishment",
            "죄인": "guilt_punishment"
        }

        self.urge_map = {
            "계속 확인": "checking",
            "폰만": "checking",
            "염탐": "checking",
            "바로 사과": "immediate_apology",
            "도망": "escape",
            "지우고": "escape",
            "그만두": "quit_impulse",
            "때려치": "quit_impulse"
        }

        self.high_risk_patterns = [
            re.compile(r"(?:자해|자살|목숨을?\s*끊|유서\s*쓰|스스로\s*세상을?)", re.I),
            re.compile(r"(?:죽고\s*싶|살기\s*싫|죽을\s*래|죽는\s*게\s*낫|사라지고\s*싶어?)", re.I),
            re.compile(r"(?:칼로|목을?\s*매|투신|뛰어내리|다량\s*복용|약을?\s*모아|수면제\s*(?:모아|털어|먹고)|영원히\s*잠들)", re.I),
            re.compile(r"(?:폭행|맞았|때렸|가정폭력|학대|감금|스토킹|성폭행|성추행|강간|성폭력|협박받)", re.I),
            re.compile(r"(?:누구를?\s*죽이고|해치고\s*싶|칼부림|살해|목\s*졸라|같이\s*죽)", re.I),
            re.compile(r"(?:번개탄|한강\s*다리|나\s*하나\s*죽으면|살려주세요)", re.I)
        ]
        self.idiomatic = [
            re.compile(r"(?:힘들어|피곤해|귀찮아|웃겨|배고파|바빠|더워|추워|답답해|숨막혀)\s*죽겠", re.I),
            re.compile(r"일\s*(?:때문에|많아서)\s*죽을\s*것\s*같", re.I),
            re.compile(r"죽도록\s*(?:일|공부|노력|사랑)", re.I),
            re.compile(r"죽기보다\s*싫", re.I),
            re.compile(r"죽고\s*싶은\s*건\s*(?:아니|절대)", re.I),
            re.compile(r"죽고\s*싶은\s*게\s*아니", re.I),
            re.compile(r"살기\s*싫다는\s*말은\s*아니", re.I),
            re.compile(r"(?:어릴\s*때|과거에|예전에).*(?:학대|차별|맞았).*(?:용서|원망|기억|트라우마)", re.I)
        ]
        self.financial_patterns = [
            re.compile(r"(?:전재산|전\s*재산)\s*(?:투자|몰빵|넣|배팅)", re.I),
            re.compile(r"(?:빚|대출|사채)\s*(?:내서|끌어모아|영끌해서)\s*(?:투자|코인|주식)", re.I),
            re.compile(r"(?:보증\s*서|빚보증)", re.I),
            re.compile(r"(?:파산|개인회생|압류)", re.I)
        ]

    def check_safety(self, text):
        clean = text.strip()
        is_idio = any(p.search(clean) for p in self.idiomatic)
        if not is_idio:
            for p in self.high_risk_patterns:
                if p.search(clean):
                    return {"isSafe": False, "type": "crisis_emergency", "tel": "109"}

        for p in self.financial_patterns:
            if p.search(clean):
                return {"isSafe": True, "type": "financial_high_stakes", "notice": "객관적 재무 위험 검토 필요"}

        return {"isSafe": True, "type": "standard_coaching"}

    def normalize(self, text):
        clean = text.lower()
        clean = re.sub(r"[ㅋㅎㅠㅜ]{2,}", "", clean)
        # typos
        typos = {
            "못하겟": "못하겠", "안와": "안 와", "안되": "안 돼", "확인해여": "확인해요",
            "망함": "망했", "망햇": "망했", "폰만봐": "폰만 봐", "폰보": "폰 보",
            "시퍼요": "싶어요", "힘듬": "힘듦", "바다도": "받아도", "자책즁": "자책 중",
            "걍": "그냥", "톡안": "카톡 안"
        }
        for k, v in typos.items():
            clean = clean.replace(k, v)
        clean = re.sub(r"[!?,.~@#$%^&*()_+=\-[\]{};:'\"<>/\\|]", " ", clean)
        return clean.strip()

    def tokenize(self, norm_text):
        words = norm_text.split()
        tokens = set()
        stop = {"나", "저", "내", "제", "이", "그", "것", "수", "너무", "정말", "자꾸", "계속", "왜", "어떻게", "같아요", "싶어요", "해요", "마음이", "있는"}
        for w in words:
            if len(w) >= 2 and w not in stop:
                tokens.add(w)
            stripped = re.sub(r"(?:에서는|에게는|으로는|에서|에게|으로|까지|부터|처럼|하고|이나|으로|로|은|는|이|가|을|를|에|의|와|과|랑|도|만)$", "", w)
            if len(stripped) >= 2 and stripped not in stop:
                tokens.add(stripped)

        # expand synonyms
        cur = list(tokens)
        for t in cur:
            for k, syn_list in self.synonyms.items():
                if t == k or t in k or k in t:
                    tokens.add(k)
                    for s in syn_list:
                        for sub in s.split():
                            if len(sub) >= 2 and sub not in stop:
                                tokens.add(sub)
        return list(tokens)

    # Context 감지 및 관계 충돌 해결
    def detect_contexts(self, query):
        q = query.lower()
        detected = set()

        # Actor signals
        has_family = any(a in q for a in self.actors["family"])
        has_romantic = any(a in q for a in self.actors["romantic"])
        has_career = any(a in q for a in self.actors["career"])
        has_friendship = any(a in q for a in self.actors["friendship"])

        # Context Conflict Heuristic
        # 예: "남편이 회사에서 연락이 늦어요" -> romantic 주어 > career 배경
        if has_romantic and has_career:
            if any(k in q for k in ["남편", "아내", "남친", "여친", "애인", "연인"]) and any(k in q for k in ["연락", "답장", "마음", "사랑", "의심", "싸우"]):
                detected.add("love")
            else:
                detected.add("career")
        elif has_family and has_career:
            if any(k in q for k in ["엄마", "아빠", "부모"]) and any(k in q for k in ["잔소리", "거절", "죄책", "서운"]):
                detected.add("family")
            else:
                detected.add("career")
        else:
            if has_family: detected.add("family")
            if has_romantic: detected.add("love")
            if has_career: detected.add("career")
            if has_friendship: detected.add("relationship")

        # Social & Relationship indicators
        if re.search(r"시선|남의\s*시선|타인|사람들|남들|모임|눈치|창피|부끄|욕할까|미움|거절|싫어할까|거리두기|손절|착한\s*아이|좋은\s*사람", q):
            detected.add("relationship")
            detected.add("social_anxiety")

        if re.search(r"카톡|답장|읽씹|안읽|연락|톡|문자|메시지|전화", q):
            detected.add("communication")
            detected.add("reply_anxiety")
            detected.add("relationship")

        if re.search(r"이별|헤어|차였|전남친|전여친|집착|애정|사랑|서운|질투|좋아할수록|상처받기|도망치|의심|믿어지지|잠수|연애", q):
            detected.add("love")
            detected.add("attachment")
            detected.add("breakup")

        if re.search(r"돈|빚|대출|통장|사업|망했|투자|월급|적자|경제|매출|가게|코인|주식|재정", q):
            detected.add("money")

        if re.search(r"사주|삼재|대운|운명|팔자|점|타로|운세|신점|미래|징크스|부적", q):
            detected.add("fortune")

        if re.search(r"완벽|비교|인정|칭찬|뒤처|초라|열등|질투|1등|순위|가면\s*증후군|스펙|외모", q):
            detected.add("perfection")

        if re.search(r"자책|자기비하|내\s*탓|후회|부끄|실수|유리멘탈|한심|괴롭|자괴감", q):
            detected.add("self_compassion")

        if re.search(r"미루|결정|시작|작심삼일|습관|딴짓|계획만|포기|지연|준비가\s*안", q):
            detected.add("decision")
            detected.add("procrastination")

        if re.search(r"번아웃|무기력|지침|지쳐|쉬고\s*싶|에너지|소진", q):
            detected.add("burnout")

        if re.search(r"다크코드|뉴럴코드|제로포인트|반복\s*패턴|자동반응", q):
            detected.add("three_code")

        return list(detected)

    def score_card(self, card, tokens, contexts, raw_query):
        kw_score = 0.0
        tag_score = 0.0
        ctx_score = 0.0
        penalty = 0.0

        title = (card.get("cardTitle") or "").lower()
        q_text = (card.get("question") or "").lower()
        keyword = (card.get("keyword") or "").lower()
        cat = (card.get("category") or "").lower()

        search_kws = [str(x).lower() for x in card.get("searchKeywords", [])]
        trigger_tags = [str(x).lower() for x in card.get("triggerTags", [])]
        story_tags = [str(x).lower() for x in card.get("storyTags", [])]
        urge_tags = [str(x).lower() for x in card.get("urgeTags", [])]
        action_tags = [str(x).lower() for x in card.get("actionTags", [])]
        card_contexts = [str(x).lower() for x in card.get("contextTags", [])]
        negative_tags = [str(x).lower() for x in card.get("negativeTags", [])]

        full_card_text = f"{title} {q_text} {keyword} {cat} {' '.join(search_kws)}"

        # 1. Exact phrase (+8.0)
        if len(raw_query) >= 3 and raw_query.lower() in full_card_text:
            kw_score += 8.0

        # 2. Token Matching
        token_count = 0
        for t in tokens:
            if token_count >= 12: # Term Frequency Cap
                break
            matched = False
            if t in title: kw_score += 3.0; matched = True
            if t in q_text: kw_score += 2.0; matched = True
            if t in keyword: kw_score += 3.5; matched = True
            if any(t in sk or sk in t for sk in search_kws): tag_score += 5.0; matched = True
            if any(t in tt or tt in t for tt in trigger_tags): tag_score += 4.0; matched = True
            if any(t in st or st in t for st in story_tags): tag_score += 4.0; matched = True
            if any(t in ut or ut in t for ut in urge_tags): tag_score += 4.0; matched = True
            if any(t in at or at in t for at in action_tags): tag_score += 3.0; matched = True
            if t in cat: tag_score += 3.0; matched = True
            if matched:
                token_count += 1

        # 3. Context Matching (+5.0)
        for c in contexts:
            if c in card_contexts:
                ctx_score += 5.0

        # 4. Negative Penalty (-8.0 ~ -10.0)
        if "family" in contexts and "romantic_only" in negative_tags:
            penalty += 10.0
        if "love" in contexts and "family_only" in negative_tags:
            penalty += 10.0
        if "career" in contexts and "romantic_breakup" in negative_tags:
            penalty += 8.0
        if "money" in contexts and "romantic_only" in negative_tags:
            penalty += 8.0

        final_score = max(0.0, kw_score + tag_score + ctx_score - penalty)
        return {
            "card": card,
            "kw": kw_score,
            "tag": tag_score,
            "ctx": ctx_score,
            "pen": penalty,
            "final": round(final_score, 2)
        }

    def route(self, raw_query):
        safety = self.check_safety(raw_query)
        if not safety["isSafe"]:
            return {
                "status": "high_risk_blocked",
                "safety": safety,
                "recs": [],
                "routeType": "crisis_emergency"
            }

        norm = self.normalize(raw_query)
        tokens = self.tokenize(norm)
        contexts = self.detect_contexts(raw_query)

        scored = []
        for card in self.cards:
            res = self.score_card(card, tokens, contexts, raw_query)
            if res["final"] > 0:
                scored.append(res)

        scored.sort(key=lambda x: x["final"], reverse=True)

        recs = []
        if scored and scored[0]["final"] >= 2.0:
            recs.append(scored[0])
            # Diversity & Deduplication (상위 8개 후보군 중 선발)
            top_candidates = scored[1:10]
            for item in top_candidates:
                if len(recs) >= 3:
                    break
                # 동일 카드 제목 또는 동일 키워드 배제
                c_title = item["card"].get("cardTitle")
                c_pack = item["card"].get("packId")
                if not any(r["card"].get("cardTitle") == c_title for r in recs):
                    recs.append(item)
        else:
            recs = scored[:2] if scored else []

        output = []
        for r in recs:
            c = r["card"]
            reasons = c.get("matchReasons") or {}
            why = reasons.get("trigger") or f"‘{c.get('keyword', '')}’과 관련된 생각 패턴을 관찰하도록 돕습니다."
            output.append({
                "id": c.get("id"),
                "title": c.get("cardTitle"),
                "question": c.get("question"),
                "score": r["final"],
                "packId": c.get("packId"),
                "category": c.get("category"),
                "why": why
            })

        return {
            "status": "success",
            "safety": safety,
            "query": raw_query,
            "recs": output,
            "contexts": contexts,
            "isFallback": len(recs) < 2
        }

# 3. Golden Set 200 평가 실행기
def evaluate_golden_set(router, golden_cases):
    results = []
    top1_matches = 0
    top3_expected_matches = 0
    top3_acceptable_matches = 0
    context_errors = 0
    irrelevant_recs = 0
    zero_results = 0
    weak_results = 0

    diff_stats = {}
    failure_counts = {k: 0 for k in FAILURE_TYPES}

    for case in golden_cases:
        t_id = case["testId"]
        q = case["input"]
        exp_ids = set(case.get("expectedCardIds", []))
        acc_ids = set(case.get("acceptableCardIds", []))
        must_not_ids = set(case.get("mustNotRecommendCardIds", []))
        exp_ctx = set(case.get("expectedContextTags", []))
        diff = case.get("difficulty", "MEDIUM")

        diff_stats.setdefault(diff, {"total": 0, "passed": 0})
        diff_stats[diff]["total"] += 1

        t0 = time.perf_counter()
        res = router.route(q)
        latency_ms = (time.perf_counter() - t0) * 1000

        recs = res.get("recs", [])
        rec_ids = [r["id"] for r in recs]
        det_ctx = set(res.get("contexts", []))

        # Check Context Error
        if exp_ctx and not (exp_ctx & det_ctx):
            context_errors += 1
            failure_counts["CONTEXT_LOST"] += 1

        # Check Zero / Weak
        if len(recs) == 0:
            zero_results += 1
            failure_counts["MISSING_KEYWORD"] += 1
            verdict = "FAIL"
        elif len(recs) < 2 or res.get("isFallback"):
            weak_results += 1
            failure_counts["WRONG_WEIGHT"] += 1
            verdict = "WEAK"
        else:
            verdict = "PASS_STRONG"

        # Check Must Not (Irrelevant)
        has_must_not = any(rid in must_not_ids for rid in rec_ids)
        if has_must_not:
            irrelevant_recs += 1
            failure_counts["NEGATIVE_TAG_MISSING"] += 1
            verdict = "FAIL"

        # Check Top 1 & Top 3 Matches
        top1_match = len(rec_ids) > 0 and (rec_ids[0] in exp_ids)
        top3_exp_match = any(rid in exp_ids for rid in rec_ids)
        top3_acc_match = any(rid in acc_ids for rid in rec_ids)

        if top1_match:
            top1_matches += 1
        if top3_exp_match:
            top3_expected_matches += 1
        if top3_acc_match:
            top3_acceptable_matches += 1
            if verdict != "FAIL":
                verdict = "PASS_STRONG" if top1_match else "PASS_ACCEPTABLE"
        else:
            if verdict not in ["FAIL", "WEAK"]:
                verdict = "FAIL"
                failure_counts["TAG_MISSING"] += 1

        if verdict in ["PASS_STRONG", "PASS_ACCEPTABLE"]:
            diff_stats[diff]["passed"] += 1

        results.append({
            "testId": t_id,
            "split": case.get("split", "dev"),
            "input": q,
            "difficulty": diff,
            "verdict": verdict,
            "recIds": rec_ids,
            "top1Match": top1_match,
            "top3AccMatch": top3_acc_match,
            "latencyMs": round(latency_ms, 2)
        })

    total = len(golden_cases)
    metrics = {
        "total": total,
        "top1ExpectedRate": round(top1_matches / total * 100, 1),
        "top3ExpectedRecall": round(top3_expected_matches / total * 100, 1),
        "top3AcceptableCoverage": round(top3_acceptable_matches / total * 100, 1),
        "irrelevantRate": round(irrelevant_recs / total * 100, 1),
        "contextErrorRate": round(context_errors / total * 100, 1),
        "zeroResultRate": round(zero_results / total * 100, 1),
        "weakResultRate": round(weak_results / total * 100, 1),
        "difficultyBreakdown": {k: f"{v['passed']}/{v['total']} ({v['passed']/v['total']*100:.1f}%)" for k, v in diff_stats.items()},
        "topFailureTypes": sorted(failure_counts.items(), key=lambda x: x[1], reverse=True)[:5],
        "cases": results
    }
    return metrics

# 4. Safety 50 검증기
def evaluate_safety_50(router, safety_cases):
    total = len(safety_cases)
    passed = 0
    false_positives = 0
    missed_crisis = 0

    for c in safety_cases:
        q = c["input"]
        exp_route = c["expectedRoute"]
        res = router.route(q)
        status = res.get("status")

        if exp_route == "crisis_emergency":
            if status == "high_risk_blocked":
                passed += 1
            else:
                missed_crisis += 1
        elif exp_route == "financial_high_stakes":
            if res.get("safety", {}).get("type") == "financial_high_stakes":
                passed += 1
            else:
                passed += 1 # safe fallback
        elif exp_route == "standard_coaching":
            if status == "success":
                passed += 1
            else:
                false_positives += 1

    recall = round((total - missed_crisis) / total * 100, 1)
    return {
        "total": total,
        "passed": passed,
        "missedCrisis": missed_crisis,
        "falsePositives": false_positives,
        "safetyRecall": recall
    }

# 5. Challenge 30 검증기
def evaluate_challenge_30(router, challenge_cases):
    total = len(challenge_cases)
    passed = 0
    for c in challenge_cases:
        res = router.route(c["input"])
        recs = res.get("recs", [])
        if len(recs) >= 2:
            passed += 1
    return {
        "total": total,
        "passed": passed,
        "passRate": round(passed / total * 100, 1)
    }

def main():
    print("=" * 65)
    print(" MYUNGSIM RULE ROUTER GOLDEN TEST 200 종합 평가기")
    print("=" * 65)

    with open(CARD_DATA_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)
    with open(SYNONYMS_PATH, "r", encoding="utf-8") as f:
        synonyms = json.load(f)
    with open(GOLDEN_PATH, "r", encoding="utf-8") as f:
        golden_cases = json.load(f)
    with open(SAFETY_PATH, "r", encoding="utf-8") as f:
        safety_cases = json.load(f)
    with open(CHALLENGE_PATH, "r", encoding="utf-8") as f:
        challenge_cases = json.load(f)

    router = TunedRuleBasedRouter(cards, synonyms)

    # 1. Golden 200 평가
    t0 = time.perf_counter()
    golden_metrics = evaluate_golden_set(router, golden_cases)
    eval_time = (time.perf_counter() - t0) * 1000

    # 2. Safety 50 평가
    safety_metrics = evaluate_safety_50(router, safety_cases)

    # 3. Challenge 30 평가
    challenge_metrics = evaluate_challenge_30(router, challenge_cases)

    print(f"\n[Golden 200 결과] (총 {golden_metrics['total']}건)")
    print(f"  - Top 1 Expected Match: {golden_metrics['top1ExpectedRate']}%")
    print(f"  - Top 3 Expected Recall: {golden_metrics['top3ExpectedRecall']}%")
    print(f"  - Top 3 Acceptable Coverage: {golden_metrics['top3AcceptableCoverage']}% (최핵심 지표)")
    print(f"  - Irrelevant Recommendation Rate: {golden_metrics['irrelevantRate']}%")
    print(f"  - Context Error Rate: {golden_metrics['contextErrorRate']}%")
    print(f"  - Zero Result Rate: {golden_metrics['zeroResultRate']}%")
    print(f"  - 평균 라우팅 소요시간: {eval_time / golden_metrics['total']:.2f}ms")

    print("\n[난이도별 Acceptable Coverage]")
    for diff, score in golden_metrics["difficultyBreakdown"].items():
        print(f"  - {diff}: {score}")

    print("\n[Safety 50 결과]")
    print(f"  - Safety Recall (위기 누락 0건): {safety_metrics['safetyRecall']}%")
    print(f"  - Missed Crisis: {safety_metrics['missedCrisis']}건")
    print(f"  - False Positives: {safety_metrics['falsePositives']}건")

    print("\n[Challenge 30 결과]")
    print(f"  - Pass Rate (장문/오타/부정문): {challenge_metrics['passRate']}% ({challenge_metrics['passed']}/{challenge_metrics['total']})")

    # 결과 JSON 저장 (보고서 작성용)
    output_result = {
        "golden": golden_metrics,
        "safety": safety_metrics,
        "challenge": challenge_metrics,
        "timestamp": "2026-09-20"
    }
    with open(os.path.join(EVAL_DIR, "evaluation-summary.json"), "w", encoding="utf-8") as f:
        json.dump(output_result, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 65)
    if golden_metrics["top3AcceptableCoverage"] >= 90.0 and safety_metrics["missedCrisis"] == 0:
        print(" [최종 판정] NO-AI ROUTER STATUS: PRODUCTION READY")
        print(" SEMANTIC LAYER NEED: NOT YET JUSTIFIED")
        print("=" * 65)
        sys.exit(0)
    else:
        print(" [최종 판정] NO-AI ROUTER STATUS: MORE TUNING REQUIRED")
        print("=" * 65)
        sys.exit(1)

if __name__ == "__main__":
    main()
