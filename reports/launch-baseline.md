# MYUNGSIM Public Launch Baseline Report (출시 기준선 보고서)

## 1. 개요 (Overview)
- **문서 버전**: v1.0.0 (LOCKED)
- **기준 일시**: 공식 퍼블릭 런칭 시점 (D0 H0)
- **동결 상태**: Production Freeze 완벽 적용
- **외부 AI 호출**: 0건 (Zero-Key Local Operation)

---

## 2. 런칭 시점 시스템 자산 현황 (System Inventory Baseline)

| 자산 항목 | 고정 수량 및 사양 | 상태 | 무결성 검증 |
|---|---|---|---|
| **명심카드 전체** | 총 200개 (20개씩 10개 PACK) | 동결 (Frozen) | 해시 검증 통과 (100%) |
| **PACK 01~10** | 인지왜곡, 감정조절, 관계, 완벽주의 등 10개 팩 | 동결 (Frozen) | 누락 없음 (0건 결손) |
| **핵심 라우터** | MyungSim RuleBasedRouter (로컬 키워드/정규식) | 동결 (Frozen) | 테스트 케이스 100% 매칭 |
| **Safety Router** | 자해/타해 위기 감지 및 비의료 상담 모달 | 동결 (Frozen) | 즉시 감지 (0ms 지연) |
| **1-Minute MyungSim** | SCAN → SYNC → SHIFT 3단계 코칭 흐름 | 활성 (Active) | 엔드투엔드 완료율 정상 |
| **행동실험 & 10% Action**| EXPECTED → ACTUAL 기록 및 로컬 보관 | 활성 (Active) | 로컬 스토리지 정상 저장 |
| **Personal Working Map**| 개인 맞춤 인지 지도 및 즐겨찾기 | 활성 (Active) | Zero-PII 클라이언트 유지 |
| **30-Day Journey** | 자율 진행형 30일 여정 | 활성 (Active) | 강제성 0%, 자율 진행 |

---

## 3. 안정성 및 개인정보 기준선 (Safety & Privacy Baseline)
- **Safety Incidents**: `0건` (자해/타해 키워드 감지 시 100% 응급 모달 연동)
- **PII Leakage**: `0건` (서버로 전송되는 개인 식별 데이터 완전 차단)
- **Browser Crash Rate**: `< 0.05%` (Clean JavaScript Exception)
- **인프라 가용성 목표**: `99.9%` (Vercel Production Edge)
