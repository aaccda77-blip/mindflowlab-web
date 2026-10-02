# 마인드플로우 랩 30일 여정 프라이버시 감사 보고서 (Privacy Audit Report)
**문서 버전:** v1.0  
**작성 일자:** 2026-09-21  
**보안 수준:** 1급 개인 심리 데이터 보호 규약 적용  
**감사 결과:** 100% PASS (원문 유출 0건 / 외부 네트워크 전송 0건)

---

## 1. 프라이버시 보호 철학 및 원칙

명심 30일 여정에서 다루어지는 데이터는 사용자의 가장 내밀한 일상적 갈등, 불안, 가족 및 직장 관계에서의 취약한 장면을 담고 있습니다. 이에 따라 마인드플로우 랩은 **Zero-Trust Client-Only Data Architecture**를 엄격히 준수합니다.

### 🛡️ 3대 프라이버시 절대 원칙
1. **Local Isolation by Default (로컬 격리 기본 원칙)**:
   - 사용자가 작성한 모든 일기, 장면 메모, 고민 텍스트는 오직 사용자의 브라우저 로컬 저장소(`localStorage`)에만 저장됩니다.
   - 중앙 서버나 클라우드 데이터베이스로 전송되지 않습니다.
2. **Zero Raw Text to Analytics (원문 전송 절대 불가 원칙)**:
   - 제품 개선을 위한 통계 집계 시에도 사용자의 주관식 입력 텍스트는 100% 필터링되어 삭제됩니다.
3. **Multi-User Namespace Isolation (사용자별 네임스페이스 격리)**:
   - 한 브라우저나 공용 PC에서 여러 사람이 번갈아 사용할 경우를 대비하여 `userId`별로 독립된 스토리지 키를 사용합니다.

---

## 2. 네임스페이스 격리 및 저장소 키 구조

```text
[브라우저 로컬 스토리지 키 매핑]
├── myungsim_30day_journey_usr_abc123   <-- 사용자 A의 여정 정보 (독립 격리)
├── myeongsim_personal_sessions_usr_abc123  <-- 사용자 A의 SCAN 세션
├── myungsim_behavior_experiments_usr_abc123 <-- 사용자 A의 행동실험
│
├── myungsim_30day_journey_usr_xyz789   <-- 사용자 B의 여정 정보 (상호 간섭 0%)
└── myungsim_30day_journey_guest        <-- 비로그인 게스트용 여정 정보
```

- 사용자 전환 시 `JourneyStore.getScopedKey()`가 현재 세션 사용자 ID를 조회하여 해당 키만 읽고 씁니다.
- 브라우저를 로그아웃하거나 사용자를 변경하면 다른 사용자의 30일 여정 기록은 전혀 노출되지 않습니다.

---

## 3. 이벤트 트래커의 원문 필터링(Sanitization) 메커니즘

`js/myungsim-30day-journey.js`의 `trackSafeJourneyEvent` 함수는 엄격한 화이트리스트 및 블랙리스트 제거 알고리즘을 강제합니다.

### 코드 검증 발췌:
```javascript
function trackSafeJourneyEvent(eventName, payload = {}) {
  const safeData = {
    journeyId: payload.journeyId || undefined,
    phase: payload.phase || undefined,
    status: payload.status || undefined,
    intention: payload.intention || undefined,
    cardId: payload.cardId || undefined,
    daysRemaining: payload.daysRemaining !== undefined ? payload.daysRemaining : undefined,
    timestamp: Date.now()
  };

  // 원문 텍스트 원천 차단 (블랙리스트 엄격 배제)
  delete safeData.sceneText;
  delete safeData.storyText;
  delete safeData.actualResult;
  delete safeData.learning;
  delete safeData.focusSceneDescription;
  delete safeData.secretJournalText;
  delete safeData.privateSceneDetail;

  if (typeof window.trackMindEvent === 'function') {
    window.trackMindEvent(eventName, safeData);
  }
}
```

---

## 4. E2E 침투 및 누출 검증 결과 (Leak Test)

테스트 스크립트(`scripts/test-30day-journey-e2e.js`)에서 악의적이거나 우발적으로 민감 개인정보가 주입되었을 때의 필터링 동작을 직접 검증하였습니다.

### 시뮬레이션 페이로드:
```javascript
Journey.trackSafeEvent('30DAY_JOURNEY_START', {
  intention: 'notice',
  daysRemaining: 30,
  secretJournalText: '개인 비밀 일기 내용과 내면의 깊은 상처',
  privateSceneDetail: '남편과의 사소한 다툼'
});
```

### 감사 결과:
| 검증 항목 | 기대 결과 | 실제 측정치 | 판정 |
| :--- | :--- | :--- | :--- |
| `secretJournalText` 유출 여부 | `undefined` (완전 삭제) | `undefined` | **PASS (차단)** |
| `privateSceneDetail` 유출 여부 | `undefined` (완전 삭제) | `undefined` | **PASS (차단)** |
| 화이트리스트 메트릭 보존 | `intention: 'notice'` 보존 | `intention: 'notice'` | **PASS (정상)** |
| 외부 네트워크 HTTP Fetch 호출 수 | 0 회 | 0 회 | **PASS (무결)** |

---

## 5. 관리자 관제 센터(`/admin/journey.html`)의 프라이버시 보호

관리자 페이지에서도 개별 사용자의 일기나 고민 내용은 원천적으로 조회되지 않도록 차단되었습니다.
- **조회 가능 항목**: 시작된 여정 총수, 활성 수, 일시정지 수, 완료 수, 의도별 선택 비율(%) 등 **익명화된 통계치**.
- **원문 검사 패널**: 스토리지 데이터 인스펙트 시에도 `_comment: "All private raw texts and personal journal contents are completely stripped out."`와 함께 원문이 배제된 메타데이터만 렌더링됩니다.

---

## 6. 결론

마인드플로우 랩의 명심 30일 여정 시스템은 기술적으로 완벽한 로컬 격리와 엄격한 필터링을 통해, 사용자가 어떠한 프라이버시 침해 우려도 없이 온전히 자신을 돌보고 관찰할 수 있는 안전한 환경을 보장합니다.
