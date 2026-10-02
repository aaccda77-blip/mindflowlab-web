# 🛡️ Safety 인시던트 대응 표준 런북 (Safety Incident Runbook)

## 1. 개요 및 절대 원칙
- **적용 대상**: 자해/자살, 가정폭력/성폭력/아동학대, 전재산 몰빵 투자, 임의 정신과 약물 중단 등 4대 고위험 발화와 관련된 라우팅 이상.
- **절대 원칙**: 
  1. 위기 상황에 처한 사용자에게 '내면 성찰'이나 '일반 명심카드'를 추천하는 것은 치명적 결함(P0)입니다.
  2. 인시던트 기록 및 보고 시 실제 사용자의 사적인 위기 문장 원문은 절대로 복사·첨부하지 않습니다. 합성 재현 키워드만 사용합니다.

---

## 2. 장애 대응 7단계 절차

```text
DETECT (탐지)
  ↓
CONTAIN (격리)
  ↓
REPRODUCE (합성 재현)
  ↓
FIX (규칙 보강)
  ↓
RETEST (골든셋 검증)
  ↓
REVIEW (동료 검토)
  ↓
CLOSE (종결 및 배포)
```

### 1단계: DETECT (탐지)
- 모니터링 알림 또는 운영센터 최상단 NEEDS ATTENTION에 `Safety Router 회귀 결함 감지` 발생.
- 미탐(False Negative): 고위험 발화가 일반 명심카드로 진입한 경우.
- 오탐(False Positive): 일상적 고민("과식해서 죽겠어요")이 위기 모달로 잘못 차단된 경우.

### 2단계: CONTAIN (격리)
- 고위험 미탐 발생 시, 의심 키워드 정규식을 `js/myeongsim-safety.js`의 Hotfix 패치 블록에 즉각 추가하여 안전 모달이 강제 표출되도록 조치.

### 3단계: REPRODUCE (합성 재현)
- `tests/` 또는 `scripts/test-master-production-e2e.js`에 실제 발화가 아닌 **합성 문장**을 추가하여 실패 재현.
  - 예: `"TC-SYNTHETIC-CRISIS-09: 너무 지치고 삶을 끝내고 싶어요"`

### 4단계: FIX (규칙 보강)
- `js/myeongsim-safety.js` 내부 사전 및 정규표현식 보강.
- 비진단성 및 긴급 상담 연락처(자살예방상담 109, 정신건강 1577-0199, 여성긴급전화 1366) 안내 컴포넌트 무결성 확인.

### 5단계: RETEST (골든셋 검증)
- Safety Regression Test Suite 실행:
  `node scripts/test-master-production-e2e.js`

### 6단계: REVIEW & LEARN
- 관리자 감사 로그(Audit Log)에 변경 사유 기록.
- Product Learning Archive에 "위기 키워드 변형 매칭 규칙 보강" 요약 저장.

### 7단계: CLOSE (종결)
- 운영센터([/admin/operations.html](file:///c:/Users/aaccd/Downloads/마인드플로우랩홈페이지/admin/operations.html))에서 인시던트 상태를 `CLOSED`로 갱신.
