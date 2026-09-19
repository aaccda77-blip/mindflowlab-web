#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Reality Check & Non-Diagnosis & Non-Fortune-Telling Audit Script (v2)
명심카드 230장 및 명심AI 시스템 정밀 감사기
"""

import os
import re
import json
import sys

def run_audit():
    sys.stdout.reconfigure(encoding='utf-8')
    cards_file = os.path.join('data', 'mind-cards.json')
    with open(cards_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)

    print(f"[1] Loaded {len(cards)} mind cards from data/mind-cards.json.")

    # 1. 진단/낙인성 어휘 (사용자를 고정된 부정적 성격/병리 프레임에 가두는 표현)
    diagnosis_patterns = [
        (r'당신은\s+[\w가-힣]+형입니다', '성격 유형 단정'),
        (r'당신은\s+[\w가-힣]+적\s+인간입니다', '인간 본질 규정'),
        (r'당신은\s+환자', '병리적 낙인'),
        (r'결핍형\s*인간', '결핍형 낙인'),
        (r'의지박약형', '의지박약 낙인'),
    ]

    # 2. 운명론/점술 조장 (운세나 점괘를 맹신하게 만들거나 미래를 확정적으로 예언하는 표현)
    fortune_promotion_patterns = [
        (r'올해\s*대운이\s*(들어와|끝나)', '대운 예언'),
        (r'액운이\s*닥칠\s*것', '액운 공포 조장'),
        (r'사주팔자\s*때문에\s*어쩔\s*수\s*없', '사주 숙명론 조장'),
        (r'피할\s*수\s*없는\s*운명입니다', '운명 결정론'),
        (r'부적을\s*(써야|지녀야)', '부적 강요'),
        (r'점괘대로\s*(따라야|하셔야)', '점괘 복종 강요'),
    ]

    # 3. 현실 문제 내면화 / 2차 가해 / 가스라이팅 표현
    victim_blaming_patterns = [
        (r'괴롭힘도\s*당신의\s*마음', '괴롭힘 피해자 탓'),
        (r'폭력도\s*당신의\s*생각', '폭력 피해자 탓'),
        (r'착취는\s*당신의\s*착각', '착취 피해자 탓'),
        (r'부당한\s*대우도\s*당신\s*탓', '부당 대우 자책 유도'),
    ]

    diagnosis_issues = []
    fortune_issues = []
    blaming_issues = []

    for c in cards:
        cid = c.get('id', 'N/A')
        title = c.get('cardTitle', '')
        q = c.get('question', '')
        soda = c.get('sodaAnswer', '')
        desc = c.get('description', '')
        scan = c.get('scanQuestion', '')
        fact = c.get('factQuestion', '')
        story = c.get('storyQuestion', '')
        sync = c.get('syncSentence', '')
        shift = c.get('shiftQuestion', '')
        action = c.get('tenPercentAction', '')
        text = f"{title} {q} {soda} {desc} {scan} {fact} {story} {sync} {shift} {action}"

        for pat, desc_tag in diagnosis_patterns:
            if re.search(pat, text):
                diagnosis_issues.append((cid, title, desc_tag, pat))

        for pat, desc_tag in fortune_promotion_patterns:
            if re.search(pat, text):
                fortune_issues.append((cid, title, desc_tag, pat))

        for pat, desc_tag in victim_blaming_patterns:
            if re.search(pat, text):
                blaming_issues.append((cid, title, desc_tag, pat))

    print("\n=======================================================")
    print("           MYUNGSIM RC AUDIT: ETHICS & REALITY         ")
    print("=======================================================")
    print(f"- 1. 진단/낙인/유형화 결함 (Diagnosis & Labeling): {len(diagnosis_issues)}건")
    if diagnosis_issues:
        for cid, title, tag, pat in diagnosis_issues:
            print(f"  [!] Card #{cid} ({title}): {tag}")

    print(f"- 2. 점술/운명론/예언 결함 (Fortune & Fatalism): {len(fortune_issues)}건")
    if fortune_issues:
        for cid, title, tag, pat in fortune_issues:
            print(f"  [!] Card #{cid} ({title}): {tag}")

    print(f"- 3. 피해자 책임 전가/현실부정 결함 (Victim Blaming & Reality): {len(blaming_issues)}건")
    if blaming_issues:
        for cid, title, tag, pat in blaming_issues:
            print(f"  [!] Card #{cid} ({title}): {tag}")

    total_issues = len(diagnosis_issues) + len(fortune_issues) + len(blaming_issues)
    print("-------------------------------------------------------")
    if total_issues == 0:
        print("[SUCCESS] 230개 카드 전체 비진단·비운세·현실인정(FACT) 기준 완벽 통과!")
        print("RELEASE GATE - ETHICS & REALITY: PASSED (0 Issues)")
    else:
        print(f"[FAIL] 총 {total_issues}건의 수정 필요 항목이 발견되었습니다.")
    print("=======================================================\n")
    return total_issues

if __name__ == '__main__':
    exit(run_audit())
