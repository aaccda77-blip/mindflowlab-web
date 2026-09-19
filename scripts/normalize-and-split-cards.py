# -*- coding: utf-8 -*-
"""
Normalize Mind Cards Dataset & Split into Pack Files in /data/cards/
Populates routeTags, triggerTags, storyTags, urgeTags, actionTags, and relatedCards graph.
"""
import os
import sys
import json
import re
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

DATA_FILE = 'data/mind-cards.json'
SPLIT_DIR = 'data/cards'

PACK_FILE_MAP = {
    'relationship-anxiety-01': 'relationship.json',
    'money-business-01': 'money.json',
    'career-burnout-01': 'career.json',
    'perfection-approval-comparison-01': 'perfection.json',
    'family-boundary-01': 'family.json',
    'love-relationship-01': 'love.json',
    'decision-action-01': 'decision.json',
    'emotion-recovery-01': 'emotion.json',
    'belief-fate-uncertainty-01': 'belief.json',
    'three-code-integration-01': 'three-code.json',
    None: 'foundation.json'
}

def extract_tags_for_card(c):
    category = c.get('category', '')
    keyword = c.get('keyword', '')
    title = c.get('cardTitle', '')
    question = c.get('question', '')
    soda = c.get('sodaAnswer', '')
    scan = c.get('scanQuestion', '')
    fact = c.get('factQuestion', '')
    story = c.get('storyQuestion', '')
    body = c.get('bodyQuestion', '')
    action = c.get('tenPercentAction', '')
    search = c.get('searchKeywords', [])

    # Basic route tags: combine keyword, category, searchKeywords
    r_tags = set(search)
    r_tags.add(keyword)
    if '·' in category:
        for sub in category.split('·'):
            r_tags.add(sub.strip())
    else:
        r_tags.add(category.strip())

    # Trigger tags inference
    trigger_words = []
    text_to_scan = f"{title} {question} {scan} {fact}"
    trigger_patterns = [
        ('연락|카톡|메시지|답장|전화|메일', ['연락', '메시지', '답장']),
        ('실수|실패|망했|오류|잘못', ['실수', '실패', '돌발상황']),
        ('상사|팀장|대표|임원|회의|발표', ['상사', '직장회의', '평가']),
        ('비교|SNS|인스타|친구|동기|타인', ['타인비교', 'SNS', '성과']),
        ('돈|통장|매출|적자|가격|지출|결제', ['돈', '지출', '경제적불확실성']),
        ('부모|엄마|아빠|가족|명절|집', ['가족', '부모요구', '경계']),
        ('연인|배우자|남편|아내|데이트|이별', ['연인', '친밀감', '관계거리']),
        ('마감|미루|시작|결정|선택|계획', ['마감임박', '결정순간', '시작']),
        ('사주|운세|삼재|징크스|꿈|예측', ['불확실한미래', '운세해석', '징크스']),
        ('불안|두려움|화|분노|우울|피로|숨', ['감정고조', '신체긴장', '피로'])
    ]
    for pattern, ttags in trigger_patterns:
        if re.search(pattern, text_to_scan):
            trigger_words.extend(ttags)
    if not trigger_words:
        trigger_words = [keyword]

    # Story tags inference (내면 해석)
    story_words = []
    if story and len(story.strip()) > 3:
        story_words.append(story.strip()[:40])
    else:
        story_patterns = [
            ('버림|식음|멀어|떠나', '관계가 끝날 것 같다'),
            ('무시|존중|인정|평가', '나를 인정하지 않는 것 같다'),
            ('망했|끝났|실패|부족', '모든 게 망한 것 같다'),
            ('죄책|잘못|실수|자책', '내가 다 잘못한 것 같다'),
            ('손해|위험|사기|거지', '큰 손해를 볼 것 같다'),
            ('운명|팔자|어쩔수|정해진', '원래 나는 안 되는 사람이다'),
            ('완벽|100|틀리', '완벽하지 않으면 의미가 없다')
        ]
        for spat, sdesc in story_patterns:
            if re.search(spat, f"{title} {question} {soda}"):
                story_words.append(sdesc)
        if not story_words:
            story_words.append(f"{keyword}에 대한 자동 해석")

    # Urge tags inference (충동)
    urge_words = []
    urge_patterns = [
        ('확인|카톡|검색|전화|물어', '즉시 확인하려는 충동'),
        ('해명|설명|변명|사과', '과도하게 해명하려는 충동'),
        ('회피|도망|포기|취소|잠수', '자리를 피하거나 중단하려는 충동'),
        ('수정|고치|다시|밤샘', '즉시 전부 고쳐버리려는 충동'),
        ('구매|결제|소비|먹', '불안을 해소하려 소비/충동행동'),
        ('침묵|참|억누|방어', '감정을 억누르고 삼키려는 충동'),
        ('통제|바꾸|간섭|요구', '상대를 내 뜻대로 바꾸려는 충동')
    ]
    for upat, udesc in urge_patterns:
        if re.search(upat, f"{title} {question} {action}"):
            urge_words.append(udesc)
    if not urge_words:
        urge_words.append("상황을 통제하려는 즉각 충동")

    # Action tags inference (10% 행동)
    action_words = []
    if action:
        # short tag from action sentence
        first_clause = action.split('.')[0].strip()
        action_words.append(first_clause[:30])
    else:
        action_words.append("작은 관찰 한 번")

    return {
        'routeTags': sorted(list(r_tags))[:10],
        'triggerTags': list(dict.fromkeys(trigger_words))[:4],
        'storyTags': list(dict.fromkeys(story_words))[:3],
        'urgeTags': list(dict.fromkeys(urge_words))[:3],
        'actionTags': list(dict.fromkeys(action_words))[:3]
    }

def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    print(f"Normalizing {len(cards)} cards...")

    # 1. First pass: augment tags
    for c in cards:
        tags = extract_tags_for_card(c)
        c['routeTags'] = tags['routeTags']
        c['triggerTags'] = tags['triggerTags']
        c['storyTags'] = tags['storyTags']
        c['urgeTags'] = tags['urgeTags']
        c['actionTags'] = tags['actionTags']

    # 2. Build similarity & relatedCards graph
    # For each card, find top 3 most relevant cards (same category or overlapping keywords, excluding itself)
    for i, c in enumerate(cards):
        c_cid = c.get('id')
        c_pack = c.get('packId')
        c_cat = c.get('category')
        c_tags = set(c.get('routeTags', [])) | set(c.get('triggerTags', [])) | {c.get('keyword', '')}

        scores = []
        for j, other in enumerate(cards):
            if i == j or other.get('id') == c_cid:
                continue
            score = 0
            # Same pack bonus
            if other.get('packId') == c_pack and c_pack is not None:
                score += 3
            elif other.get('category') == c_cat:
                score += 2
            
            # Tag overlap
            o_tags = set(other.get('routeTags', [])) | set(other.get('triggerTags', [])) | {other.get('keyword', '')}
            overlap = len(c_tags & o_tags)
            score += overlap * 1.5

            scores.append((score, other.get('id')))

        scores.sort(key=lambda x: -x[0])
        c['relatedCards'] = [cid for _, cid in scores[:3]]

    # 3. Save canonical mind-cards.json
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    print(f"Canonical {DATA_FILE} updated with complete routing schema.")

    # 4. Split into /data/cards/
    os.makedirs(SPLIT_DIR, exist_ok=True)
    cards_by_pack = defaultdict(list)
    for c in cards:
        cards_by_pack[c.get('packId')].append(c)

    for pk, fname in PACK_FILE_MAP.items():
        pack_cards = cards_by_pack.get(pk, [])
        out_path = os.path.join(SPLIT_DIR, fname)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(pack_cards, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(pack_cards)} cards to {out_path}")

    print("\nAll cards normalized & split successfully!")

if __name__ == '__main__':
    main()
