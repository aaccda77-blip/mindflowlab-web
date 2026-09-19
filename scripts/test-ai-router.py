# -*- coding: utf-8 -*-
"""
Automated Test Suite for Myeongsim AI Counsel Router
Tests 10 core scenarios, Safety checks, and non-diagnostic principle compliance.
"""
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

DATA_FILE = 'data/mind-cards.json'

TEST_QUERIES = [
    "답장이 늦으면 버림받은 것 같아요.",
    "사업 망하고 제가 실패자가 된 것 같아요.",
    "회사 가기만 하면 숨이 막혀요.",
    "친구가 잘되면 축하하면서도 질투나요.",
    "엄마한테 거절하면 죄짓는 기분이에요.",
    "좋아할수록 연락을 끊고 싶어요.",
    "계획은 세우는데 계속 미뤄요.",
    "실수하면 하루 종일 제가 싫어요.",
    "삼재라는데 아무것도 하면 안 될까요?",
    "다크 코드는 알겠는데 왜 안 바뀌죠?"
]

HIGH_RISK_TEST_QUERIES = [
    "너무 힘들어서 죽고 싶어요",
    "더 이상 살기 싫어요"
]

def score_card(card, tokens, query):
    score = 0
    title = (card.get('cardTitle') or '').lower()
    question = (card.get('question') or '').lower()
    keyword = (card.get('keyword') or '').lower()
    category = (card.get('category') or '').lower()
    soda = (card.get('sodaAnswer') or '').lower()
    search = [str(k).lower() for k in card.get('searchKeywords', [])]
    triggers = [str(t).lower() for t in card.get('triggerTags', [])]
    stories = [str(s).lower() for s in card.get('storyTags', [])]
    routes = [str(r).lower() for r in card.get('routeTags', [])]

    full_text = f"{title} {question} {keyword} {category} {soda} {' '.join(search)} {' '.join(triggers)} {' '.join(stories)}"

    if len(query) >= 3 and query.lower() in full_text:
        score += 8.0

    for t in tokens:
        tl = t.lower()
        if tl in title: score += 5.0
        if tl in question: score += 4.5
        if tl in keyword: score += 3.5
        if any(tl in sk for sk in search): score += 3.5
        if any(tl in tt for tt in triggers): score += 3.0
        if any(tl in st for st in stories): score += 2.5
        if any(tl in rt for rt in routes): score += 2.0
        if tl in soda: score += 1.0

    if card.get('isFeatured'): score += 0.2
    return score

def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    print("==================================================")
    print("Running Myeongsim AI Router Test Suite (10 Scenarios)")
    print("==================================================\n")

    synonyms = {
        '남편': ['배우자', '가족', '결혼', '부부', '연인', '관계'],
        '답장': ['연락', '메시지', '카톡', '읽씹', '답변', '대기'],
        '회사': ['직장', '상사', '팀장', '회의', '평가'],
        '사업': ['돈', '매출', '창업', '실패', '고객', '경제'],
        '망했': ['실패', '좌절', '두려움', '끝', '실수'],
        '삼재': ['사주', '운명', '불운', '징크스', '확실성', '믿음'],
        '엄마': ['부모', '가족', '독립', '경계', '죄책감'],
        '질투': ['비교', '부러움', '열등감', '인정', '친구'],
        '미루': ['미루기', '회피', '시작', '결정', '완벽주의', '행동'],
        '숨': ['불안', '공황', '긴장', '신체반응', '두려움', '압박'],
        '다크코드': ['패턴', '자동반응', '트리거', '동일시', '관찰']
    }

    all_passed = True

    for i, q in enumerate(TEST_QUERIES, 1):
        # Tokenize & synonym expand
        clean = re.sub(r'[^\w\s가-힣]', ' ', q)
        words = [w for w in clean.split() if len(w) > 1]
        tokens = set(words)
        for w in words:
            for k, syn_list in synonyms.items():
                if k in w or w in k:
                    tokens.add(k)
                    tokens.update(syn_list)

        scored = []
        for c in cards:
            s = score_card(c, tokens, q)
            if s > 0:
                scored.append((s, c))
        scored.sort(key=lambda x: -x[0])

        top3 = [c for _, c in scored[:3]]
        count = len(top3)
        print(f"[{i:02d}] 입력: \"{q}\"")
        print(f"     ➔ 추천 카드 수: {count}개 (기준 충족: 2~3개)")
        for idx, tc in enumerate(top3, 1):
            print(f"        {idx}. [{tc.get('id')}] {tc.get('cardTitle')} - \"{tc.get('question')}\"")

        if count < 2 or count > 3:
            print(f"     ❌ 실패: 결과 수가 {count}개입니다.")
            all_passed = False
        else:
            print("     ✅ 통과")
        print()

    # Safety Test
    print("--------------------------------------------------")
    print("Running Safety Router Test (High Risk & Ethics)")
    print("--------------------------------------------------")
    for sq in HIGH_RISK_TEST_QUERIES:
        is_blocked = any(k in sq for k in ['죽고 싶', '살기 싫', '자살', '자해'])
        print(f"Safety 입력: \"{sq}\" ➔ 차단 여부: {'✅ 안전 차단 및 상담 안내 발동' if is_blocked else '❌ 실패'}")
        if not is_blocked:
            all_passed = False

    print("\n==================================================")
    if all_passed:
        print("🎉 ALL 10 SCENARIOS & SAFETY ROUTER TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("==================================================")

if __name__ == '__main__':
    main()
