# -*- coding: utf-8 -*-
"""
Automated Dataset & Service Config Validator & Fallback Synchronizer for Mind Cards (up to 300+ items)
"""
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

DATA_FILE = 'data/mind-cards.json'
CONFIG_FILE = 'data/service-config.json'
FALLBACK_JS_FILE = 'js/mind-cards-data.js'

REQUIRED_CARD_FIELDS = [
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

REQUIRED_CONFIG_KEYS = [
    'APP_URL',
    'PUBLISHER_URL',
    'DARK_CODE_BOOK_URL',
    'NEURAL_CODE_BOOK_URL',
    'ZERO_POINT_BOOK_URL'
]

def main():
    errors = []

    # 1. Validate Service Config
    if not os.path.exists(CONFIG_FILE):
        errors.append(f"Missing config file: {CONFIG_FILE}")
        service_config = {}
    else:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            try:
                service_config = json.load(f)
            except Exception as e:
                errors.append(f"Failed to parse {CONFIG_FILE}: {e}")
                service_config = {}

        if isinstance(service_config, dict):
            for k in REQUIRED_CONFIG_KEYS:
                val = service_config.get(k)
                if not val or not isinstance(val, str) or not val.strip():
                    errors.append(f"Service Config: Missing or empty '{k}' in {CONFIG_FILE}")
        else:
            errors.append(f"Service Config: Root must be a JSON object in {CONFIG_FILE}")

    # 2. Validate Cards Data
    if not os.path.exists(DATA_FILE):
        errors.append(f"Missing data file: {DATA_FILE}")
        cards = []
    else:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                cards = json.load(f)
            except Exception as e:
                errors.append(f"Failed to parse {DATA_FILE}: {e}")
                cards = []

        if not isinstance(cards, list):
            errors.append("Cards Data: Root must be a JSON array of card objects!")
            cards = []

    if not errors:
        print(f"Validating {len(cards)} cards in {DATA_FILE} and config in {CONFIG_FILE}...")
        ids = set()
        for i, c in enumerate(cards):
            cid = c.get('id')
            if not cid:
                errors.append(f"Card #{i+1}: Missing 'id'")
            elif cid in ids:
                errors.append(f"Card #{i+1}: Duplicate id '{cid}'")
            else:
                ids.add(cid)

            for req in REQUIRED_CARD_FIELDS:
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

    print(f"\n✅ SUCCESS: All {len(cards)} cards & service config passed validation!")
    print(f" - Service Links: {list(service_config.keys())}")
    print(f" - Unique Cards: {len(ids)}")
    print(f" - Categories: {len(set(c.get('category') for c in cards))}")

    # Synchronize fallback bundle for file:// protocol & offline reliability
    sync_fallback(cards, service_config)

def sync_fallback(cards, service_config):
    config_json = json.dumps(service_config, ensure_ascii=False, indent=2)
    cards_json = json.dumps(cards, ensure_ascii=False, indent=2)
    fallback_code = f'''/**
 * =================================================================
 * MYUNGSIM DAILY INSIGHT · MIND CARDS CONFIG & FALLBACK BUNDLE
 * AUTO-SYNCHRONIZED FROM data/service-config.json & data/mind-cards.json
 * =================================================================
 */

// 1. 시스템 설정 (URL Config)
window.MIND_CONFIG = {config_json};

// 2. 오프라인 / file:// 로컬 미리보기용 캐시 데이터 (data/mind-cards.json과 실시간 동기화)
window.MIND_CARDS_DATA = {cards_json};
'''
    with open(FALLBACK_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(fallback_code)
    print(f" - Synchronized {FALLBACK_JS_FILE} (config + {len(cards)} cards)")

if __name__ == '__main__':
    main()
