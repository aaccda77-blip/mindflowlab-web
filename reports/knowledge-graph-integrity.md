# MYUNGSIM Knowledge Graph Integrity Report (무결성 전수 검사 보고서)

## 1. 개요
지식 그래프의 생산 무결성을 위해, 배포 전 전수 자동 검사를 수행한 결과 보고서입니다.

---

## 2. 세부 검사항목별 결과

| 검사 항목 | 허용 기준치 | 실제 관측값 | 판정 |
|---|---|---|---|
| **Broken Edges (깨진 연결)** | 0건 | **0건** | **PASS** |
| **Orphan Published Cards (고립된 카드)** | 0건 | **0건** | **PASS** |
| **Duplicate Canonical Keys (중복 키)** | 0건 | **0건** | **PASS** |
| **Ontology Violation (스키마 위반)** | 0건 | **0건** | **PASS** |
| **Code Level Hierarchy (코드 레벨화)** | 0건 | **0건** | **PASS (차단)** |
| **Missing Book References (도서 누락)** | 0건 | **0건** | **PASS** |

---

## 3. 종합 판정
- **BROKEN GRAPH RELATIONS**: `0건`
- **ORPHAN PUBLISHED CARDS**: `0건`
- **GRAPH INTEGRITY STATUS**: **VALID & READY FOR PRODUCTION**
