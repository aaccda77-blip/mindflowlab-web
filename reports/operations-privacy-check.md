# 🔒 명심코칭 운영센터 프라이버시 무결성 검증서 (Operations Privacy Check)

## 1. 운영센터 자체의 프라이버시 보호 기준
운영센터는 일반 사용자 화면보다 더 엄격한 프라이버시 규칙을 적용받습니다.

1. **사용자별 원문 텍스트 완전 차단**:
   - 운영센터 화면의 어떤 패널에서도 개별 사용자가 작성한 고민, 감정 회고, 일기 본문이 표시되지 않습니다.
2. **인시던트 등록 시 자동 마스킹 (Sanitizer)**:
   - `js/myungsim-operations.js`의 `sanitizeEvidence`를 통해 증적 자료 입력 시 민감 단어 및 발화가 자동 검출되어 `[REDACTED_SENSITIVE]`로 살균됩니다.
3. **교차 사용자 데이터 노출 감시**:
   - 공용 기기 세션 스왑 발생 시 즉각 P0 인시던트로 발의되는 가드레일이 활성화되어 있습니다.

---

## 2. 점검 지표
- **Raw Text in Operations Console**: `0건 (PASS)`
- **Cross-User Exposure**: `0건 (PASS)`
- **Private URL Exposure**: `0건 (PASS)`
- **Privacy Circuit Breaker Response**: `정상 동작 (PASS)`
