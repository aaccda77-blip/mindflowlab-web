# 명심코칭 개인 홈 v2 프라이버시 및 민감 데이터 보호 감사 보고서
(MYUNGSIM PERSONAL HOME v2 PRIVACY & SENSITIVE DATA AUDIT)

> **원칙 선언:**  
> “개인 홈은 사용자의 내밀한 고민을 박제하여 노출하는 곳이 아니라, 사용자가 스스로를 안전하게 돌아보는 쉼터여야 합니다.”

---

## 1. 이전 고민 자동노출 전면 금지 (No Sensitive Auto-Context)

개인 홈 Hero 화면 상단에 다음과 같은 민감한 과거 고민을 자동으로 채워 넣거나 노출하지 않습니다:
- ❌ “지난번 남편 문제는 어떠세요?”
- ❌ “최근 부모님 때문에 힘드셨죠?”
- ❌ “당신은 최근 관계불안 지수가 높습니다.”

**준수 메커니즘:**  
입력창은 항상 깨끗한 상태로 제공되며, 사용자가 명시적으로 **[지난 발견과 연결해서 볼까요?]** Continuity Mode 스위치를 켰을 때만 이전 맥락이 활성화됩니다 (기본값: **OFF**).

---

## 2. 라우터 맥락 오염 방지 (History Auto-Context 차단)

새 고민을 입력했을 때 라우터(`RuleBasedRouter`)가 사용자의 과거 연애사, 원가족 갈등, 작동지도 전체를 몰래 합쳐서 왜곡 분석하지 않습니다.
- **원칙:** `CURRENT CONCERN FIRST`
- 현재 입력된 고민을 객관적 사실 위주로 독립 라우팅합니다.

---

## 3. 개인 홈 분석 이벤트와 원문 격리 감사

| 이벤트명 | 수집 목적 | 허용 메타데이터 (비민감) | 차단된 민감 원문 |
| :--- | :--- | :--- | :--- |
| `personal_home_view` | 홈 진입률 측정 | `state`, `hasActiveExp`, `historyCount` | **사용자 고민 원문, 일기 (0건)** |
| `primary_cta_shown` | 추천 상태 측정 | `state`, `primaryAction` | **0건** |
| `primary_cta_clicked`| 액션 전환율 측정 | `primaryAction`, `hasQuery` (boolean) | **입력 텍스트 원문 (0건)** |
| `continue_previous_clicked`| 연속성 모드 측정 | `enabled` (boolean) | **0건** |
| `active_experiment_opened` | 팔로업 복귀율 | `experimentId` (난수) | **실험 예상/실제 내용 (0건)** |

---

## 4. 관리자 CMS 프라이버시 무결성 검증

관리자 전용 화면([`/admin/personal-home.html`](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/personal-home.html)):
- 홈 방문수(Views), Primary State 분포, CTA 전환율, 에러율만 집계.
- 개별 사용자의 고민 텍스트, 예상 내용, 실제 사실 기록은 **0건(Zero Raw Text)**으로 완벽히 차단됨을 검증했습니다.
