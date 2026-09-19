#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
명심코칭 Experience Intelligence & Privacy Architecture 종합 검증 스크립트
(c) 2026 Mindflow Lab. All rights reserved.
"""

import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def check_file_exists(rel_path):
    full_path = os.path.join(BASE_DIR, rel_path)
    exists = os.path.isfile(full_path)
    status = "PASS" if exists else "FAIL"
    print(f"[{status}] 파일 존재 확인: {rel_path}")
    return exists, full_path

def verify_data_charter():
    print("\n--- 1. 데이터 헌장 (data-charter.html) 검증 ---")
    exists, path = check_file_exists("data-charter.html")
    if not exists:
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    required_snippets = [
        "명심코칭의 Experience Intelligence는 사람을 더 많이 알아내는 시스템이 아니라",
        "Layer A: Public Knowledge",
        "Layer B: Personal Space",
        "Layer C: Anonymous Signals",
        "Layer D: Aggregated Learning",
        "Zero Raw Text",
        "인간 승인 루프"
    ]

    all_passed = True
    for snip in required_snippets:
        if snip in content:
            print(f"  [PASS] 핵심 키워드/선언문 포함: '{snip[:30]}...'")
        else:
            print(f"  [FAIL] 필수 키워드 누락: '{snip}'")
            all_passed = False
    return all_passed

def verify_intelligence_center():
    print("\n--- 2. Experience Intelligence Center (admin/intelligence.html) 검증 ---")
    exists, path = check_file_exists("admin/intelligence.html")
    if not exists:
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = [
        "Experience Health",
        "Signal Map",
        "What We Learned",
        "Content Gap Map",
        "Action Intelligence",
        "Return With Purpose",
        "Reassurance Loop Watch",
        "Product Memory",
        "Human Decision Panel"
    ]

    all_passed = True
    for sec in sections:
        if sec in content:
            print(f"  [PASS] 필수 운영 섹션 포함: {sec}")
        else:
            print(f"  [FAIL] 필수 운영 섹션 누락: {sec}")
            all_passed = False
    return all_passed

def verify_admin_integration():
    print("\n--- 3. 관리자 사이드바 및 렌더러 통합 (admin/admin.js) 검증 ---")
    exists, path = check_file_exists("admin/admin.js")
    if not exists:
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    required = [
        "intelligence",
        "renderIntelligenceView",
        "Experience Intelligence",
        "경험 지능 센터"
    ]

    all_passed = True
    for r in required:
        if r in content:
            print(f"  [PASS] 관리자 로직/버튼 포함: {r}")
        else:
            print(f"  [FAIL] 관리자 연동 로직 누락: {r}")
            all_passed = False
    return all_passed

def verify_public_links():
    print("\n--- 4. 공개 링크 및 사이트맵 연동 검증 ---")
    all_passed = True

    # index.html check
    _, index_path = check_file_exists("index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    if "data-charter.html" in index_content or "data-charter" in index_content:
        print("  [PASS] index.html에 데이터 헌장 링크 확인")
    else:
        print("  [FAIL] index.html에 데이터 헌장 링크 누락")
        all_passed = False

    # sitemap.xml check
    _, sitemap_path = check_file_exists("sitemap.xml")
    with open(sitemap_path, "r", encoding="utf-8") as f:
        sitemap_content = f.read()
    if "data-charter" in sitemap_content:
        print("  [PASS] sitemap.xml에 data-charter 등록 확인")
    else:
        print("  [FAIL] sitemap.xml에 data-charter 누락")
        all_passed = False

    return all_passed

def verify_four_reports():
    print("\n--- 5. 4대 공식 보고서 검증 ---")
    reports = [
        "reports/experience-intelligence-architecture.md",
        "reports/experience-intelligence-current.md",
        "reports/product-learning-history.md",
        "reports/open-product-questions.md"
    ]
    all_passed = True
    for rep in reports:
        exists, _ = check_file_exists(rep)
        if not exists:
            all_passed = False
    return all_passed

def verify_zero_raw_text_leaks():
    print("\n--- 6. Zero Raw Text 프라이버시 누출 감사 (Codebase Audit) ---")
    # 검사 대상: 주요 js 파일들
    targets = [
        "js/app.js",
        "js/mindflow-coach.js",
        "js/analytics.js",
        "admin/admin.js"
    ]

    suspicious_patterns = [
        r"gtag\s*\(\s*['\"]event['\"].*?user_text",
        r"trackEvent\s*\(.*?raw_query",
        r"sendBeacon\s*\(.*?userInput",
        r"localStorage\.setItem\s*\(\s*['\"]server_sync_raw_secret['\"]"
    ]

    all_passed = True
    leak_count = 0

    for rel in targets:
        full = os.path.join(BASE_DIR, rel)
        if not os.path.isfile(full):
            continue
        with open(full, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()

        for pat in suspicious_patterns:
            matches = re.findall(pat, code, re.IGNORECASE)
            if matches:
                print(f"  [ALERT] 잠재적 누출 의심 패턴 발견 in {rel}: {matches}")
                leak_count += len(matches)
                all_passed = False

    if leak_count == 0:
        print("  [PASS] 프론트엔드/관리자 코드 내 원문 전송 누출 0건 (Zero Raw Text Verified)")
    else:
        print(f"  [FAIL] {leak_count}건의 누출 의심 패턴 감지됨")

    return all_passed

def main():
    print("=" * 60)
    print(" 명심코칭 Experience Intelligence & Privacy 종합 무결성 감사")
    print("=" * 60)

    results = [
        verify_data_charter(),
        verify_intelligence_center(),
        verify_admin_integration(),
        verify_public_links(),
        verify_four_reports(),
        verify_zero_raw_text_leaks()
    ]

    print("\n" + "=" * 60)
    if all(results):
        print(" [최종 결과] 모든 감사 통과! (ALL AUDITS PASSED - 100%)")
        print(" EXPERIENCE INTELLIGENCE READY: YES")
        print("=" * 60)
        sys.exit(0)
    else:
        print(" [최종 결과] 일부 항목 실패 (AUDIT FAILED)")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
