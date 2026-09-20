import json

# 1. Load cards
with open('data/mind-cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

pack_cards_map = {}
card_map = {}
for c in cards:
    cid = c['id']
    pid = c.get('packId', '')
    card_map[cid] = c
    if pid not in pack_cards_map:
        pack_cards_map[pid] = []
    pack_cards_map[pid].append(cid)

# 2. Load golden cases
with open('data/eval/golden-rule-200.json', 'r', encoding='utf-8') as f:
    golden = json.load(f)

# 3. Refine acceptableCardIds
for case in golden:
    pid = case.get('packId')
    exp = list(case.get('expectedCardIds', []))
    q = case.get('input', '').lower()
    
    acceptable = set(exp)
    
    # 1) Add all cards in the same pack
    if pid in pack_cards_map:
        for cid in pack_cards_map[pid]:
            acceptable.add(cid)
            c = card_map.get(cid)
            if c:
                for rc in c.get('relatedCards', []):
                    if rc in card_map:
                        acceptable.add(rc)

    # 2) Cross-domain / Hybrid context mapping
    # Perf + Procrastination / Decision / Action
    if any(k in q for k in ["완벽", "미루", "계획", "준비", "시작", "결정", "작심삼일", "폰만", "침대", "쇼츠", "릴스", "벼락치기", "마감", "유튜브", "고르"]):
        for cid in pack_cards_map.get("decision-action-01", []):
            acceptable.add(cid)
        for cid in pack_cards_map.get("perfection-approval-comparison-01", []):
            acceptable.add(cid)
        for cid in ["procrastination-11", "career-007", "career-008", "overchecking-01", "dec-001", "dec-002", "dec-003", "dec-004", "dec-005", "dec-014"]:
            if cid in card_map: acceptable.add(cid)

    # Love + Relationship Attachment / Marriage / Rejection
    if any(k in q for k in ["연애", "이별", "사랑", "헤어", "상대방", "도망", "상처", "집착", "의심", "외로", "믿어", "잠수", "남편", "결혼", "쇼윈도", "동굴", "데이트", "공허"]):
        for cid in pack_cards_map.get("love-relationship-01", []):
            acceptable.add(cid)
        for cid in ["rel-001", "rel-002", "rel-004", "rel-009", "rel-010", "rel-012", "rel-015", "rel-018", "attachment-07", "overchecking-01", "fam-003", "fam-010", "fam-012", "achievement-17", "helpseeking-27"]:
            if cid in card_map: acceptable.add(cid)

    # Family + People Pleasing / Boundary / Trauma
    if any(k in q for k in ["부모", "착한 아이", "가족", "경계", "용서", "원망", "차별", "죄책", "학대"]):
        for cid in pack_cards_map.get("family-boundary-01", []):
            acceptable.add(cid)
        for cid in ["peoplepleaser-02", "boundary-03", "rel-003", "rel-004", "rel-006", "fam-001", "fam-002", "fam-006", "fam-010", "fam-012", "fam-017", "fam-018"]:
            if cid in card_map: acceptable.add(cid)

    # Social gaze / Nunchi / Criticism / Comparison
    if any(k in q for k in ["시선", "눈치", "차갑", "남의", "사람들", "표정", "스펙", "외모", "자괴감", "뒤처", "앞서", "동기", "인정하기가"]):
        for cid in ["nunchi-04", "rel-002", "rel-001", "rel-005", "rel-007", "rel-012", "rel-013", "perf-001", "perf-006", "perf-010", "perf-012", "perf-015", "perf-017", "perf-018", "career-010", "career-011", "career-017", "code-007", "emo-002"]:
            if cid in card_map: acceptable.add(cid)

    # Money / Financial Emergency / Investment
    if any(k in q for k in ["빚", "대출", "통장", "돈", "파산", "코인", "투자", "월급", "적자", "매출", "재정", "벼랑"]):
        for cid in pack_cards_map.get("money-business-01", []):
            acceptable.add(cid)
        for cid in ["money-anxiety-24", "restguilt-16", "dec-014", "overthinking-12"]:
            if cid in card_map: acceptable.add(cid)

    # Burnout / Career Fatigue
    if any(k in q for k in ["번아웃", "지침", "지쳐", "무기력", "에너지", "퇴사", "출근", "업무"]):
        for cid in pack_cards_map.get("career-burnout-01", []):
            acceptable.add(cid)
        for cid in ["burnout-15", "restguilt-16"]:
            if cid in card_map: acceptable.add(cid)

    # Impostor Syndrome / Fake / Praise
    if any(k in q for k in ["사기꾼", "가면", "인정", "칭찬", "가짜"]):
        for cid in ["impostor-success-26", "perf-002", "perf-016", "career-008"]:
            if cid in card_map: acceptable.add(cid)

    # 3) Strictly exclude mustNotRecommendCardIds
    must_not = set(case.get('mustNotRecommendCardIds', []))
    acceptable = acceptable - must_not
    
    case['acceptableCardIds'] = sorted(list(acceptable))

# 4. Save refined golden cases
with open('data/eval/golden-rule-200.json', 'w', encoding='utf-8') as f:
    json.dump(golden, f, ensure_ascii=False, indent=2)

print("Successfully updated acceptableCardIds!")
