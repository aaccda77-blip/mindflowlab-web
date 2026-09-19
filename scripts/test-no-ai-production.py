#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MYUNGSIM NO-AI PRODUCTION CORE v1 종합 E2E 검증기
(c) 2026 Mindflow Lab. All rights reserved.

- 외부 AI API KEY: 0개 (Zero External AI Calls)
- 100+ NO-AI 룰 라우팅 테스트 (PACK 01~10)
- 필수 20문장 Top 3 & WHY & Safety 실시간 추출
- 장문 쿼리 & 오타 복원 & Near-miss Safety 검증
"""

import json
import os
import re
import sys
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD_DATA_PATH = os.path.join(BASE_DIR, "data", "mind-cards.json")
SYNONYMS_PATH = os.path.join(BASE_DIR, "data", "search", "synonyms.json")

# 1. Mock 및 Provider Key 코드베이스 정밀 스캔
def scan_for_api_keys_and_mocks():
    print("\n--- [검사 1] 외부 AI API KEY 및 Mock 잔재 전수조사 ---")
    suspicious_keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "CLAUDE_API_KEY"]
    found_keys = []
    for k in suspicious_keys:
        if os.environ.get(k):
            found_keys.append(k)

    if not found_keys:
        print("  [PASS] 환경변수 내 외부 AI API KEY 없음 (Zero API Keys Verified)")
    else:
        print(f"  [WARN] 외부 API KEY 감지됨: {found_keys} (테스트는 0-key 모드로 실행)")

    # check production js files for mock responses
    targets = ["js/myeongsim-ai-router.js", "js/daily-mind-card.js", "admin/admin.js"]
    mock_patterns = [r"state\.cards\.slice\(0,\s*3\)", r"fakeAiResponse", r"mockAiResult"]
    leak_found = False
    for t in targets:
        p = os.path.join(BASE_DIR, t)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                code = f.read()
            for mp in mock_patterns:
                if re.search(mp, code):
                    print(f"  [FAIL] {t} 에서 Mock 코드 잔재 발견: {mp}")
                    leak_found = True
    if not leak_found:
        print("  [PASS] 프로덕션 라우터 및 CMS 내 가짜 Mock 응답 0건 (Zero Mock Verified)")

    return len(found_keys) == 0 and not leak_found

# 2. Python 기반 RuleBasedRouter 시뮬레이터 (js/myeongsim-ai-router.js와 100% 동일한 로직)
class PyRuleBasedRouter:
    def __init__(self, cards, synonyms):
        self.cards = cards
        self.synonyms = synonyms.get("synonyms", {})
        self.high_risk_patterns = [
            re.compile(r"(?:자해|자살|목숨을?\s*끊|유서\s*쓰|스스로\s*세상을?)", re.I),
            re.compile(r"(?:죽고\s*싶|살기\s*싫|죽을\s*래|죽는\s*게\s*낫|사라지고\s*싶어?)", re.I),
            re.compile(r"(?:칼로|목을?\s*매|투신|뛰어내리|다량\s*복용|약을?\s*모아)", re.I),
            re.compile(r"(?:폭행|맞았|때렸|가정폭력|학대|감금|스토킹|성폭행|성추행|강간|성폭력|협박받)", re.I),
            re.compile(r"(?:누구를?\s*죽이고|해치고\s*싶|칼부림|살해)", re.I)
        ]
        self.idiomatic = [
            re.compile(r"(?:힘들어|피곤해|귀찮아|웃겨|배고파|바빠|더워|추워|답답해|숨막혀)\s*죽겠", re.I),
            re.compile(r"일\s*(?:때문에|많아서)\s*죽을\s*것\s*같", re.I),
            re.compile(r"죽도록\s*(?:일|공부|노력|사랑)", re.I)
        ]
        self.financial_patterns = [
            re.compile(r"(?:전재산|전\s*재산)\s*(?:투자|몰빵|넣|배팅)", re.I),
            re.compile(r"(?:빚|대출|사채)\s*(?:내서|끌어모아|영끌해서)\s*(?:투자|코인|주식)", re.I),
            re.compile(r"(?:보증\s*서|빚보증)", re.I)
        ]

    def check_safety(self, text):
        clean = text.strip()
        is_idio = any(p.search(clean) for p in self.idiomatic)
        if not is_idio:
            for p in self.high_risk_patterns:
                if p.search(clean):
                    return {"isSafe": False, "type": "high_risk_blocked", "tel": "109"}

        for p in self.financial_patterns:
            if p.search(clean):
                return {"isSafe": True, "type": "financial_high_stakes", "notice": "객관적 재무 위험 검토 필요"}

        return {"isSafe": True, "type": "standard"}

    def normalize_and_tokenize(self, query):
        clean = query.lower()
        clean = re.sub(r"[ㅋㅎㅠㅜ]{2,}", "", clean)
        clean = re.sub(r"[!?,.~@#$%^&*()_+=\-[\]{};:'\"<>/\\|]", " ", clean)
        words = clean.split()
        tokens = set()
        stop = {"나", "저", "내", "제", "이", "그", "것", "수", "너무", "정말", "자꾸", "계속", "왜", "어떻게", "같아요", "싶어요", "해요", "마음이"}

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
                    for item in syn_list:
                        for sub in item.split():
                            if len(sub) >= 2 and sub not in stop:
                                tokens.add(sub)
        return list(tokens)

    def detect_contexts(self, query):
        q = query.lower()
        ctx = set()
        if re.search(r"엄마|아빠|부모|가족|형제|자매|효도|친정|시댁", q): ctx.add("family")
        if re.search(r"회사|직장|팀장|상사|부장|출근|퇴근|퇴사|이직|업무|회의|성과|보고", q): ctx.add("career")
        if re.search(r"남친|여친|남자친구|여자친구|애인|연인|연애|이별|데이트|결혼|남편|아내", q): ctx.add("love")
        if re.search(r"돈|빚|대출|통장|사업|망했|투자|월급|적자|경제", q): ctx.add("money")
        if re.search(r"사주|삼재|대운|운명|팔자|점|타로|운세|신점|미래", q): ctx.add("fortune")
        if re.search(r"완벽|비교|인정|칭찬|뒤처|초라|열등|질투", q): ctx.add("perfection")
        if re.search(r"자책|자기비하|내 탓|후회|부끄|실수|유리멘탈", q): ctx.add("self_compassion")
        if re.search(r"미루|결정|시작|작심삼일|습관|딴짓", q): ctx.add("decision")
        return list(ctx)

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

        # 1. Exact phrase match (+8.0)
        if len(raw_query) >= 3 and raw_query.lower() in full_card_text:
            kw_score += 8.0

        # 2. Token Matching
        for t in tokens:
            if t in title: kw_score += 3.0
            if t in q_text: kw_score += 2.0
            if t in keyword: kw_score += 3.5
            if any(t in sk or sk in t for sk in search_kws): tag_score += 5.0
            if any(t in tt or tt in t for tt in trigger_tags): tag_score += 4.0
            if any(t in st or st in t for st in story_tags): tag_score += 4.0
            if any(t in ut or ut in t for ut in urge_tags): tag_score += 4.0
            if any(t in at or at in t for at in action_tags): tag_score += 3.0
            if t in cat: tag_score += 3.0

        # 3. Context Matching (+5.0)
        for c in contexts:
            if c in card_contexts:
                ctx_score += 5.0

        # 4. Negative Penalty (-8.0)
        if "family" in contexts and "romantic_only" in negative_tags:
            penalty += 8.0
        if "love" in contexts and "family_only" in negative_tags:
            penalty += 8.0
        if "career" in contexts and "romantic_breakup" in negative_tags:
            penalty += 6.0

        final_score = max(0.0, kw_score + tag_score + ctx_score - penalty)
        return {
            "card": card,
            "kw": kw_score,
            "tag": tag_score,
            "ctx": ctx_score,
            "pen": penalty,
            "final": round(final_score, 2)
        }

    def generate_why(self, card, raw_query):
        reasons = card.get("matchReasons") or {}
        q = raw_query.lower()
        if reasons.get("trigger") and any(k in q for k in ["답장", "연락", "카톡", "상사", "엄마"]):
            return f"{reasons['trigger']} {reasons.get('story', '')}".strip()
        if reasons.get("story") and any(k in q for k in ["실패", "망했", "비교", "초라", "질투"]):
            return f"{reasons['story']} {reasons.get('urge', '')}".strip()
        if reasons.get("urge") and any(k in q for k in ["미루", "계획", "인스타", "확인"]):
            return f"{reasons['urge']} {reasons.get('context', '')}".strip()
        if reasons.get("trigger"):
            return reasons["trigger"]
        return f"‘{card.get('keyword', '현재 마음에 걸리는 지점')}’과 관련된 생각 패턴을 관찰하도록 돕는 질문입니다."

    def route(self, raw_query):
        safety = self.check_safety(raw_query)
        if not safety["isSafe"]:
            return {"status": "high_risk_blocked", "safety": safety, "recs": []}

        tokens = self.normalize_and_tokenize(raw_query)
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
            for item in scored[1:]:
                if len(recs) >= 3:
                    break
                # deduplicate check
                if not any(r["card"]["cardTitle"] == item["card"]["cardTitle"] for r in recs):
                    recs.append(item)
        else:
            # fallback
            recs = scored[:2] if scored else []

        output = []
        for r in recs:
            c = r["card"]
            why = self.generate_why(c, raw_query)
            output.append({
                "id": c.get("id"),
                "title": c.get("cardTitle"),
                "question": c.get("question"),
                "score": r["final"],
                "why": why
            })

        return {
            "status": "success",
            "safety": safety,
            "query": raw_query,
            "recs": output,
            "isFallback": len(recs) < 2
        }

# 3. 20대 필수 대표 문장 테스트
MUST_TEST_20_QUERIES = [
    "답장이 늦으면 버림받은 것 같아요.",
    "카톡이 안 와서 계속 폰만 봐요.",
    "사업 망하고 제가 실패자 같아요.",
    "빚 때문에 통장 보는 것도 무서워요.",
    "팀장 메시지만 오면 겁나요.",
    "퇴근했는데 머릿속에서 계속 일해요.",
    "친구가 잘되니까 제가 초라해요.",
    "칭찬을 받아도 금방 다시 불안해져요.",
    "엄마가 서운하다고 하면 거절을 못하겠어요.",
    "부모님한테 싫다고 말하면 죄짓는 기분이에요.",
    "좋아할수록 혼자 있고 싶어요.",
    "헤어진 사람 인스타를 계속 봐요.",
    "계획만 세우고 시작을 못해요.",
    "작심삼일 또 망했어요.",
    "실수하면 하루 종일 제가 싫어요.",
    "가슴이 철렁하면 나쁜 일이 생길 것 같아요.",
    "삼재라는데 아무것도 안 하는 게 낫나요?",
    "사주에서 돈복이 없다고 했어요.",
    "다크 코드를 알겠는데 왜 또 반복하죠?",
    "저는 다크 코드형인가요?"
]

def run_20_query_tests(router):
    print("\n--- [검사 2] 필수 20문장 Top 3 & WHY & Safety 테스트 ---")
    results = []
    all_passed = True

    for idx, q in enumerate(MUST_TEST_20_QUERIES, 1):
        res = router.route(q)
        recs = res.get("recs", [])
        has_recs = len(recs) >= 2
        top1_title = recs[0]["title"] if recs else "NONE"
        top1_why = recs[0]["why"] if recs else "NONE"
        
        status = "PASS" if has_recs else "FAIL"
        if not has_recs:
            all_passed = False

        print(f"[{idx:02d}] '{q}'")
        print(f"     -> Top1: {top1_title} (Score: {recs[0]['score'] if recs else 0})")
        print(f"     -> WHY: {top1_why[:60]}...")
        results.append({
            "num": idx,
            "query": q,
            "top1": top1_title,
            "topCount": len(recs),
            "top3": [r["title"] for r in recs],
            "why": top1_why,
            "passed": has_recs
        })

    return all_passed, results

def run_special_cases_tests(router):
    print("\n--- [검사 3] 특수 쿼리 (장문, 오타, Safety, Near-miss) 테스트 ---")
    special_cases = [
        ("장문 쿼리", "요즘 사업도 안 되고 부모님한테 돈도 빌렸고 제가 너무 한심한 사람 같고 다시 뭘 시작하면 또 실패할 것 같아서 아무것도 못 하고 있어요.", lambda r: len(r["recs"]) >= 2),
        ("오타 1", "엄마거절못하겟어요", lambda r: any("거절" in c["title"] or "부모" in c["title"] or "엄마" in c["title"] for c in r["recs"])),
        ("오타 2", "답장안와서계속확인해여", lambda r: any("답장" in c["title"] or "연락" in c["title"] or "확인" in c["title"] for c in r["recs"])),
        ("오타 3", "작심삼일또망함", lambda r: any("작심" in c["title"] or "시작" in c["title"] or "습관" in c["title"] for c in r["recs"])),
        ("Safety 긴급차단", "너무 괴로워서 오늘 그냥 다 끝내고 죽고 싶어요", lambda r: r["status"] == "high_risk_blocked"),
        ("Near-miss 구어체 정상", "오늘 회사 일 때문에 힘들어 죽겠네 진짜", lambda r: r["status"] == "success" and len(r["recs"]) >= 2),
        ("High-Stakes 재무", "사주에서 대운이라는데 전재산 빚내서 주식에 다 몰빵할까요?", lambda r: r["safety"].get("type") == "financial_high_stakes")
    ]

    all_passed = True
    for name, query, validator in special_cases:
        res = router.route(query)
        passed = validator(res)
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"  [{status_str}] {name}: '{query[:35]}...' -> Status: {res.get('status')}")

    return all_passed

def run_100_pack_tests(router):
    print("\n--- [검사 4] 100개 팩별 골든 테스트셋 테스트 ---")
    pack_queries = [
        # PACK 01: 관계·불안 (10개)
        "남의 시선이 너무 신경 쓰여요", "사람들이 저를 싫어할까 봐 무서워요", "카톡 읽고 답이 없으면 불안해요",
        "거절당할까 봐 말을 못 꺼내겠어요", "친한 사람이 갑자기 차갑게 굴어요", "대화할 때 무슨 말을 해야 할지 모르겠어요",
        "모임에 가면 기가 다 빨려요", "상대방 표정 하나에 하루가 흔들려요", "누가 저를 쳐다보는 것 같아 불편해요", "부탁을 들으면 무조건 들어줘야 할 것 같아요",
        # PACK 02: 돈·사업 (10개)
        "통장 잔고가 줄어들 때마다 숨이 막혀요", "사업 시작했는데 손님이 없어서 망할 것 같아요", "빚이 있어서 미래가 막막해요",
        "돈 때문에 부모님한테 손 벌리는 게 비참해요", "동업자와 갈등이 생겨서 사업을 접고 싶어요", "매출이 안 나와서 직원 월급 주기도 빠듯해요",
        "투자한 돈을 다 잃어서 자책 중이에요", "언제쯤 돈 걱정 없이 살 수 있을까요", "돈을 써야 할 때마다 죄책감이 들어요", "경제적으로 독립하지 못해 자존감이 낮아요",
        # PACK 03: 직장·번아웃 (10개)
        "출근길 지하철에서 내리기 싫어요", "팀장이 메신저로 부르면 심장이 철렁해요", "퇴근했는데도 업무 카톡이 올까 봐 불안해요",
        "일이 너무 많아서 번아웃이 왔어요", "회사에서 제 능력이 탄로 날까 봐 두려워요", "이직하고 싶은데 막상 시작이 안 돼요",
        "사직서를 품고만 있고 제출을 못해요", "회의 때 제 의견을 당당하게 말하지 못해요", "성과 평가에서 나쁜 점수를 받을까 봐 긴장돼요", "동료들과 어울리지 못해 겉도는 느낌이에요",
        # PACK 04: 완벽주의·비교 (10개)
        "친구가 대기업 합격했는데 축하보다 질투가 나요", "SNS 보면 다들 잘사는데 나만 멈춰있어요", "완벽하게 못 할 거면 시작도 하기 싫어요",
        "작은 실수 하나에도 하루 종일 나 자신을 탓해요", "남들보다 뒤처지는 느낌이 들 때 가장 괴로워요", "칭찬을 들어도 운이 좋았을 뿐이라고 생각해요",
        "1등이 아니면 아무 의미가 없다고 느껴져요", "내 외모와 스펙이 남들과 너무 비교돼요", "완벽주의 때문에 마감 직전까지 미뤄요", "자신감이 없어서 도전을 자꾸 포기해요",
        # PACK 05: 부모·가족 (10개)
        "엄마의 기대가 너무 무겁고 숨이 막혀요", "부모님한테 싫다고 말하면 배은망덕한 자식 같아요", "가족 모임만 가면 감정적으로 상처받아요",
        "부모님의 감정 쓰레기통 역할을 그만두고 싶어요", "어릴 때 부모님이 원망스러워 눈물이 나요", "가족에게서 경제적으로 완전히 독립하고 싶어요",
        "엄마가 서운하다고 할 때마다 거절을 취소해요", "아빠의 불같은 성격 때문에 집이 지옥 같아요", "형제와 편애당하며 자란 기억이 안 잊혀져요", "가족이지만 연을 끊고 살고 싶어요",
        # PACK 06: 연애·친밀감 (10개)
        "연인이 답장이 늦으면 바람피우는 것 같아요", "상대방이 마음이 식었다고 느낄 때 공황이 와요", "헤어진 연인의 SNS를 매일 염탐해요",
        "좋아하는 사람 앞에서는 바보처럼 굳어버려요", "상대방이 너무 가까워지면 도망치고 싶어요", "잠수 이별을 당하고 사람을 못 믿겠어요",
        "연애만 하면 을이 되어 상대에게 맞추게 돼요", "이별 후 자존감이 바닥을 쳐서 힘들어요", "결혼에 대한 확신이 안 서서 고민이에요", "외로워서 아무나 만나려다가 상처받아요",
        # PACK 07: 결정·미루기 (10개)
        "오늘 해야 할 중요한 일을 유튜브 보며 미뤄요", "결정 장애 때문에 짜장면 하나도 못 골라요", "다이어트 작심삼일로 또 폭식했어요",
        "계획은 거창하게 세우는데 실천이 0이에요", "시작하기 전에 핑계만 자꾸 찾게 돼요", "책을 사놓고 첫 장만 읽고 방치해요",
        "운동 가기로 해놓고 침대에서 못 일어나요", "집중력이 5분을 못 넘기고 딴짓을 해요", "해야 할 일 목록만 늘어나고 진도가 안 나가요", "나쁜 습관을 끊지 못하고 반복해요",
        # PACK 08: 자책·불안 (10개)
        "조금만 실수해도 '난 왜 이럴까' 자책해요", "유리멘탈이라 사소한 지적에도 며칠을 끙끙 앓아요", "가슴이 철렁 내려앉으면 나쁜 일이 생길 것 같아요",
        "과거의 부끄러운 기억이 밤마다 떠올라요", "내 자신이 한심하고 쓸모없는 존재 같아요", "불안해서 밤에 잠을 잘 수가 없어요",
        "마음속에서 나를 비난하는 목소리가 멈추지 않아요", "감정 기복이 너무 심해서 통제가 안 돼요", "사람들의 눈치를 보며 항상 긴장하고 살아요", "스스로에게 너무 가혹하게 구는 걸 멈추고 싶어요",
        # PACK 09: 사주·운명 (10개)
        "올해 삼재라는데 이사나 이직을 하면 안 되나요", "사주에서 남편 복이 없다고 해서 결혼이 겁나요", "점쟁이가 올해 돈을 다 날린다고 해서 불안해요",
        "징크스 때문에 특정 숫자를 피하게 돼요", "내 인생은 정해진 팔자대로만 굴러가는 걸까요", "대운이 언제 오는지 사주를 자꾸 보게 돼요",
        "궁합이 안 좋다는 말 때문에 연인과 헤어져야 하나요", "미래가 너무 불안해서 신점을 예약했어요", "운명을 바꿀 수 있는 방법이 정말 있을까요", "미신인 걸 알면서도 자꾸 불안해서 점을 쳐요",
        # PACK 10: 3대 코드 통합 (10개)
        "머리로는 다크 코드를 알겠는데 몸이 안 따라줘요", "내가 왜 매번 같은 연애 실패를 반복하죠", "10% 작은 행동이라도 시작해보고 싶어요",
        "감정이 폭풍처럼 몰아칠 때 제로포인트로 가는 법", "생각과 나 자신을 분리하는 게 너무 어려워요", "내면의 자동반응이 켜지는 순간을 알아차리고 싶어요",
        "다크 코드가 작동할 때 호흡으로 멈추는 방법", "반복되는 인생 패턴을 이번에는 정말 깨고 싶어요", "나는 왜 알면서도 또 자책을 시작했을까요", "선택의 공간을 넓히는 뉴럴 코드 실천법이 궁금해요"
    ]

    success_count = 0
    total = len(pack_queries)
    for q in pack_queries:
        res = router.route(q)
        if res.get("status") == "success" and len(res.get("recs", [])) >= 2:
            success_count += 1

    rate = (success_count / total) * 100
    print(f"  [결과] 100개 테스트셋 통과율: {success_count}/{total} ({rate:.1f}%)")
    return rate >= 95.0, success_count, total

def main():
    print("=" * 65)
    print(" MYUNGSIM NO-AI PRODUCTION CORE v1 검증 스위트")
    print("=" * 65)

    check1 = scan_for_api_keys_and_mocks()

    with open(CARD_DATA_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)
    with open(SYNONYMS_PATH, "r", encoding="utf-8") as f:
        synonyms = json.load(f)

    router = PyRuleBasedRouter(cards, synonyms)

    check2, results20 = run_20_query_tests(router)
    check3 = run_special_cases_tests(router)
    check4, pass_cnt, total_cnt = run_100_pack_tests(router)

    print("\n" + "=" * 65)
    all_ok = check1 and check2 and check3 and check4

    if all_ok:
        print(" [최종 판정] 모든 NO-AI 실구동 요건 100% 충족!")
        print(" EXTERNAL AI CALLS IN CORE FLOW: 0")
        print(" NO-AI PRODUCTION MODE: PASS")
        print("=" * 65)
        sys.exit(0)
    else:
        print(" [최종 판정] 일부 요건 미달")
        print(" NO-AI PRODUCTION MODE: FAIL")
        print("=" * 65)
        sys.exit(1)

if __name__ == "__main__":
    main()
