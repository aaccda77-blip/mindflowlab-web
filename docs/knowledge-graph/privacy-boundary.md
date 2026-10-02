# MYUNGSIM Privacy Boundary in Knowledge Graph (개인정보 보호 및 프로파일링 배제 원칙)

## 1. 개요 및 절대 불변의 규칙
지식 그래프는 **콘텐츠의 의미 체계를 정돈하는 도구**이며, 결코 **개인 사용자를 분석하고 낙인찍는 도구가 아닙니다.**

---

## 2. 3대 프라이버시 통제 원칙

### 1) 개인 심리 프로파일링 영구 비활성화 (No Psychological Profiling)
- **금지 행위**:
  - 사용자 A가 과거에 본 카드와 작성한 SCAN을 분석하여 "사용자 A는 불안형 애착군", "자존감 결핍군"으로 분류하는 행위 ❌
- **상태 선언**: `KNOWLEDGE GRAPH → USER IDENTITY PROFILING: DISABLED`

### 2) Personal Working Map과의 완전한 데이터 격리
- 사용자가 자신의 삶을 돌아보기 위해 기록하는 `Personal Working Map`은 브라우저 로컬 저장소에 암호화되어 머뭅니다.
- 공용 Knowledge Graph는 사용자의 개인 기록을 데이터 소스로 삼지 않으며(`sourceType: USER_PRIVATE_STORY 금지`), 어떠한 사적 원문도 역유입받지 않습니다.

### 3) 단방향 개념 참조 (One-way Concept Reference)
- **허용**: 사용자의 개인 화면에서 자신이 겪은 감정이나 충동을 정리할 때 지식 그래프의 표준 개념 정의(예: `FACT vs STORY`)를 가져와 보여주는 것 (OK).
- **금지**: 사용자가 쓴 개인적인 사연을 공용 지식 그래프의 새 노드로 등록하는 것 (STRICTLY FORBIDDEN).
