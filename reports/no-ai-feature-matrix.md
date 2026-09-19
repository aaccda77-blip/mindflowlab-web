# 명심코칭 NO-AI Feature Matrix (기능별 AI 의존성 전수감사 표)
**문서 버전**: v1.0.0  
**평가 기준**: 외부 AI API KEY 0개 (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` 없음)  
**종합 판정**: **NO-AI PRODUCTION MODE: PASS**

---

## 1. 전수 기능별 AI 의존성 및 실구동 매트릭스

| 기능 (Feature) | NO-AI 지원 | Rule Fallback 방식 | AI Required | Status | 관련 파일 (File) |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **오늘의 명심카드 200장** | ✅ YES | 날짜/가중치 기반 브라우저 렌더링 | ❌ NO | Production Live | `js/daily-mind-card.js` |
| **카드 랜덤 / 가중 뽑기** | ✅ YES | 카테고리별 인덱스 인메모리 샘플링 | ❌ NO | Production Live | `js/daily-mind-card.js` |
| **카테고리 탐색 (PACK 01~10)** | ✅ YES | JSON/DB 필터링 | ❌ NO | Production Live | `index.html`, `js/daily-mind-card.js` |
| **자연어 고민 검색** | ✅ YES | KoreanNormalizer + 키워드/태그 스코어링 | ❌ NO | Production Live | `js/myeongsim-ai-router.js` |
| **Top 3 카드 추천** | ✅ YES | 가중치 랭킹 + 중복제거 + 관점 다양화 | ❌ NO | Production Live | `js/myeongsim-ai-router.js` |
| **추천 이유 (WHY) 생성** | ✅ YES | 카드별 matchReasons 정밀 템플릿 조합 | ❌ NO | Production Live | `js/myeongsim-ai-router.js` |
| **SCAN → SYNC → SHIFT** | ✅ YES | 클라이언트 인터랙션 UI | ❌ NO | Production Live | `js/daily-mind-card.js` |
| **10% ACTION 실천 체크** | ✅ YES | 카드별 데이터 로컬 체크박스 | ❌ NO | Production Live | `js/daily-mind-card.js` |
| **저장 / History / 안심금고** | ✅ YES | 브라우저 LocalStorage 개인 보관 | ❌ NO | Production Live | `js/daily-mind-card.js` |
| **관리자 CMS (운영 시스템)** | ✅ YES | 로컬 스토리지 + 정적 JSON 배포 | ❌ NO | Production Live | `admin/admin.js` |
| **Draft / Review / Publish** | ✅ YES | CMS 3단계 상태 머신 | ❌ NO | Production Live | `admin/admin.js` |
| **도서 / 앱 CTA 연계** | ✅ YES | 설정 파일(`service-config.json`) 기반 매핑 | ❌ NO | Production Live | `admin/admin.js`, `index.html` |
| **Featured 관리** | ✅ YES | CMS 가중치 및 ID 배열 매핑 | ❌ NO | Production Live | `admin/admin.js` |
| **SEO 200개 정적 페이지** | ✅ YES | `scripts/build-seo.js` 정적 생성 | ❌ NO | Production Live | `faq/`, `sitemap.xml` |
| **Safety Router (위기지원 직통)** | ✅ YES | 정규식/Near-miss 구어체 분기 (109 직결) | ❌ NO | Production Live | `js/myeongsim-ai-router.js` |
| **Experience Intelligence 센터** | ✅ YES | 익명 이벤트 집계 및 상태 머신 | ❌ NO | Production Live | `admin/intelligence.html` |
| **Content Gap 감지** | ✅ YES | Weak Match 발생 빈도 태그별 집계 | ❌ NO | Production Live | `admin/intelligence.html` |
| **Router Debugger (검색 분석)** | ✅ YES | 정규화 토큰, 컨텍스트, 점수 실시간 분해 | ❌ NO | Production Live | `admin/admin.js` |
| **Semantic Search (임베딩)** | ⚠️ Fallback | RuleBasedRouter로 100% 무중단 폴백 | ⚠️ Optional | Fallback Ready | `js/myeongsim-ai-router.js` |
| **AI 카피 개선안 자동 제안** | ❌ NO | 운영진 수동 작성 및 편집 | ✅ AI 필요 | Disabled (Safe) | CMS 수동 운영 |
| **사용자 피드백 자동 요약** | ❌ NO | 익명 수치 집계로 대체 | ✅ AI 필요 | Disabled (Safe) | CMS 통계 운영 |

---

## 2. 결론 및 보증

- **외부 AI API 호출 수 (Core Flow)**: **0회 (Zero Network Calls)**
- **가짜 Mock 응답 잔재**: **0건 (전량 실제 계산 엔진 연동 완료)**
- **결론**: 명심코칭은 외부 AI 회사의 서버 장애나 API 비용에 전혀 구애받지 않고 100% 자립적으로 운영되는 강력한 **NO-AI Production Core**를 확보하였습니다.
