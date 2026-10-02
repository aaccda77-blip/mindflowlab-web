# 📊 명심코칭 실측 인프라 백업 매트릭스 보고서 (Backup Matrix Report)

## 1. 개요 및 인프라 현실 기반 평가
명심코칭은 정적 웹 호스팅(Vercel)과 클라이언트 사이드 로컬 스토리지(LocalStorage)를 기본 코어로 사용하며, 엔터프라이즈 확장 시 Private DB를 선택적으로 연동합니다. 실측 기반의 현실적인 RPO와 RTO를 기술합니다.

---

## 2. 실측 백업 매트릭스

| 영역 | 백업 방식 | RPO | RTO | 암호화 상태 | 복구 검증 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canonical Content** | Git Tag + Snapshot | **0** | **< 15분** | Git SHA + 저장소 암호화 | **PASS** |
| **Router / Safety** | Versioned Script | **0** | **< 5분** | 소스 코드 무결성 | **PASS** |
| **Client LocalStorage** | User Session Export | **< 24h** | **< 1분** | OS/브라우저 샌드박스 | **PASS** |
| **External AI Failure** | 100% Rule Fallback | **0** | **즉시 (0초)**| 무관 (Zero-Key) | **PASS** |
| **Cloud DB PITR** | 클라우드 DB 연동 시 | TBD | TBD | Provider 기본 지원 | **NOT TESTED** |
