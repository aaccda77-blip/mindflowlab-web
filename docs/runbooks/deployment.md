# 🚀 프로덕션 배포 및 롤백 런북 (Deployment & Rollback Runbook)

## 1. 개요
명심코칭은 서버리스 정적 웹 호스팅(Vercel) 기반으로 배포되며, 배포 전/직후/24시간 후의 단계별 검증을 통해 무결성을 보장합니다.

---

## 2. 배포 전 필수 체크리스트 (Before Deploy)
1. **Master E2E 테스트 100% 통과**:
   `node scripts/test-master-production-e2e.js` (26/26 PASS 확인)
2. **언어 규약 린터 검사**:
   `node scripts/lint-content-language.js` (위반 0건 확인)
3. **Zero-Key 확인**:
   `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` 등 외부 키 부재 환경에서 정상 구동 확인.
4. **Git 상태 정리**:
   모든 변경 사항이 명확한 커밋 메시지로 기록되어 있는지 확인.

---

## 3. 배포 실행 (Deploy Execution)
```bash
# Vercel 프로덕션 배포 실행
vercel --prod
```

---

## 4. 배포 직후 스모크 테스트 (Post-Deploy Smoke Test)
1. 메인 홈페이지 랜딩 및 "오늘의 카드" 셔플 클릭 확인.
2. 검색창에 임의 고민 1건 입력 후 Top 3 카드 추천 및 1분 SCAN 진입 확인.
3. `/admin/operations.html` 접속하여 8대 서브시스템 `HEALTHY` 여부 확인.

---

## 5. 24시간 배포 감시 (24-Hour Watch)
- 배포 후 1시간, 24시간 시점에 운영센터의 **RECENT RELEASE WATCH** 패널 확인.
- Error Rate 급증 또는 Flow Anomaly(특정 단계 이탈 급증) 감지 시 즉시 조사.

---

## 6. 긴급 롤백 가이드 (Emergency Rollback)
- **명령어 기반 롤백**:
  ```bash
  vercel rollback [이전-배포-URL-또는-ID]
  ```
- **대시보드 롤백**:
  Vercel Web Dashboard → Deployments → 안정 버전 선택 → "Promote to Production" 클릭 (1초 완료).
