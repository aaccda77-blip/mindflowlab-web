# ✍️ 콘텐츠 발행 및 언어 QA 런북 (Content Publish & Language QA Runbook)

## 1. 개요 및 목적
명심코칭에 수록되는 약 200개의 명심카드는 인지행동 리프레이밍과 SODA 원칙에 기반합니다. 새로운 카드를 추가하거나 기존 카드를 수정할 때 거쳐야 하는 5단계 품질 파이프라인을 기술합니다.

---

## 2. 5단계 콘텐츠 발행 파이프라인

```text
DRAFT (초안 작성)
  ↓
SAFETY & REALITY CHECK (위기 및 현실폭력 안전 검증)
  ↓
LANGUAGE QA (명심 언어 규약 린터 검사)
  ↓
ROUTER INDEXING (사전 동의어 인덱스 동기화)
  ↓
PUBLISH & VERIFY (배포 및 검색 검증)
```

### 1단계: DRAFT (초안 작성)
- 관리자 CMS([/admin/index.html](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/index.html))에서 카드 메타데이터, 질문, SODA 텍스트, 10% Micro Action 작성.

### 2단계: SAFETY & REALITY CHECK (안전 검증)
- 현실 폭력이나 부당한 착취 상황에 대해 "당신 마음을 고쳐먹으라"는 식의 가스라이팅/내면화 강요 문구가 없는지 검증.
- 10% 행동이 '이직하기', '이혼하기' 같은 거대한 결정이 아닌, '한숨 쉬기', '1분 산책하기' 같은 마이크로 행동인지 확인.

### 3단계: LANGUAGE QA (언어 규약 검증)
- 금지된 4대 어조 위반 여부 자동 검사:
  1. 정체성 낙인 (Identity Labeling)
  2. 병리적 진단 언어 (Diagnosis Language)
  3. 운세/점술식 단정 (Fortune Prediction)
  4. 뇌과학 과장 주장 (Brain Myth)
- `node scripts/lint-content-language.js` 실행 → 위반 0건 확인.

### 4단계: ROUTER INDEXING (인덱스 동기화)
- 카드가 다루는 대표 키워드와 질문 형태소를 `myeongsim-rule-router.js`의 TF-IDF 인덱스에 등록.

### 5단계: PUBLISH & VERIFY (발행 및 확인)
- 배포 후 운영센터의 Content Review Queue에서 결함이 없는지 최종 확인.
