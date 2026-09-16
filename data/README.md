# 📚 명심코칭 카드 콘텐츠 데이터베이스 (CMS Guide)

본 폴더(`data/`)는 명심코칭 웹사이트의 **오늘의 명심 카드** 및 **사이다 Q&A** 콘텐츠의 단일 진실 공급원(Single Source of Truth)입니다.

UI나 자바스크립트 코드를 전혀 수정하지 않고, **`data/mind-cards.json` 파일에 JSON 객체만 추가하면 웹사이트 전체에 300개 이상의 카드가 자동으로 즉시 반영**됩니다.

---

## 📁 파일 구조
* **`data/mind-cards.json`**: 모든 카드 콘텐츠가 담긴 메인 JSON 데이터 파일.
* **`data/schema.json`**: 300개 확장 시 누락 필드가 없도록 검증하는 JSON Schema 규격.
* **`scripts/validate-cards.py`**: 데이터 무결성 검증 스크립트 (`python scripts/validate-cards.py`).

---

## 📝 필수 필드 규격 (13개 핵심 필드)

| 필드명 | 타입 | 설명 | 예시 |
| :--- | :--- | :--- | :--- |
| **`id`** | string | 고유 슬러그 식별자 (중복 불가) | `"overchecking-01"` |
| **`category`** | string | 마음 영역 (불확실성, 경계와 관계, 완벽주의와 통제 등) | `"불확실성"` |
| **`keyword`** | string | 세부 고민 키워드 | `"과잉확인"` |
| **`cardTitle`** | string | 패턴 모드 명칭 | `"확인 모드"` |
| **`question`** | string | 따옴표로 감싼 일상 질문 | `"“왜 나는 확인하고 또 확인할까?”"` |
| **`sodaAnswer`** | string | 사이다 한 줄 통찰 (패러다임 전환) | `"확인은 정보를 얻지만, 반복확인은 불안을 달랩니다."` |
| **`description`** | string | 2~3줄의 본질적 인지과학 원리 설명 | `"새로운 정보가 생기는 확인과 같은 정보를 반복해서 보는 행동은..."` |
| **`curiosityQuestion`** | string | “내 경우에는 어떨까?” 호기심 브릿지 | `"“내 경우에는 무엇을 확인해야 안심할 수 있다고 느끼는 걸까?”"` |
| **`scanQuestion`** | string | 1분 SCAN 신호 관찰 질문 | `"확인 직전에 내 안에서 어떤 생각과 몸의 긴장이 켜졌나요?"` |
| **`syncSentence`** | string | 자기공감 수용 문장 | `"“불안해서 거듭 확인하고 싶은 마음이 올라오는구나.”"` |
| **`shiftQuestion`** | string | 10% 대안 선택 유도 질문 | `"이번에는 한 번 덜 확인한다면 내 삶에 어떤 공간이 생길까?"` |
| **`tenPercentAction`** | string | 오늘 당장 해볼 수 있는 마이크로 실천 | `"오늘 마지막 확인 후 “확인 완료” 말하고 다른 방 가기"` |
| **`relatedBook`** | string | 연계 도서 (`다크 코드` \| `뉴럴 코드` \| `제로 포인트`) | `"다크 코드"` |
| **`bookChapter`** | string | 관련 챕터 또는 원리 명칭 | `"제2장 · 의심의 쳇바퀴와 Body Signature"` |
| **`appCTA`** | string | 앱용 경험 중심 실천 동사 | `"내 확인 패턴 직접 확인하기"` |
| **`appSubtext`** | string | 앱 1분 SCAN 안내 문구 | `"확인 버튼을 누르기 직전의 생각과 몸의 신호를 1분 만에 기록합니다."` |
| **`bookCTA`** | string | 도서용 경험 중심 탐구 동사 | `"확인 모드의 뇌과학 원리 읽기"` |
| **`bookSubtext`** | string | 도서 챕터 탐구 안내 문구 | `"왜 뇌는 불확실성을 생존의 위협으로 착각하는지 원리를 확인하세요."` |
| **`searchKeywords`** | array | 자연어 검색용 동의어/연관 검색어 목록 | `["계속 확인해요", "가스밸브", "불안", "의심"]` |

---

## 🚀 300개 확장 방법
1. `data/mind-cards.json` 파일의 배열(`[...]`) 끝에 위 형식의 JSON 객체를 추가합니다.
2. 터미널에서 검증 명령어를 실행합니다:
   ```bash
   python scripts/validate-cards.py
   ```
3. 검증 통과(`SUCCESS`) 시 끝! 브라우저 새로고침만으로 카드 덱, 자연어 검색, 가로 스크롤 캐러셀에 즉각 반영됩니다.
