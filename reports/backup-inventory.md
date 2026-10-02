# 📦 명심코칭 백업 자산 인벤토리 명세서 (Backup Inventory)

## 1. 개요
명심코칭 시스템을 구성하는 전체 데이터 및 자산의 백업 대상 여부, 저장 위치, 보존 방식을 명시합니다.

---

## 2. 자산별 인벤토리 및 보존 분류

| 자산 분류 | 항목 | 백업 대상 여부 | 저장 위치 / 메커니즘 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Tier A** | 명심카드 200종 및 팩 데이터 | **YES (필수)** | Git Repository / Canonical Content DB | 버전 스냅샷 관리 |
| **Tier A** | 라우터 설정 및 동의어 사전 | **YES (필수)** | `js/myeongsim-rule-router.js` / Config | 버전별 롤백 보존 |
| **Tier A** | Safety 규칙 및 위기 카피 | **YES (필수)** | `js/myeongsim-safety.js` / Config | 롤백 최우선 |
| **Tier B** | 사용자 SCAN, 일기, 행동실험 | **YES (프라이버시)** | Browser LocalStorage / User DB | Deletion Replay 대상 |
| **Tier B** | 30일 여정 기록 | **YES (프라이버시)** | Browser LocalStorage / User DB | Deletion Replay 대상 |
| **Tier C** | 일일 카드 노출/선택 메트릭 | **YES (선택)** | 익명 통계 스토어 | 유실 시 재집계 수용 |
| **Tier C** | Content Gap 신호 통계 | **YES (선택)** | 집계 메트릭 스토어 | 비정기 스냅샷 |
| **Tier D** | TF-IDF 검색 인덱스 | **NO (Rebuild)** | 브라우저 인메모리 | 카드 원본에서 자동 생성 |
| **Tier D** | 사이트맵 및 OG 캐시 | **NO (Rebuild)** | 빌드 아티팩트 | 빌드 시 자동 재생성 |
| **Tier E** | 배포 토큰 및 시크릿 | **NO (Secret Store)** | Vercel Environment Secret Store | 백업 덤프에 평문 포함 금지 |
