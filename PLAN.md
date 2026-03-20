# 스트리머 서버 트래커 — 통합 기획 문서

> 이 문서는 Claude에게 맥락을 전달하기 위한 기획서입니다.
> 새 대화에서 이 문서를 붙여넣으면 바로 이어서 개발할 수 있습니다.

---

## 1. 한 줄 요약

**숲(SOOP) + 치지직 두 플랫폼의 스트리머 데이터를 실시간으로 통합해서,
지금 어떤 게임 서버가 핫한지, 어떤 스트리머가 방송 중인지 한눈에 보여주는 웹사이트.**

---

## 2. 배경 및 기획 의도

- 와우 서버, 마인크래프트(퍼켓몬/봉켓몬) 서버, GTA 인생모드 서버 등 대형 멀티 서버가 열릴 때마다 수백 명의 스트리머가 동시에 방송함
- 시청자들이 "내 최애 스트리머 지금 어디 있지?", "어떤 서버가 제일 핫하지?" 를 확인할 수 있는 전용 사이트가 없음
- 바이브 코딩으로 빠르게 만들어서 트렌드를 선점하는 것이 목표
- 트래픽 = 구글 애드센스 수익 구조

---

## 3. 핵심 기능

### 3-1. 메인 화면
- 현재 핫한 서버 목록 (시청자 총합 기준 자동 정렬)
- 서버별 참여 스트리머 카드 (썸네일, 시청자 수, 플랫폼 뱃지)
- 숲/치지직 플랫폼 구분 뱃지
- 시청자 수 1~3위 금/은/동 메달 표시
- 60초마다 자동 갱신

### 3-2. 서버 예고 타임라인
- 오픈 예정 서버 일정 표시 (봉켓몬 서버 등)
- 수동 입력 or 관리자 페이지에서 등록

### 3-3. 최애 스트리머 알림 (추후 추가)
- 특정 스트리머 즐겨찾기
- 방송 시작 시 브라우저 푸시 알림

### 3-4. 서버별 역대 기록 (추후 추가)
- 역대 최고 동시 시청자
- 서버별 누적 참여 스트리머 수

---

## 4. 기술 스택

| 역할 | 기술 | 비용 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | 무료 |
| 언어 | TypeScript | 무료 |
| 숲 데이터 | 공개 엔드포인트 스크래핑 | 무료 |
| 치지직 데이터 | 공식 Open API | 무료 |
| 배포 | Vercel | 무료 |
| DB | Supabase (추후 알림 기능에 사용) | 무료 |
| 도메인 | Namecheap or Cloudflare .xyz/.site | 연 3천~5천원 |
| 수익화 | 구글 애드센스 | 무료 |
| 개발 환경 | GitHub Codespaces (사지방 브라우저) | 무료 |

---

## 5. 파일 구조

```
streamtracker/
├── src/
│   ├── app/
│   │   ├── page.tsx          # 메인 화면
│   │   ├── layout.tsx        # 레이아웃 + SEO 메타데이터
│   │   └── api/
│   │       └── lives/
│   │           └── route.ts  # 라이브 데이터 API 엔드포인트
│   └── lib/
│       ├── chzzk.ts          # 치지직 API 연동
│       ├── soop.ts           # 숲 데이터 수집
│       └── streams.ts        # 통합 데이터 처리 + 서버 키워드
├── .env.example              # 환경변수 템플릿
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 자동 배포
├── next.config.js
├── package.json
├── README.md
└── PLAN.md                   # 이 문서
```

---

## 6. 데이터 수집 방식

### 치지직
- 공식 Open API 사용
- 발급처: https://chzzk.gitbook.io/chzzk
- Client ID + Client Secret → Bearer 토큰 → 라이브 목록 조회
- 환경변수: `CHZZK_CLIENT_ID`, `CHZZK_CLIENT_SECRET`

### 숲(SOOP)
- 공식 API 없음 → 공개 엔드포인트 사용
- `https://live.afreecatv.com/afreeca/player_live_api.php`
- Referer 헤더 필요: `https://www.afreecatv.com`

### 갱신 주기
- Next.js `revalidate = 60` (60초마다 ISR 갱신)
- 클라이언트에서 추가 폴링 없음 → 서버 부하 최소화

---

## 7. 서버 키워드 목록 (현재 기준)

```typescript
const HOT_SERVERS = [
  { id: 'wow',       name: '와우 서버',        keywords: ['와우', 'WoW', '클래식', '하드코어'] },
  { id: 'minecraft', name: '마인크래프트 서버', keywords: ['마인크래프트', '마크', '퍼켓몬', '봉켓몬'] },
  { id: 'gta',       name: 'GTA 서버',          keywords: ['GTA', '인생모드', 'RP', '리얼라이프'] },
  { id: 'lethal',    name: '리썰컴퍼니',        keywords: ['리썰', 'Lethal Company'] },
]
```

> 새 서버가 유행할 때마다 이 목록에 추가하면 자동 반영됨

---

## 8. 환경변수

```env
CHZZK_CLIENT_ID=치지직_클라이언트_ID
CHZZK_CLIENT_SECRET=치지직_클라이언트_시크릿
NEXT_PUBLIC_SUPABASE_URL=수파베이스_URL (추후 알림 기능 때 필요)
NEXT_PUBLIC_SUPABASE_ANON_KEY=수파베이스_KEY (추후 알림 기능 때 필요)
REFRESH_INTERVAL=60
```

---

## 9. 배포 방법

```
1. GitHub 저장소 생성
2. 이 코드 push
3. vercel.com → Import Git Repository
4. 환경변수 입력 (CHZZK_CLIENT_ID, CHZZK_CLIENT_SECRET)
5. Deploy → 자동 배포 완료
6. 도메인 연결 (Cloudflare 권장)
```

---

## 10. 수익화 계획

| 단계 | 시점 | 방법 |
|---|---|---|
| 1단계 | 배포 직후 | 구글 애드센스 신청 |
| 2단계 | MAU 1천+ | 스트리머 후원 배너 광고 |
| 3단계 | MAU 1만+ | 프리미엄 알림 구독 월정액 |

---

## 11. 홍보 채널 (배포 후)

- 에펨코리아 스트리머 게시판
- 디시인사이드 스트리머 갤러리
- 트위터/X 스트리머 커뮤니티
- 각 서버 오픈 시점에 맞춰 게시 (타이밍이 핵심)

---

## 12. 개발 우선순위

```
✅ 완료
- 프로젝트 구조 세팅
- 치지직 API 연동 코드
- 숲 데이터 수집 코드
- 통합 데이터 처리 로직
- 메인 화면 UI
- API 라우트
- GitHub Actions 배포 설정

🔲 다음 할 일 (우선순위 순)
1. GitHub 저장소 생성 + Codespaces 열기
2. 치지직 API 키 발급
3. Vercel 연결 + 환경변수 입력
4. 실제 데이터 수신 테스트
5. 서버 예고 타임라인 UI 추가
6. 구글 애드센스 연동
7. 최애 스트리머 알림 기능
8. 모바일 최적화
```

---

## 13. 개발자 상황

- 군복무 중, 사지방(PC 브라우저)에서만 개발 가능
- GitHub Codespaces로 브라우저에서 전체 개발
- 초급 개발 실력 (HTML/JS 기초)
- Cursor or Claude로 코드 생성, 직접 수정은 최소화
- 자본 거의 0원, 무료 툴 최대 활용
- 1개월 안에 MVP 배포 목표

---

## 14. Claude에게 전달할 컨텍스트

이 프로젝트에서 코드 작업을 요청할 때 아래 사항을 지켜주세요.

- Next.js 14 App Router 기준으로 작성
- TypeScript 사용
- 스타일은 인라인 style 또는 Tailwind (별도 CSS 파일 최소화)
- 외부 라이브러리 추가 시 package.json도 함께 업데이트
- 환경변수는 반드시 `.env.example`에도 추가
- 숲/치지직 두 플랫폼 모두 항상 고려
- 무료 티어 한도 내에서 설계 (Vercel, Supabase 무료 플랜)
- 코드 설명은 한국어로

---

## 15. ⚠️ 법적 검토 사항 (광고 수익화 전 필수)

### 치지직
- 공식 API 사용 중 → 광고 수익 관련 금지 조항 문서상 없음 ✅
- 애플리케이션 이름에 'chzzk', '치지직', 'naver', '네이버' 포함 불가 (현재 Mwokya로 문제없음) ✅

### 숲
- **현재 비공식 엔드포인트 사용 중** ⚠️
- 공식 API는 파트너십 신청 후 검토 필요 (`developers.sooplive.co.kr`)
- **광고 수익 발생 전 반드시 숲 공식 파트너십 신청 필요**
- 신청 소요 시간: 영업일 10일

### 액션 아이템
- [ ] 광고 붙이기 전 `developers.sooplive.co.kr` 파트너십 신청
- [ ] 승인 후 공식 API 키로 `soop.ts` 엔드포인트 교체
