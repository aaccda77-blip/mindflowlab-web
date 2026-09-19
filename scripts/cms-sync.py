#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/cms-sync.py
CMS에서 편집/수정한 카드 데이터를 프로젝트 저장소(mind-cards.json, js/mind-cards-data.js, data/cards/)에
안전하게 동기화하고 유효성을 검사하는 유틸리티
"""

import json
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_FILE = os.path.join(BASE_DIR, "data", "mind-cards.json")
JS_DATA_FILE = os.path.join(BASE_DIR, "js", "mind-cards-data.js")
CARDS_DIR = os.path.join(BASE_DIR, "data", "cards")

def sync_data(custom_json_path=None):
    source_file = custom_json_path if custom_json_path else DATA_FILE
    if not os.path.exists(source_file):
        print(f"Error: File not found: {source_file}")
        sys.exit(1)

    with open(source_file, "r", encoding="utf-8") as f:
        cards = json.load(f)

    print(f"Loaded {len(cards)} cards from {source_file}")

    # Validate essential fields
    errors = []
    for idx, c in enumerate(cards):
        cid = c.get("id") or f"Index-{idx}"
        if not c.get("question"):
            errors.append(f"[{cid}] question 누락")
        if not c.get("sodaAnswer"):
            errors.append(f"[{cid}] sodaAnswer 누락")
        if not c.get("tenPercentAction"):
            errors.append(f"[{cid}] tenPercentAction 누락")

    if errors:
        print(f"⚠️ Validation Failed with {len(errors)} errors:")
        for e in errors[:10]:
            print(" -", e)
        sys.exit(1)

    # Save to data/mind-cards.json
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {DATA_FILE}")

    # Save to js/mind-cards-data.js
    js_content = f"// MindflowLab Canonical Mind Cards Dataset (Total {len(cards)} Cards)\n"
    js_content += f"// Synchronized by scripts/cms-sync.py\n\n"
    js_content += f"window.MIND_CARDS_DATA = {json.dumps(cards, ensure_ascii=False, indent=2)};\n"
    with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✅ Saved {JS_DATA_FILE}")

    # Split into data/cards/ categories
    categories = {
        "relationship.json": ["관계·심리", "경계와 관계"],
        "money.json": ["돈·사업실패·빚", "생존·불안"],
        "career.json": ["번아웃·이직퇴사·성과", "에너지와 번아웃", "성취·일"],
        "perfection.json": ["완벽주의·인정욕구·비교", "완벽주의와 통제"],
        "family.json": ["부모원망·가족독립"],
        "love.json": ["연애애착·이별·친밀감"],
        "decision.json": ["결정·미루기·습관", "변화와 시도"],
        "emotion.json": ["유리멘탈·자책·불안", "감정 민감성", "불안과 방어", "생각 과열"],
        "belief.json": ["사주미신·삼재·운명역전", "불확실성"],
        "three-code.json": ["3대코드·제로포인트", "정체성과 관찰"],
        "foundation.json": []
    }

    for filename, cats in categories.items():
        if filename == "foundation.json":
            matched = cards[:30]
        else:
            matched = [c for c in cards if c.get("category") in cats]
        filepath = os.path.join(CARDS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(matched, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully synchronized all datasets ({len(cards)} cards) across project.")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    sync_data(path)
