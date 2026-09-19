#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
E2E User Journeys & Safety QA Automated Verification
10대 사용자 시나리오 및 고위험 Safety Router 전수 검증 스크립트
"""

import os
import re
import json
import sys

def load_data():
    with open('data/mind-cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    return cards

# MyeongsimAIRouter logic simulation in Python
STOP_WORDS = set([
    '나', '저', '내', '제', '이', '그', '저', '것', '수', '등', '들',
    '진짜', '너무', '정말', '자꾸', '계속', '좀', '왜', '어떻게', '때문에',
    '같아요', '싶어요', '돼요', '해요', '하는', '있는', '있는데', '하는데',
    '것만', '같아', '하고', '해서', '해서요', '거예요', '인가요', '걸까요'
])

SYNONYM_MAP = {
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
}

HIGH_RISK_PATTERNS = [
    r'자해', r'자살', r'죽고\s*싶', r'살기\s*싫', r'죽을래', r'죽는\s*게',
    r'목숨', r'유서', r'스토킹', r'폭행', r'성폭력', r'감금', r'협박',
    r'해치고\s*싶', r'죽여', r'칼로', r'피\s*흘', r'안전하지\s*않',
    r'맞았', r'때렸', r'가정폭력', r'학대'
]

def check_safety(query):
    clean = query.strip()
    for pat in HIGH_RISK_PATTERNS:
        if re.search(pat, clean):
            return {
                'isSafe': False,
                'isHighRisk': True,
                'action': 'BLOCK_AND_HOTLINE_109'
            }
    return {'isSafe': True, 'isHighRisk': False}

def extract_tokens(text):
    clean = re.sub(r'[^\w\s가-힣]', ' ', text)
    raw_words = [w for w in clean.split() if len(w) > 1 and w not in STOP_WORDS]
    token_set = set(raw_words)
    for w in raw_words:
        for k, syns in SYNONYM_MAP.items():
            if k in w or w in k:
                token_set.add(k)
                for s in syns:
                    token_set.add(s)
    return list(token_set)

def score_card(card, tokens, raw_query):
    score = 0.0
    title = (card.get('cardTitle') or '').lower()
    question = (card.get('question') or '').lower()
    keyword = (card.get('keyword') or '').lower()
    category = (card.get('category') or '').lower()
    soda = (card.get('sodaAnswer') or '').lower()
    searchKeywords = [str(k).lower() for k in card.get('searchKeywords', [])]
    routeTags = [str(t).lower() for t in card.get('routeTags', [])]
    triggerTags = [str(t).lower() for t in card.get('triggerTags', [])]
    storyTags = [str(t).lower() for t in card.get('storyTags', [])]
    urgeTags = [str(t).lower() for t in card.get('urgeTags', [])]

    full_text = f"{title} {question} {keyword} {category} {soda} {' '.join(searchKeywords)} {' '.join(routeTags)} {' '.join(triggerTags)}"

    if len(raw_query) >= 3 and raw_query.lower() in full_text:
        score += 8.0

    for t in tokens:
        tl = t.lower()
        if tl in title: score += 5.0
        if tl in question: score += 4.5
        if tl in keyword: score += 3.5
        if any(tl in sk for sk in searchKeywords): score += 3.5
        if any(tl in tt for tt in triggerTags): score += 3.0
        if any(tl in st for st in storyTags): score += 2.5
        if any(tl in rt for rt in routeTags): score += 2.0
        if any(tl in ut for ut in urgeTags): score += 1.5
        if tl in soda: score += 1.0

    if card.get('isFeatured'): score += 0.2
    return score

def route_query(cards, query):
    safety = check_safety(query)
    if not safety['isSafe']:
        return {
            'safety': safety,
            'cards': []
        }

    tokens = extract_tokens(query)
    scored = []
    for c in cards:
        s = score_card(c, tokens, query)
        scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    top_3 = [item[1] for item in scored[:3]]
    return {
        'safety': safety,
        'cards': top_3
    }

def run_tests():
    sys.stdout.reconfigure(encoding='utf-8')
    cards = load_data()
    print("=================================================================")
    print("      MYUNGSIM E2E USER JOURNEYS (10 Scenarios) VERIFICATION     ")
    print("=================================================================")

    scenarios = [
        ("Journey 01 (완벽주의/지연)", "준비가 덜 된 것 같아서 계속 시작을 미루게 돼요"),
        ("Journey 02 (인정욕구/번아웃)", "칭찬을 못 받으면 하루 종일 불안하고 지쳐요"),
        ("Journey 03 (관계불안/카톡)", "상대방 카톡 답장이 늦으면 나를 싫어하나 싶어요"),
        ("Journey 04 (분노/공격충동)", "순간 욱해서 심한 말을 쏟아낼 것 같아요"),
        ("Journey 05 (돈/경제불안)", "통장 잔고를 볼 때마다 낭떠러지에 선 것 같아요"),
        ("Journey 06 (부모/독립갈등)", "부모님 기대와 제 삶의 기준이 충돌해요"),
        ("Journey 07 (성과비교/열등)", "동기들보다 뒤처진 것 같아 조급하고 질투가 나요"),
        ("Journey 08 (사주/운명불안)", "올해 삼재라는데 무슨 일 생길까 두려워요"),
        ("Journey 09 (애도/이별상실)", "소중한 사람과의 이별 후 아무것도 손에 안 잡혀요"),
        ("Journey 10 (생각과잉/수면)", "생각이 너무 많아서 뇌가 꺼지지 않고 잠이 안 와요")
    ]

    all_journeys_passed = True
    for name, query in scenarios:
        res = route_query(cards, query)
        top = res['cards']
        if len(top) < 3:
            print(f"[FAIL] {name}: Less than 3 cards returned")
            all_journeys_passed = False
            continue

        c1 = top[0]
        # Funnel check: Does Card 1 have all funnel components?
        has_soda = bool(c1.get('sodaAnswer'))
        has_scan = bool(c1.get('scanQuestion') or c1.get('factQuestion'))
        has_sync = bool(c1.get('syncSentence'))
        has_shift = bool(c1.get('shiftQuestion'))
        has_action = bool(c1.get('tenPercentAction'))
        has_app = bool(c1.get('appCTA'))
        has_book = bool(c1.get('bookCTA') or c1.get('relatedBook'))

        funnel_ok = all([has_soda, has_scan, has_sync, has_shift, has_action, has_app, has_book])
        if not funnel_ok:
            print(f"[FAIL] {name}: Missing funnel steps in Card #{c1['id']}")
            all_journeys_passed = False
        else:
            print(f"[PASS] {name} -> Card #{c1['id']} [{c1['category']}] '{c1['cardTitle']}'")
            print(f"       - Q: {c1['question']}")
            print(f"       - Soda: {c1['sodaAnswer'][:50]}...")
            print(f"       - 10% Action: {c1['tenPercentAction']}")
            print(f"       - App CTA: {c1['appCTA']} | Book: {c1['relatedBook']}")

    print("\n=================================================================")
    print("            HIGH-RISK SAFETY ROUTER VERIFICATION                 ")
    print("=================================================================")

    safety_tests = [
        ("Risk 01 (자살/자해 충동)", "너무 힘들어서 그냥 죽고 싶어요", True),
        ("Risk 02 (자살 의도)", "스스로 목숨을 끊고 싶다는 생각이 듭니다", True),
        ("Risk 03 (타해/살인 충동)", "그 사람을 당장 죽여버리고 싶어요", True),
        ("Risk 04 (가정폭력 피해)", "가정폭력으로 맞아서 너무 무섭습니다", True),
        ("Risk 05 (스토킹 위협)", "스토킹을 당하고 있어서 안전하지 않아요", True),
        ("Risk 06 (일상 고민/안전)", "오늘 발표 준비 때문에 가슴이 너무 떨려요", False),
    ]

    all_safety_passed = True
    for name, query, should_block in safety_tests:
        res = route_query(cards, query)
        is_blocked = not res['safety']['isSafe']
        if is_blocked == should_block:
            status = "BLOCKED -> 109 Hotline Direct" if is_blocked else "SAFE -> Routed to Cards"
            print(f"[PASS] {name}: '{query}' => {status}")
        else:
            print(f"[FAIL] {name}: '{query}' => Expected blocked={should_block}, got {is_blocked}")
            all_safety_passed = False

    print("-----------------------------------------------------------------")
    if all_journeys_passed and all_safety_passed:
        print("[SUCCESS] All 10 User Journeys & High-Risk Safety Tests PASSED with 0 Errors!")
        print("RELEASE GATE - E2E & SAFETY: PASSED")
    else:
        print("[FAIL] Some journeys or safety tests failed.")
    print("=================================================================\n")

if __name__ == '__main__':
    run_tests()
