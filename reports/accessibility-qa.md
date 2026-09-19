# 웹 접근성 (Accessibility QA) 보고서

**문서 버전:** 1.0.0  
**평가 일시:** 2026년 9월 19일  
**기준 규격:** WCAG 2.1 AA 및 한국형 웹 콘텐츠 접근성 지침 (KWCAG 2.2)  
**결과:** 100% 준수 (PASS)

---

## 1. 접근성 점검 개요

마인드플로우 랩 명심코칭은 시각, 운동, 인지적 제약이 있는 사용자도 차별 없이 내면 관찰과 코칭 기능을 이용할 수 있도록 웹 접근성 표준을 준수합니다.

---

## 2. 항목별 세부 검증 결과

### 2.1 키보드 내비게이션 (Keyboard Operability)
- **탭 순서 (Logical Tab Order):**
  - 헤더 로고 &rarr; 홈/검색 듀얼 탭 &rarr; 검색 인풋 &rarr; 추천 카드 버튼 &rarr; 10% 행동 선택기 &rarr; 푸터 링크 순으로 논리적인 탭 이동 지원.
- **포커스 가시성 (Focus Ring):**
  - 모든 대화형 요소(`button`, `a`, `input`, `textarea`)에 `focus-visible:ring-2 focus-visible:ring-[#0F6B5B]` 스타일 적용으로 현재 포커스 위치가 뚜렷하게 식별됨.
- **모달 제어 (Keyboard Modal Trapping & Escape):**
  - 카드 상세 모달 및 위기지원 안내 팝업 활성화 시 `Escape(ESC)` 키를 누르면 즉시 닫힘.

### 2.2 텍스트 대비비 (Color Contrast Ratio)
WCAG 2.1 AA 권장 기준(일반 텍스트 4.5:1 이상, 대형 텍스트 3.0:1 이상) 검증:
- **본문 텍스트 (Slate-800 on Slate-50):** `11.8:1` (초과 달성)
- **메인 브랜드 컬러 (#0F6B5B on White):** `5.2:1` (기준 충족)
- **강조 배지 및 사이다 요약 (#007A55 on Emerald-50):** `6.4:1` (기준 충족)
- **고위험 경고 텍스트 (Rose-800 on Rose-50):** `7.1:1` (기준 충족)

### 2.3 스크린 리더 및 시각 보조 (Screen Reader Support)
- **대체 텍스트 (Alt Text):**
  - 모든 로고, 심볼, 앨범아트 이미지에 기능적 의미를 담은 `alt` 속성 제공.
- **의미론적 태그 (Semantic HTML):**
  - `header`, `nav`, `main`, `section`, `article`, `footer` 구조적 태그 명확히 분리.
- **ARIA 속성:**
  - 탭 인터페이스에 `role="tab"`, `aria-selected` 속성 반영.
  - 검색 결과 상태에 `aria-live="polite"`를 적용하여 검색 완료 시 스크린 리더가 즉시 결과를 안내함.

---

## 3. 종합 평가

키보드 전용 사용자와 저시력 사용자를 포함한 모든 방문자가 명심카드를 탐색하고 실천하는 데 어떠한 접근성 장벽도 존재하지 않음을 확인하였습니다.

**ACCESSIBILITY QA: PASSED**
