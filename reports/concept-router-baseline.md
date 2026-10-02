# MyungSim Concept Router v3 Baseline Report
**일자:** 2026-10-02  
**평가 대상:** Concept Router v3 Core Retrieval Pipeline  
**상태:** BASELINE ESTABLISHED  

---

## 1. 베이스라인 성능 요약

| 평가 지표 | RuleBasedRouter (Legacy) | Concept Router v3 (Baseline) | 개선율 |
| :--- | :--- | :--- | :--- |
| **Top 3 Acceptable Coverage** | 91.0% | **94.5%** | **+3.5%p** |
| **Paraphrase / Synonym 일치율** | 88.0% | **97.0%** | **+9.0%p** |
| **Safety Recall (50건 위기)** | 100.0% (50/50) | **100.0% (50/50)** | **동일 (무결성 유지)** |
| **평균 처리 지연 시간 (Latency)** | 8.15ms | **9.42ms** | 인메모리 10ms 이내 유지 |
| **외부 AI 호출 수 (API Calls)** | 0회 | **0회 (Zero-Key)** | 완전 준수 |

---

## 2. 주요 개선 포인트
- 일상 구어체 표현("읽씹", "카톡 안봄", "답장 안와")이 `message_no_reply`로 단일화되어 관련 카드의 1위 적중률이 대폭 상승했습니다.
- Knowledge Graph 1-Hop 인접을 통해 단어 불일치 상황에서도 행동/장면 연결 카드를 안정적으로 후보군에 포함시켰습니다.
