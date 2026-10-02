# ✍️ 콘텐츠 및 카드 대량 삭제 롤백 런북 (Content Rollback Runbook)

## 1. 개요 및 발동 상황
- 관리자의 실수로 수십~수백 개의 명심카드가 잘못 수정되거나 일괄 삭제/아카이브된 경우.
- 오타나 비진단성 규약에 어긋나는 카드 팩이 배포된 경우.

---

## 2. 복구 절차

1. **사용자 DB와 분리된 복구**:
   - 전체 데이터베이스를 복원할 필요 없이, **Canonical Content Snapshot**만 독립적으로 롤백합니다. (사용자 개인 기록에 일체 영향 없음).
2. **이전 버전 스냅샷 로드**:
   - `js/myungsim-backup-recovery.js`의 `getCanonicalSnapshot()` 또는 이전 릴리즈 태그(`data/mind-cards.json`)를 참조.
3. **체크섬 및 레코드 수 검증**:
   - 200개 이상의 유효 카드가 정상 포함되어 있는지 확인.
4. **검색 인덱스 동기화 (Auto Re-index)**:
   - 콘텐츠 롤백 직후 `myeongsim-rule-router.js`의 인덱스를 즉시 재생성하여 캐시 불일치 해소.
5. **CMS 및 서비스 검증**:
   - `/admin/operations.html`에서 Content Health가 `HEALTHY`로 복귀하는지 확인.
