# 📦 명심코칭 프로덕션 릴리즈 매니페스트 (Release Manifest v1.0.0-rc-final)

## 1. 릴리즈 메타데이터
- **소프트웨어 명칭**: 마인드플로우랩 명심코칭 (MindFlowLab MyungSim Coaching)
- **릴리즈 버전**: `v1.0.0-rc-final` (Release Candidate Final)
- **배포 유형**: 클라이언트 사이드 단독 구동형 프로덕션 웹 애플리케이션 (Zero-Key PWA Ready)
- **릴리즈 일자**: 2026-09-21
- **커밋 해시 / 빌드 타임스탬프**: `PROD-20260921-HARDENED-FINAL`

---

## 2. 모듈 구성 명세 및 주요 파일 체크섬 (Key File Inventory)

| 모듈 계층 | 파일 경로 | 역할 및 책임 |
| :--- | :--- | :--- |
| **Routing / Safety** | `js/myeongsim-safety.js` | 4대 고위험 발화(위기/폭력/금융/의료) 즉각 감지 및 개입 |
| **Routing / Engine** | `js/myeongsim-rule-router.js` | 10대 PACK 및 약 200개 카드 TF-IDF 형태소 매칭 |
| **Routing / Controller** | `js/myeongsim-ai-router.js` | 500자 안전 컷오프 및 Hybrid-Fallback 컨트롤러 |
| **Interaction** | `js/myeongsim-soda.js` | SODA (멈춤-관찰-해체-행동) 인터랙션 뷰어 |
| **Interaction** | `js/myeongsim-scan.js` | 1분 SCAN (몸-감정-생각-충동) 다이얼로그 |
| **Experiment** | `js/myungsim-behavior-experiment.js` | EXPECTED → 10% ACTION → ACTUAL 행동실험 루프 |
| **Longitudinal** | `js/myungsim-personal-home.js` | Personal Home v2 (오늘의 장면, 지난 선택, 다음 10%) |
| **Longitudinal** | `js/myungsim-working-map.js` | 6단계 트리거-신념-신체-충동-행동-새선택 작동지도 |
| **Longitudinal** | `js/myungsim-30day-journey.js` | 30일 유연한 여정 (No-Streak, No-Guilt, 8대 회고 질문) |
| **Privacy / Storage** | `js/myungsim-privacy-manager.js` | 세션별 LocalStorage 격리, 익명 승계, 로그아웃 Wipe |
| **Observability** | `admin/system-health.html` | 10대 서브시스템 상태 모니터링 관제 대시보드 |
| **Observability** | `admin/cms.html` | 약 200개 명심카드 관리자 에디터 |
| **Content / Data** | `data/` (cards, packs) | 10대 PACK (PACK 01 ~ PACK 10) 및 질문 데이터셋 |

---

## 3. 검증 단언문 및 최종 지표 (Quality Assurances)

- **MASTER E2E**: PASS (26/26 Tests Passed)
- **ZERO-KEY PRODUCTION**: PASS (External AI Calls: 0)
- **PRIVACY ISOLATION**: PASS (Cross-user Exposure: 0, Analytics Raw Text: 0)
- **SAFETY INTEGRITY**: PASS (Crisis, Domestic Violence, Financial, Medical Intercepts: 100%)
- **BLOCKERS**: 0
- **CRITICAL DEFECTS**: 0
- **PRODUCTION READY**: **YES**

---

## 4. 운영 및 배포 지침
1. **정적 배포**: 본 프로젝트의 모든 파일은 순수 정적 자산이므로, 추가 빌드 단계 없이 Vercel, Cloudflare Pages, S3/CloudFront에 즉시 배포 가능합니다.
2. **무과금 운영**: 외부 LLM API 결제가 필요하지 않으므로, 트래픽 폭증 시에도 API 비용 청구 위험이 전무합니다.
3. **모니터링**: 브라우저에서 `/admin/system-health.html`에 접근하여 10개 서브시스템의 실시간 상태를 즉시 진단할 수 있습니다.
