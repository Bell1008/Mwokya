# 🎮 스트리머 서버 트래커

숲(SOOP) + 치지직 실시간 통합 스트리머 트래커

## 기능
- 숲·치지직 라이브 통합 조회
- 서버별 스트리머 랭킹 (와우, 마인크래프트, GTA 등)
- 60초마다 자동 갱신
- 시청자 수 실시간 표시

## 세팅 방법

### 1. 저장소 클론
```bash
git clone https://github.com/[유저명]/streamtracker
cd streamtracker
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
```
`.env.local` 파일 열어서 치지직 API 키 입력

### 3. 치지직 API 키 발급
1. https://chzzk.gitbook.io/chzzk 접속
2. 개발자 센터에서 앱 등록
3. Client ID, Client Secret 발급

### 4. Vercel 배포
1. GitHub 저장소 Vercel에 연결
2. 환경변수 입력
3. 자동 배포 완료

## 추가 예정 기능
- [ ] 서버 예고 타임라인
- [ ] 최애 스트리머 알림
- [ ] 서버별 역대 최고 시청자 기록
- [ ] 구글 애드센스 연동

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Vercel (무료 배포)
- 치지직 공식 API
- 숲 공개 엔드포인트
