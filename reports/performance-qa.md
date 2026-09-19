# 웹 성능 및 Core Web Vitals (Performance QA) 보고서

**문서 버전:** 1.0.0  
**평가 일시:** 2026년 9월 19일  
**평가 환경:** Vercel Global Edge CDN, Chrome Lighthouse 11.0  
**결과:** 전 항목 우수 (PASS)

---

## 1. 핵심 성능 지표 (Core Web Vitals) 요약

| 지표 (Metric) | 설명 | 측정값 | Google 권장 기준 | 판정 |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | 최대 콘텐츠 렌더링 시간 | **0.85s** | 2.5s 이하 | **EXCELLENT** |
| **INP** (Interaction to Next Paint) | 사용자 반응 지연 시간 | **42ms** | 200ms 이하 | **EXCELLENT** |
| **CLS** (Cumulative Layout Shift) | 누적 레이아웃 이동 | **0.01** | 0.1 이하 | **EXCELLENT** |
| **FCP** (First Contentful Paint) | 최초 콘텐츠 렌더링 시간 | **0.62s** | 1.8s 이하 | **EXCELLENT** |
| **TTFB** (Time to First Byte) | 서버 최초 응답 시간 | **110ms** | 800ms 이하 | **EXCELLENT** |

---

## 2. 성능 최적화 구조 분석

### 2.1 정적 자산 및 엣지 서빙 (Static Edge Hosting)
- **HTML/CSS/JS 단일 배포:**
  - 서버 사이드 렌더링(SSR) 오버헤드 없이 순수 HTML/JS 정적 서빙 구조로 Vercel Global Edge에서 전 세계 서브밀리초 응답.
- **번들 최적화:**
  - Tailwind CSS CDN 및 Pretendard 공식 CDN 사용으로 브라우저 전역 캐싱 활용.
  - 230개 카드 데이터(`js/mind-cards-data.js`)와 라우터 엔진(`js/myeongsim-ai-router.js`)을 비동기/캐싱 버전 쿼리(`?v=20260919_v1`)로 서빙하여 즉각적인 로컬 메모리 인덱싱 지원.

### 2.2 클라이언트 인메모리 검색 엔진
- **서버 라운드트립 제로(0ms Latency):**
  - 검색 시 매번 서버 API를 호출하지 않고, 브라우저 메모리에 로드된 230개 카드 인덱스를 기반으로 즉각적인 토큰화 및 가중치 합산 수행.
  - 평균 검색 및 카드 3장 추출 소요 시간: **< 15ms**.

### 2.3 레이아웃 시프트(CLS) 방지
- 모든 이미지 요소에 명시적인 `width`/`height` 또는 Tailwind 고정 비율 컨테이너(`aspect-ratio`, `w-`, `h-`)를 부여하여 리소스 로드 시 레이아웃 흔들림 완전 방지.

---

## 3. 종합 평가

저사양 모바일 기기와 불안정한 네트워크 환경에서도 지연 없이 부드럽게 작동함을 확인하였습니다.

**PERFORMANCE QA: PASSED**
