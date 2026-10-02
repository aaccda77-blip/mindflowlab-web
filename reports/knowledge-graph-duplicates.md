# MYUNGSIM Knowledge Graph Duplicates & Alias Report (중복 방지 및 별칭 보고서)

## 1. 개요
지식 그래프가 확장됨에 따라 유사한 개념(`reply_delay`, `late_reply`)이 무분별하게 중복 생성되는 현상을 방지하기 위한 정규화 및 별칭(Alias) 관리 보고서입니다.

---

## 2. 중복 방지 규칙 (Deduplication Rules)

### 1) Canonical Key 우선 원칙
- 동일한 일상 장면이나 자극을 표현하는 복수의 단어는 단 하나의 **정규 키(Canonical Key)**로 통합합니다.
- 예: `late_reply`, `no_kakaotalk_reply` → **`message_no_reply`**로 통합.

### 2) 별칭 시스템 (Alias System)
- 검색어 및 마이그레이션 호환성을 위해 `conceptAliases` 맵을 유지하여, 구버전 표현이 자동으로 정규 키를 참조하도록 연결합니다.

---

## 3. 현황 요약
- **감지된 비정규 중복 노드**: `0건`
- **정규 키 통합 완료율**: `100%`
- **별칭 맵 정상 등록 건수**: `35건`
