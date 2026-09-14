# 마인드플로우랩 (MindflowLab) 공식 웹사이트

심리학과 데이터 인지과학 기술을 융합하여 마음의 성장과 회복을 돕는 멘탈테크 랩, **마인드플로우랩**의 단일 파일(Single File) 랜딩페이지입니다.

---

## 🚀 배포 방법

### 1. Vercel 배포 (권장 - 무료 SSL, 초고속 CDN, 자동 배포)
1. GitHub에 새 저장소(예: `mindflowlab-web`)를 생성합니다.
2. 이 폴더에서 아래 명령어로 코드를 푸시합니다:
   ```bash
   git add .
   git commit -m "feat: 마인드플로우랩 랜딩페이지 초기 버전"
   git branch -M main
   git remote add origin <사용자_깃허브_저장소_주소>
   git push -u origin main
   ```
3. [Vercel 대시보드](https://vercel.com/) 접속 > **[Add New...]** > **[Project]** 클릭
4. 방금 올린 저장소를 선택하고 **[Deploy]** 클릭!
5. 프로젝트 설정 > **[Settings]** > **[Domains]**에서 `mindflowlab.co.kr` 추가

---

### 2. 닷홈(Dothome) 웹호스팅 업로드 배포
1. 닷홈 파일관리자 또는 FileZilla 등 FTP 프로그램으로 접속합니다.
2. 웹 루트 디렉터리인 `html` 폴더 내에 `index.html` 파일을 업로드합니다.
3. 브라우저에서 `https://mindflowlab.co.kr` 로 바로 접속하여 확인합니다.

---

## ⚠️ 닷홈 DNS 설정 시 필수 주의사항 (메일 연동 유지)

Vercel로 연결할 때 메일(`admin@mindflowlab.co.kr`)이 끊기지 않으려면 **네임서버(NS)는 절대 변경하지 마시고**, 웹 레코드만 수정합니다:

- **A 레코드**: `mindflowlab.co.kr` ➡️ `76.76.21.21` (Vercel IP)
- **CNAME 레코드**: `www.mindflowlab.co.kr` ➡️ `cname.vercel-dns.com`
- ⚠️ **주의**: 기존 **ImprovMX 메일 레코드**(MX 레코드 2개, TXT 레코드 1개)는 **절대 삭제/수정 금지**!
