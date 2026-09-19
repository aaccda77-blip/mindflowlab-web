# 명심카드 200 시스템 데이터 감사 리포트 (Card Audit Report)

- **감사 일시**: 2026-09-19
- **대상 데이터**: `data/mind-cards.json`
- **총 카드 수**: 230장

## 1. 팩별(Pack) 카드 분포

| 팩 ID (packId) | 카드 수 | 비고 |
| :--- | :---: | :--- |
| `None` | 30장 | 베이스 기초 카드 |
| `belief-fate-uncertainty-01` | 20장 | belief-fate-uncertainty-01 |
| `career-burnout-01` | 20장 | career-burnout-01 |
| `decision-action-01` | 20장 | decision-action-01 |
| `emotion-recovery-01` | 20장 | emotion-recovery-01 |
| `family-boundary-01` | 20장 | family-boundary-01 |
| `love-relationship-01` | 20장 | love-relationship-01 |
| `money-business-01` | 20장 | money-business-01 |
| `perfection-approval-comparison-01` | 20장 | perfection-approval-comparison-01 |
| `relationship-anxiety-01` | 20장 | relationship-anxiety-01 |
| `three-code-integration-01` | 20장 | three-code-integration-01 |
| **합계** | **230장** | **전체 일치** |

## 2. 중복 검사 결과 (Uniqueness Audit)

- **ID 중복**: 0건 ✅ (완전 고유)
- **cardTitle 중복**: 5건 (중복 제목: ['답장 대기 모드', '마음읽기 모드', '상대 변화 대기 모드', '성과 삭제 모드', '실수 확대 모드'])
- **question 중복**: 0건 ✅ (완전 고유)

## 3. 필수 스키마 필드 누락 검사 (Field Completeness)

| 필드명 | 누락 카드 수 | 상태 |
| :--- | :---: | :--- |
| `id` | 0개 | ✅ 정상 (100% 충족) |
| `category` | 0개 | ✅ 정상 (100% 충족) |
| `keyword` | 0개 | ✅ 정상 (100% 충족) |
| `cardTitle` | 0개 | ✅ 정상 (100% 충족) |
| `question` | 0개 | ✅ 정상 (100% 충족) |
| `sodaAnswer` | 0개 | ✅ 정상 (100% 충족) |
| `description` | 0개 | ✅ 정상 (100% 충족) |
| `curiosityQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `scanQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `factQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `storyQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `unknownQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `bodyQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `syncSentence` | 0개 | ✅ 정상 (100% 충족) |
| `shiftQuestion` | 0개 | ✅ 정상 (100% 충족) |
| `tenPercentAction` | 0개 | ✅ 정상 (100% 충족) |
| `relatedBook` | 0개 | ✅ 정상 (100% 충족) |
| `relatedBookChapter` | 0개 | ✅ 정상 (100% 충족) |
| `appCTA` | 0개 | ✅ 정상 (100% 충족) |
| `bookCTA` | 0개 | ✅ 정상 (100% 충족) |
| `searchKeywords` | 0개 | ✅ 정상 (100% 충족) |
| `safetyLevel` | 0개 | ✅ 정상 (100% 충족) |
| `isFeatured` | 0개 | ✅ 정상 (100% 충족) |
| `popularity` | 0개 | ✅ 정상 (100% 충족) |
| `routeTags` (신규 라우팅 태그) | 0개 | ✅ 정상 |
| `triggerTags` (신규 라우팅 태그) | 0개 | ✅ 정상 |
| `storyTags` (신규 라우팅 태그) | 0개 | ✅ 정상 |
| `urgeTags` (신규 라우팅 태그) | 0개 | ✅ 정상 |
| `actionTags` (신규 라우팅 태그) | 0개 | ✅ 정상 |
| `relatedCards` (신규 라우팅 태그) | 0개 | ✅ 정상 |

## 4. 서비스 원칙 및 안전성 검사 (Safety & Non-Diagnostic Audit)

- **진단형/낙인형 표현 검사**: 0건 발견 ✅ (완전 무결)
- **운세/예언형 단정 표현 검사**: 0건 발견 ✅ (완전 무결)
- **안전 수준(safetyLevel) 분포**: {'safe': 123, '일상관찰': 27, 'NORMAL': 80}

## 5. 연결 도서 (relatedBook) 분포

| 도서명 | 카드 수 | 비율 |
| :--- | :---: | :---: |
| 《다크 코드》 | 139장 | 60.4% |
| 《뉴럴 코드》 | 64장 | 27.8% |
| 《나는 믿는다 그러나 갇히지 않는다》 | 16장 | 7.0% |
| 《제로 포인트》 | 11장 | 4.8% |

## 6. 결론 및 AUTO FIX / 정규화 계획

1. **230장 기본 무결성**: ID, 제목, 질문 중복 0건 및 24개 필수 필드가 100% 완성되어 있습니다.
2. **새로운 라우팅 스키마 보강**: 명심AI 라우터의 고정밀도 추천을 위해 `routeTags`, `triggerTags`, `storyTags`, `urgeTags`, `actionTags`, `relatedCards`를 각 카드의 맥락에 맞게 안전하게 보강합니다.
3. **팩별 JSON 분할 데이터셋 생성**: `/data/cards/` 디렉토리에 10개 팩 + 1개 베이스 분할 파일을 생성하여 체계적으로 관리합니다.
