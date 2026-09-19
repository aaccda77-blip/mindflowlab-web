#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
230개 명심카드에 contextTags, negativeTags, matchReasons, emotionTags, bodyTags를
정밀하게 보강하여 NO-AI Rule Router 인덱스를 완성하는 스크립트
"""

import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(BASE_DIR, "data", "mind-cards.json")
JS_PATH = os.path.join(BASE_DIR, "js", "mind-cards-data.js")

def enrich_card(card):
    cat = card.get("category", "")
    pack = card.get("packId", "")
    title = card.get("cardTitle", "")
    question = card.get("question", "")
    keyword = card.get("keyword", "")
    text = f"{title} {question} {keyword} {cat}".lower()

    # 1. contextTags
    contexts = set()
    if any(k in text for k in ["엄마", "아빠", "부모", "가족", "원망", "형제", "독립"]):
        contexts.add("family")
        contexts.add("parent_boundary")
    if any(k in text for k in ["회사", "직장", "팀장", "상사", "부장", "출근", "퇴근", "퇴사", "이직", "성과", "업무", "회의"]):
        contexts.add("career")
        contexts.add("workplace")
    if any(k in text for k in ["남친", "여친", "남자친구", "여자친구", "연인", "애인", "연애", "이별", "결혼", "남편", "아내", "배우자", "데이트"]):
        contexts.add("love")
        contexts.add("romantic_relationship")
    if any(k in text for k in ["돈", "빚", "대출", "사업", "망했", "매출", "통장", "잔고", "적자", "경제", "투자"]):
        contexts.add("money")
        contexts.add("financial_anxiety")
    if any(k in text for k in ["사주", "삼재", "대운", "운명", "팔자", "점", "운세", "미신", "징크스"]):
        contexts.add("fortune")
        contexts.add("fate_belief")
    if any(k in text for k in ["완벽", "비교", "인정", "칭찬", "질투", "초라", "열등감", "뒤처"]):
        contexts.add("perfection")
        contexts.add("approval")
    if any(k in text for k in ["미루", "결정", "시작", "습관", "작심삼일", "딴짓", "계획"]):
        contexts.add("decision")
        contexts.add("procrastination")
    if any(k in text for k in ["자책", "자기비하", "유리멘탈", "후회", "내 탓", "부끄러움", "실수"]):
        contexts.add("self_compassion")
        contexts.add("guilt")
    if any(k in text for k in ["카톡", "답장", "연락", "읽씹", "문자", "전화"]):
        contexts.add("communication")
        contexts.add("reply_anxiety")

    # 기본 팩 기반 보완
    if "relationship" in pack or "관계" in cat:
        contexts.add("relationship")
    if "money" in pack or "돈" in cat:
        contexts.add("money")
    if "career" in pack or "직장" in cat:
        contexts.add("career")
    if "family" in pack or "가족" in cat or "부모" in cat:
        contexts.add("family")
    if "love" in pack or "연애" in cat:
        contexts.add("love")
    if "decision" in pack or "결정" in cat:
        contexts.add("decision")
    if "emotion" in pack or "자책" in cat or "불안" in cat:
        contexts.add("self_compassion")
    if "belief" in pack or "사주" in cat:
        contexts.add("fortune")
    if "three-code" in pack or "코드" in cat:
        contexts.add("three_code")

    card["contextTags"] = sorted(list(contexts)) if contexts else ["general_life"]

    # 2. negativeTags
    negatives = set()
    if "love" in card["contextTags"] and "family" not in card["contextTags"]:
        negatives.add("family_only")
        negatives.add("parent_guilt")
    if "family" in card["contextTags"] and "love" not in card["contextTags"]:
        negatives.add("romantic_only")
        negatives.add("dating_app")
    if "career" in card["contextTags"] and "love" not in card["contextTags"]:
        negatives.add("romantic_breakup")
    if "fortune" in card["contextTags"]:
        negatives.add("emergency_medical")
        negatives.add("high_stakes_investment")

    card["negativeTags"] = sorted(list(negatives))

    # 3. emotionTags & bodyTags
    emotions = set()
    if any(k in text for k in ["불안", "두려", "겁", "초조"]): emotions.add("anxiety")
    if any(k in text for k in ["자책", "죄책", "부끄", "수치"]): emotions.add("guilt")
    if any(k in text for k in ["화", "분노", "짜증", "억울"]): emotions.add("anger")
    if any(k in text for k in ["무기력", "우울", "슬픔", "눈물"]): emotions.add("lethargy")
    if any(k in text for k in ["초라", "열등", "비교", "질투"]): emotions.add("shame")
    card["emotionTags"] = sorted(list(emotions)) if emotions else ["uncertainty"]

    body = set()
    if any(k in text for k in ["가슴", "철렁", "심장", "호흡", "숨"]): body.add("chest_tightness")
    if any(k in text for k in ["목", "어깨", "긴장", "굳음"]): body.add("muscle_tension")
    if any(k in text for k in ["폰", "스마트폰", "화면", "손"]): body.add("phone_checking")
    if any(k in text for k in ["머리", "두통", "복잡", "생각 과잉"]): body.add("mental_overload")
    card["bodyTags"] = sorted(list(body)) if body else ["general_tension"]

    # 4. matchReasons (미리 작성된 정밀 WHY 조합 템플릿)
    kw = card.get("keyword", "현재 상황")
    title_clean = card.get("cardTitle", "")
    q_clean = card.get("question", "")

    # dominant tag에 맞춘 사이다 matchReasons
    trigger_why = f"‘{kw}’와 관련된 외부 자극이나 상황이 일어난 순간과 가장 가깝습니다."
    story_why = f"머릿속에서 나쁜 결론이나 확인되지 않은 시나리오를 빠르게 예상하는 자동 해석을 멈추고 비춰보는 질문입니다."
    urge_why = f"불안을 낮추기 위해 즉시 확인하거나 방어하고 싶어지는 충동을 관찰하도록 돕습니다."
    context_why = f"{card['contextTags'][0]} 맥락에서 불필요한 자책을 내려놓고 자기 선택권을 회복하는 관점입니다."

    # 특정 키워드별 세밀화
    if "답장" in text or "카톡" in text:
        trigger_why = "상대의 반응이 확인되지 않아 연락 화면을 계속 보게 되는 순간과 가깝습니다."
        story_why = "답장이 늦은 사실 뒤에 ‘마음이 식었다’거나 ‘무시당했다’는 예측이 켜지는 지점을 다룹니다."
        urge_why = "불안을 덜기 위해 자꾸 폰을 들여다보거나 확인 연락을 보내고 싶은 충동과 연결됩니다."
    elif "사업" in text or "망했" in text or "실패" in text:
        trigger_why = "일이나 사업의 결과가 기대에 미치지 못해 마음이 무너져 내릴 때 마주하는 장면입니다."
        story_why = "결과의 부진을 ‘내 삶 전체의 실패’로 동일시하는 가혹한 해석을 분리해 봅니다."
        urge_why = "모든 것을 포기하고 숨어버리거나 다음 시도를 영원히 보류하고 싶은 마음을 살핍니다."
    elif "팀장" in text or "회사" in text or "퇴근" in text:
        trigger_why = "직장에서의 평가 신호나 메신저 알림 하나에 온몸이 과긴장 상태로 전환되는 상황과 가깝습니다."
        story_why = "상사의 짧은 한마디에 내 존재 가치가 흔들리는 자동 스토리 엔진을 끕니다."
        urge_why = "퇴근 후에도 계속 머릿속으로 업무를 곱씹으며 긴장을 풀지 못하는 반응을 다룹니다."
    elif "엄마" in text or "부모" in text or "거절" in text:
        trigger_why = "가족의 부탁이나 기대를 거절하려 할 때 무거운 죄책감이 밀려오는 순간과 연결됩니다."
        story_why = "가족의 감정적 실망을 온전히 내 책임으로 떠안으려는 자동 패턴을 점검합니다."
        urge_why = "죄책감을 피하기 위해 결국 거절을 취소하고 내 경계를 허물어버리는 행동을 멈춰봅니다."
    elif "사주" in text or "삼재" in text or "운명" in text:
        trigger_why = "미래의 불확실성을 견디기 어려워 외부의 예언이나 사주에 기대게 되는 장면입니다."
        story_why = "정해진 운명이 있다는 믿음 뒤에 숨은 ‘책임과 실패에 대한 두려움’을 비춥니다."
        urge_why = "내 삶의 결정권을 점괘나 남의 말에 통째로 넘겨주고 싶은 충동을 관찰합니다."
    elif "질투" in text or "비교" in text or "친구" in text:
        trigger_why = "타인의 성공 소식을 듣고 축하하면서도 내 안에서 초라함이 올라오는 순간과 가깝습니다."
        story_why = "보이지 않는 순위표를 세워 나 자신을 끊임없이 깎아내리는 비교 엔진을 관찰합니다."
        urge_why = "친구의 소식을 회피하거나 반대로 SNS를 염탐하며 상처를 확인하려는 충동을 다룹니다."

    card["matchReasons"] = {
        "trigger": trigger_why,
        "story": story_why,
        "urge": urge_why,
        "context": context_why
    }

    return card

def main():
    print(f"Loading {JSON_PATH}...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)

    print(f"Enriching {len(cards)} cards...")
    enriched_cards = [enrich_card(c) for c in cards]

    # Save to data/mind-cards.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(enriched_cards, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(enriched_cards)} enriched cards to {JSON_PATH}")

    # Save to js/mind-cards-data.js
    js_content = f"// Canonical Mind Cards Data (Enriched for NO-AI Rule Router)\nwindow.MIND_CARDS_DATA = {json.dumps(enriched_cards, ensure_ascii=False, indent=2)};\n"
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Saved to {JS_PATH}")

if __name__ == "__main__":
    main()
