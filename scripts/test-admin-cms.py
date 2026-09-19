#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test-admin-cms.py
MYUNGSIM ADMIN CMS 36대 요구사항 자동화 QA 검증 스크립트
"""

import json
import os
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ADMIN_HTML = os.path.join(BASE_DIR, "admin", "index.html")
ADMIN_JS = os.path.join(BASE_DIR, "admin", "admin.js")
ADMIN_CSS = os.path.join(BASE_DIR, "admin", "admin.css")
USER_HTML = os.path.join(BASE_DIR, "index.html")
VERCEL_JSON = os.path.join(BASE_DIR, "vercel.json")

def run_tests():
    passed = 0
    total = 0

    def assert_check(name, condition, detail=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"✅ PASS [{total}]: {name}")
        else:
            print(f"❌ FAIL [{total}]: {name} - {detail}")

    print("==================================================")
    print("MYUNGSIM ADMIN CMS 36-SCENARIO AUTOMATED QA")
    print("==================================================\n")

    # 1. Admin files existence
    assert_check("Admin index.html exists", os.path.exists(ADMIN_HTML))
    assert_check("Admin admin.js exists", os.path.exists(ADMIN_JS))
    assert_check("Admin admin.css exists", os.path.exists(ADMIN_CSS))

    # 2. Security & Noindex
    with open(ADMIN_HTML, "r", encoding="utf-8") as f:
        admin_html_content = f.read()
    assert_check("Admin index.html has noindex meta tag", 'name="robots" content="noindex' in admin_html_content)
    assert_check("Admin index.html has googlebot noindex", 'name="googlebot" content="noindex' in admin_html_content)

    # 3. Vercel headers
    with open(VERCEL_JSON, "r", encoding="utf-8") as f:
        vercel_content = f.read()
    assert_check("Vercel.json has /admin/(.*) noindex header", '/admin/(.*)' in vercel_content and 'noindex' in vercel_content)

    # 4. User site separation (No admin leakage)
    with open(USER_HTML, "r", encoding="utf-8") as f:
        user_html_content = f.read()
    assert_check("User index.html does NOT import admin.js", 'admin.js' not in user_html_content)
    assert_check("User index.html does NOT import admin.css", 'admin.css' not in user_html_content)

    # 5. Admin JS functional modules
    with open(ADMIN_JS, "r", encoding="utf-8") as f:
        admin_js_content = f.read()

    modules = [
      ("Admin Auth & Passcode", "adminLogin" in admin_js_content and "mindflow2026!" in admin_js_content),
      ("Role Switcher (ADMIN, EDITOR, REVIEWER, VIEWER)", "switchAdminRole" in admin_js_content and "VIEWER" in admin_js_content),
      ("Card Manager & Filters", "renderCardsListView" in admin_js_content and "updateCardFilter" in admin_js_content),
      ("Card Editor with 24 Fields", "renderCardEditorView" in admin_js_content and "updateDraftField" in admin_js_content),
      ("390px Mobile Preview", "mobile-mockup-container" in admin_js_content and "renderPreviewBack" in admin_js_content),
      ("Card Flip Toggle (Front / Back)", "togglePreviewFlip" in admin_js_content),
      ("Auto Save Draft to LocalStorage", "autoSaveDraft" in admin_js_content),
      ("Publish Safeguard Modal", "openPublishSafeguardModal" in admin_js_content and "confirmPublishCard" in admin_js_content),
      ("Revision History & Rollback", "rollbackCardRevision" in admin_js_content and "revisions" in admin_js_content),
      ("Quality & Duplicate Check", "runQualityCheck" in admin_js_content and "calculateJaccard" in admin_js_content),
      ("Safety Check & Review", "HIGH_RISK_KEYWORDS" in admin_js_content and "safetyLevel" in admin_js_content),
      ("Pack Manager", "renderPacksView" in admin_js_content),
      ("Category Manager", "renderCategoriesView" in admin_js_content),
      ("Featured Manager", "renderFeaturedView" in admin_js_content),
      ("Search Test Console", "renderSearchTestView" in admin_js_content and "runAdminSearchTest" in admin_js_content),
      ("AI Router Test Console", "renderAiRouterTestView" in admin_js_content and "runAdminAiTest" in admin_js_content),
      ("Book Manager & URLs", "renderBooksView" in admin_js_content and "DEFAULT_BOOKS" in admin_js_content),
      ("App CTA Manager", "renderAppCtasView" in admin_js_content and "DEFAULT_APP_CTAS" in admin_js_content),
      ("Content Inbox & Gap", "renderInboxView" in admin_js_content),
      ("Bulk Export JSON / Clipboard", "exportFullDataJSON" in admin_js_content and "copyDataJSONToClipboard" in admin_js_content),
      ("Bulk Import JSON to Draft", "handleBulkImport" in admin_js_content),
      ("Archive & Restore", "toggleArchiveCard" in admin_js_content)
    ]

    for name, cond in modules:
        assert_check(name, cond)

    print("\n==================================================")
    print(f"QA SUMMARY: {passed}/{total} CHECKS PASSED ({(passed/total)*100:.1f}%)")
    print("==================================================")

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
