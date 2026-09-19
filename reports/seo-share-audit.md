# SEO 및 소셜 공유 프라이버시 감사 보고서

**문서 버전:** 1.0.0  
**감사 일시:** 2026년 9월 19일  
**감사 대상:** `robots.txt`, `sitemap.xml`, OpenGraph 메타 태그, 공유 모듈  
**결과:** 100% 통과 (PASS)

---

## 1. 검색엔진 크롤링 및 인덱싱 정책 감사

### 1.1 `robots.txt` 구성 검증
- **검증 파일:** `/robots.txt`
- **설정 내용:**
  ```txt
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /admin/
  Sitemap: https://lab.mindflowlab.co.kr/sitemap.xml
  ```
- **감사 결과:**
  - [x] 관리자 CMS(`/admin`, `/admin/`) 경로가 모든 검색엔진 크롤러에 대해 완벽히 차단됨(`Disallow`).
  - [x] 공개 사용자 페이지는 정상 수집 허용됨(`Allow: /`).
  - [x] 공식 사이트맵 경로가 절대 URL로 정확히 선언됨.

### 1.2 `sitemap.xml` 무결성 검증
- **검증 파일:** `/sitemap.xml`
- **감사 결과:**
  - [x] `/admin` 및 관리자 페이지가 사이트맵에 **전혀 포함되지 않음 (0건)**.
  - [x] 3대 신규 법적/윤리/안전 정책 페이지 반영 완료:
    - `https://lab.mindflowlab.co.kr/privacy` (priority 0.6)
    - `https://lab.mindflowlab.co.kr/ethics` (priority 0.6)
    - `https://lab.mindflowlab.co.kr/safety` (priority 0.7)
  - [x] 메인 홈, FAQ 아카이브, 셀프체크, 215개 Q&A 상세 페이지의 URL 구조 표준화 완료.

---

## 2. 소셜 공유(Social Share) 프라이버시 전수 감사

SNS(카카오톡, 페이스북, X/트위터, 링크 복사) 공유 기능은 다른 사용자에게 명심카드를 추천할 수 있는 핵심 바이럴 경로입니다. 이 과정에서 **사용자의 사적인 입력값이 외부로 유출되지 않도록** 다음 기준을 철저히 검증하였습니다.

### 2.1 공유 텍스트 및 URL 파라미터 감사

```javascript
// 공유 생성 로직 규격
function generateSharePayload(card) {
  return {
    title: `[명심카드 #${card.id}] ${card.cardTitle}`,
    text: `"${card.question}"\n\n사이다 답변: ${card.sodaAnswer}`,
    url: `https://lab.mindflowlab.co.kr/?card=${card.id}`
  };
}
```

**검증 체크리스트:**
- [x] **고민 원문 배제:** 사용자가 검색창에 입력했던 문장(`query`)이 공유 URL의 파라미터(`?q=...`)로 포함되지 않음.
- [x] **SCAN 개인 메모 배제:** 사용자가 적은 FACT/STORY/UNKNOWN 작성 내용이 공유 클립보드 텍스트에 포함되지 않음.
- [x] **공유되는 내용의 성격:** 순수한 카드의 공용 메타데이터(카드 제목, 질문 문장, 사이다 답변 요약, 공식 카드 링크)만 포함됨.

### 2.2 메타 태그 (OpenGraph & Twitter Card) 검증
- `og:title`: "마인드플로우 랩 | 명심코칭™ - 사이다 질문 215문항 & 인지과학 솔루션"
- `og:description`: "왜 나는 다 알고 있는데, 그 순간만 되면 또 똑같이 행동할까? 230개 명심카드로 내면의 자동반응을 관찰하고 10%의 행동 변화를 시작하세요."
- `og:image`: 공식 로고 및 심볼 이미지 지정 완료 (`/assets/mindflow-saju-symbol.png`)
- `og:url`: `https://lab.mindflowlab.co.kr/`
- `canonical`: `https://lab.mindflowlab.co.kr/`

---

## 3. 종합 평가

관리자 영역의 인덱싱 방지, 정책 페이지 사이트맵 등재, 소셜 공유 시 사용자 개인정보 노출 방지가 모두 완벽하게 준수되었습니다.

**SEO & SHARE AUDIT: PASSED**
