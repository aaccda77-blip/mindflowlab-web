# 📚 명심코칭 카드 콘텐츠 & 서비스 운영 관리자 매뉴얼 (MVP CMS Manual)

본 문서는 관리자가 개발자의 도움 없이도 **질문 추가, 사이다 답변 수정, 키워드 편집, 추천 도서 및 CTA 변경, 큐레이션(Featured) 설정**을 직접 할 수 있도록 안내하는 운영 가이드입니다.

---

## 🗂️ 핵심 파일 구성

| 파일명 | 역할 | 설명 |
| :--- | :--- | :--- |
| **`data/mind-cards.json`** | 🗃️ 카드 콘텐츠 DB | 질문, 사이다 답변, 1분 SCAN, 10% 행동 등 모든 카드 데이터 (현재 30개, 최대 500개 무제한 확장) |
| **`data/service-config.json`** | 🔗 실제 서비스 링크 | 명심코칭 앱 및 청류출판사 3대 도서 실제 웹/스토어 주소 설정 |
| **`data/schema.json`** | 🛡️ 무결성 규격서 | 24개 필수 필드 누락 방지 표준 규격 (Draft 2020-12) |
| **`scripts/validate-cards.py`** | ⚡ 원클릭 자동 검증기 | 데이터 오탈자 검증 및 오프라인 번들 자동 동기화 CLI |

---

## ⚙️ 1. 실제 서비스 링크 변경 방법 (`data/service-config.json`)

실제 출시된 앱 주소나 YES24의 개별 도서 상세 페이지 URL을 변경할 때는 이 파일만 수정하시면 됩니다:

```json
{
  "APP_URL": "https://myeongsimcoaching.com",
  "PUBLISHER_URL": "https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4",
  "DARK_CODE_BOOK_URL": "https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4",
  "NEURAL_CODE_BOOK_URL": "https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4",
  "ZERO_POINT_BOOK_URL": "https://www.yes24.com/Product/Search?domain=BOOK&query=%EC%B2%AD%EB%A5%98+%EC%9D%B4%EA%B2%BD%EC%9C%A4"
}
```
* 카드의 **`relatedBook`**에 `"다크 코드"`가 적혀있으면 사용자가 책 버튼 클릭 시 자동으로 `DARK_CODE_BOOK_URL`로 이동합니다.
* `"뉴럴 코드"` ➔ `NEURAL_CODE_BOOK_URL`, `"제로 포인트"` ➔ `ZERO_POINT_BOOK_URL`로 자동 연결됩니다.

---

## 📝 2. 카드 콘텐츠 등록 및 수정 (`data/mind-cards.json`)

새로운 카드를 추가할 때는 `data/mind-cards.json` 파일의 대괄호 `[...]` 안에 아래 양식의 JSON 객체를 복사하여 붙여넣고 내용만 바꾸시면 됩니다.

```json
{
  "id": "relationship-reply-001",
  "category": "관계·심리",
  "keyword": "답장불안",
  "cardTitle": "마음읽기 모드",
  "question": "답장이 늦으면 왜 최악부터 생각할까요?",
  "sodaAnswer": "답장이 늦었다는 사실과 마음이 식었다는 해석은 같은 것이 아닙니다.",
  "description": "마음은 UNKNOWN 상태를 불편해하기 때문에 아직 확인되지 않은 부분을 STORY로 빠르게 채울 수 있습니다.",
  "curiosityQuestion": "나는 모르는 시간을 어떤 이야기로 가장 빨리 채우는 편일까?",
  "scanQuestion": "답장을 기다리는 동안 가장 먼저 무엇이 올라왔나요?",
  "factQuestion": "실제로 확인된 것은 무엇인가요?",
  "storyQuestion": "그 사실에 나는 어떤 의미를 붙였나요?",
  "unknownQuestion": "아직 확인되지 않은 것은 무엇인가요?",
  "bodyQuestion": "몸에서는 어디가 가장 먼저 긴장했나요?",
  "syncSentence": "불확실해서 확인하고 싶은 마음이 올라오는구나.",
  "shiftQuestion": "지금 바로 결론내리지 않는다면 어떤 선택이 가능할까요?",
  "tenPercentAction": "30분 동안 추가 메시지를 보내지 않고 기다려본다.",
  "relatedBook": "다크 코드",
  "relatedBookChapter": "제2장 · 무의식적 마음읽기와 투사의 해체",
  "appCTA": "내 관계 패턴 SCAN하기",
  "bookCTA": "마음읽기 패턴의 뿌리 읽기",
  "searchKeywords": [
    "답장",
    "카톡",
    "연락",
    "마음 식음",
    "연락불안",
    "답장이 안 와요",
    "읽씹"
  ],
  "safetyLevel": "일상관찰",
  "isFeatured": true,
  "popularity": 98
}
```

### 🎯 주요 관리자 설정 팁
1. **메인 홈 큐레이션에 노출하고 싶을 때**:
   - `"isFeatured": true` 로 설정하면 홈페이지 하단의 **"요즘 사람들이 가장 많이 마주하는 질문"** 가로 캐러셀에 우선 노출됩니다.
2. **검색 노출을 높이고 싶을 때**:
   - 사용자가 검색창에 입력할 만한 일상 표현(예: `"답장이 안 와요"`, `"거절을 못하겠어요"`)을 `"searchKeywords"` 배열에 넣어주세요.
3. **도서 연계**:
   - `"relatedBook"`에는 `"다크 코드"`, `"뉴럴 코드"`, `"제로 포인트"` 중 하나를 기입합니다.
4. **비진단 원칙 준수**:
   - 사용자를 "회피형", "불안형" 등으로 낙인찍지 마시고, `"~모드"`, `"작동기록"` 관점으로 작성해주세요.

---

## ⚡ 3. 검증 및 배포 (원클릭 동기화)

카드나 링크 수정을 마친 후 터미널에서 다음 명령어를 실행합니다:
```bash
python scripts/validate-cards.py
```

* 24개 필수 필드 누락 여부, 중복 ID, 링크 정상 여부를 0.1초 만에 검사합니다.
* 검증 통과 시 오프라인/로컬 캐시 번들(`js/mind-cards-data.js`)까지 자동으로 동기화되어 배포가 완료됩니다! ✨
