# 명심코칭 개인 홈 v2 NO-AI E2E 및 합성 사용자 검증 보고서
(MYUNGSIM PERSONAL HOME v2 NO-AI E2E & SYNTHETIC USER REPORT)

> **프로덕션 상태:**  
> PERSONAL HOME v2: **READY**  
> PRIVATE RAW TEXT IN PRODUCT ANALYTICS: **0**  
> EXTERNAL AI CALLS: **0**

---

## 1. 5대 합성 사용자(Synthetic User) 테스트 결과

스크립트: `node scripts/test-personal-home-e2e.js` (29/29 전수 통과)

### [SYNTHETIC USER A] 신규 / SCAN 1회 사용자
- **상태**: 세션 1회, 활성 실험 없음, 지도 미형성
- **결과**:
  - State: `START_NEW_SCAN`
  - Primary CTA: **가까운 질문 찾기**
  - Working Map 섹션: “반복을 말하기에는 아직 기록이 충분하지 않습니다. [오늘 장면 하나 기록하기]” (empty chart / 0% 없음)
  - 검증: ✅ PASS

### [SYNTHETIC USER B] 활성 실험 보유 사용자
- **상태**: SCAN 7회, 활성 실험 1건 대기 중
- **결과**:
  - State: `FOLLOW_UP_EXPERIMENT`
  - Primary CTA: **지난 선택 돌아보기 &rarr;** (정확한 실험 ID 링크)
  - 미완료 경고 없음 (No-Shame: “아직 결과를 확인하지 않은 선택”)
  - 검증: ✅ PASS

### [SYNTHETIC USER C] 실험 완료 및 지도 갱신 사용자
- **상태**: 최근 실험 완료 및 작동지도 갱신됨
- **결과**:
  - State: `VIEW_WORKING_MAP`
  - Primary CTA: **나의 최근 작동지도 확인 &rarr;**
  - 안내 문구: “최근 기록에서는 기존 행동 외에 다른 선택도 나타나기 시작했습니다.” (과장 없는 표현)
  - 검증: ✅ PASS

### [SYNTHETIC USER D] 90일 미접속 장기 부재 사용자 (No-Guilt Return)
- **상태**: 92일간 방문 없음
- **결과**:
  - State: `LONG_ABSENCE`
  - 안내: “오늘 새 장면부터 다시 시작해도 괜찮습니다.”
  - 죄책감 유발(Streak Broken, 90일 미출석 경고) 0건 확인
  - 검증: ✅ PASS

### [SYNTHETIC USER E] 새로운 고위험 입력 사용자 (Safety Priority)
- **상태**: 자해/자살 고위험 키워드 입력
- **결과**:
  - 과거 작동지도나 추천을 일체 무시하고 **Safety Router 최우선 차단 및 긴급 안전망(109, 1577-0199) 전환**
  - 원칙 준수: `CURRENT SAFETY > PAST PATTERN`
  - 검증: ✅ PASS
