# -*- coding: utf-8 -*-
"""
Automated Dataset Validator & Fallback Synchronizer for Mind Cards (up to 300+ items)
"""
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

DATA_FILE = 'data/mind-cards.json'
FALLBACK_JS_FILE = 'js/mind-cards-data.js'

REQUIRED_FIELDS = [
    'id',
    'category',
    'keyword',
    'cardTitle',
    'question',
    'sodaAnswer',
    'curiosityQuestion',
    'scanQuestion',
    'syncSentence',
    'shiftQuestion',
    'tenPercentAction',
    'relatedBook',
    'appCTA',
    'bookCTA',
    'searchKeywords'
]

def main():
    if not os.path.exists(DATA_FILE):
        print(f"ERROR: {DATA_FILE} does not exist!")
        sys.exit(1)

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            cards = json.load(f)
        except Exception as e:
            print(f"ERROR: Failed to parse JSON in {DATA_FILE}: {e}")
            sys.exit(1)

    if not isinstance(cards, list):
        print("ERROR: JSON root must be an array of card objects!")
        sys.exit(1)

    print(f"Validating {len(cards)} cards in {DATA_FILE}...")

    ids = set()
    errors = []

    for i, c in enumerate(cards):
        cid = c.get('id')
        if not cid:
            errors.append(f"Card #{i+1}: Missing 'id'")
        elif cid in ids:
            errors.append(f"Card #{i+1}: Duplicate id '{cid}'")
        else:
            ids.add(cid)

        for req in REQUIRED_FIELDS:
            val = c.get(req)
            if val is None or (isinstance(val, str) and not val.strip()):
                errors.append(f"Card #{i+1} ({cid}): Missing or empty required field '{req}'")
            elif req == 'searchKeywords' and not isinstance(val, list):
                errors.append(f"Card #{i+1} ({cid}): 'searchKeywords' must be an array")
            elif req == 'relatedBook' and val not in ["다크 코드", "뉴럴 코드", "제로 포인트"]:
                errors.append(f"Card #{i+1} ({cid}): 'relatedBook' must be one of ['다크 코드', '뉴럴 코드', '제로 포인트'] (got '{val}')")

    if errors:
        print(f"\n❌ FAILED: Found {len(errors)} validation errors:")
        for err in errors[:20]:
            print(f" - {err}")
        if len(errors) > 20:
            print(f" ... and {len(errors) - 20} more errors")
        sys.exit(1)

    print(f"\n✅ SUCCESS: All {len(cards)} cards passed validation!")
    print(f" - Unique Cards: {len(ids)}")
    print(f" - Categories: {len(set(c.get('category') for c in cards))}")

    # Synchronize fallback bundle for file:// protocol & offline reliability
    sync_fallback(cards)

def sync_fallback(cards):
    fallback_code = f'''/**
 * =================================================================
 * MYUNGSIM DAILY INSIGHT · MIND CARDS CONFIG & FALLBACK BUNDLE
 * AUTO-SYNCHRONIZED FROM data/mind-cards.json
 * =================================================================
 */

// 1. 시스템 설정 (URL Config)
const MIND_CONFIG = {{
  APP_URL: '/self-check',
  PUBLISHER_URL: 'https://smartstore.naver.com/crbooks',
  DARK_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
  NEURAL_CODE_BOOK_URL: 'https://smartstore.naver.com/crbooks',
  ZERO_POINT_BOOK_URL: 'https://smartstore.naver.com/crbooks'
}};

// 2. 오프라인 / file:// 로컬 미리보기용 캐시 데이터 (data/mind-cards.json과 실시간 동기화)
window.MIND_CARDS_DATA = {json.dumps(cards, ensure_ascii=False, indent=2)};
'''
    with open(FALLBACK_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(fallback_code)
    print(f" - Synchronized {FALLBACK_JS_FILE} ({len(cards)} cards)")

if __name__ == '__main__':
    main()
