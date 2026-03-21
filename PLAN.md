# 뭐켜 (Mwokya) — 통합 기획 문서

> Claude에게 맥락 전달용 기획서입니다.
> 새 대화에서 이 문서를 첨부하면 바로 이어서 개발할 수 있습니다.

---

## 1. 한 줄 요약

**숲(SOOP) + 치지직 두 플랫폼의 스트리머 데이터를 실시간 통합해서,
지금 어떤 게임/서버/이벤트가 핫한지, 어떤 스트리머가 방송 중인지 한눈에 보여주는 웹사이트.**

---

## 2. 서비스 URL

- 프로덕션: https://mwokya.vercel.app
- 저장소: https://github.com/Bell1008/Mwokya
- 개발환경: GitHub Codespaces (사지방 브라우저)

---

## 3. 기술 스택

| 역할 | 기술 | 비용 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) | 무료 |
| 언어 | TypeScript | 무료 |
| 치지직 데이터 | 공식 Open API | 무료 |
| 숲 데이터 | 공개 엔드포인트 | 무료 |
| 배포 | Vercel | 무료 |
| DB | Supabase | 무료 (500MB) |
| 이벤트 감지 | fuse.js + hangul-js | 무료 |
| AI 분석 | Gemini 2.0 Flash API | 무료 (250req/day) |
| 자동화 | Vercel Cron (6시간마다) | 무료 |
| 도메인 | 미정 (.xyz/.site 권장) | 연 3~5천원 |
| 수익화 | 구글 애드센스 | 무료 |
| 개발환경 | GitHub Codespaces | 무료 |

---

## 4. 파일 구조

```
Mwokya/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 화면 (게임/합방 탭)
│   │   ├── layout.tsx            # SEO 메타데이터
│   │   └── api/
│   │       ├── lives/route.ts    # 라이브 데이터 API
│   │       └── cron/route.ts     # Gemini 자동 분석 Cron
│   └── lib/
│       ├── chzzk.ts              # 치지직 Open API 연동
│       ├── soop.ts               # 숲 데이터 수집
│       ├── streams.ts            # 통합 데이터 처리 + 카테고리 분류
│       ├── events.ts             # Supabase 이벤트 관리
│       └── matcher.ts            # fuse.js + hangul-js 키워드 매칭
├── vercel.json                   # Cron 스케줄 설정
├── .env.local                    # 환경변수 (git 제외)
├── .env.example                  # 환경변수 템플릿
├── next.config.js
├── package.json
├── README.md
└── PLAN.md
```

---

## 5. 환경변수 전체 목록

```env
# 치지직
CHZZK_CLIENT_ID=
CHZZK_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini AI
GEMINI_API_KEY=

# Vercel Cron 인증
CRON_SECRET=

# 선택 (현재 미사용)
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_CX=
```

---

## 6. Supabase DB 구조

```sql
-- 이벤트/서버 등록 테이블
events (
  id uuid, name text, game text,
  keywords text[],        -- fuse.js + hangul-js로 매칭
  is_active boolean,
  auto_detected boolean,  -- Gemini가 자동 등록한 경우 true
  created_at, last_matched_at
)

-- Gemini 분석 대기 후보
event_candidates (
  id uuid, keyword text, count integer,
  sample_titles text[], game text,
  processed boolean, created_at
)

-- 키워드 매칭 통계
keyword_stats (
  id uuid, event_id uuid, keyword text,
  match_count integer, last_matched_at
)

-- 자동 정리 함수 (Vercel Cron에서 호출)
cleanup_old_data()
  → 처리완료 후보 7일 후 삭제
  → 미처리 후보 14일 후 삭제
  → keyword_stats 90일치만 유지
  → auto_detected 이벤트 30일 미매칭 시 비활성화
```

---

## 7. 이벤트 자동 감지 흐름

```
[60초마다]
숲/치지직 라이브 수집
  → matcher.ts: 블랙리스트 제외 후 같은 게임에서 3명 이상 공통 키워드 감지
  → Supabase event_candidates에 후보 등록

[6시간마다 Vercel Cron]
  → Gemini 2.0 Flash: "이게 합방 이벤트냐?" 분석
  → Yes → events 테이블 자동 등록
  → No → 후보 processed=true로 버림
  → 7일 미매칭 이벤트 자동 비활성화
  → cleanup_old_data() 실행
```

---

## 8. 현재 등록된 이벤트 (Supabase)

| 이벤트 | 게임 | 상태 | 비고 |
|---|---|---|---|
| 붉은사막 출시 | 붉은사막 | ✅ 진행중 | 수동 등록 |
| RPG 충동 서버 | 마인크래프트 | 🔜 4월 1~7일 | 감스트 주최 |
| 봉켓몬 서버 | 마인크래프트 | 🔜 미정 | 남봉 예정 |
| 봉누도2 | GTA | 🔜 미정 | 연기됨 |
| 픽셀몬 서버 | 마인크래프트 | 🔜 4월 8일 | 추가모집 중 |

---

## 9. 법적 검토 및 상업화 가능 범위

### 치지직 ✅ 광고 수익 가능
- 공식 Open API 사용 → 광고 수익 금지 조항 없음
- 앱 이름에 chzzk/치지직/naver/네이버 포함 불가 → Mwokya 문제없음
- 서드파티 후원 연동 → 파트너 스트리머 대상 불가
- 채팅 API → 공식 API 범위 내에서만 사용 가능

### 숲 ⚠️ 파트너십 신청 후 광고 가능
- 현재 비공식 엔드포인트 사용 중
- 광고 수익 붙이기 전 반드시 파트너십 신청 필요
- 신청: developers.sooplive.co.kr (영업일 10일 소요)
- 승인 후 공식 API 키로 soop.ts 교체

### 안전한 BM 우선순위
| 순위 | BM | 안전도 |
|---|---|---|
| 1 | 구글 애드센스 | ✅ |
| 2 | 게임사/브랜드 직접 광고 | ✅ |
| 3 | 프리미엄 기능 구독 | ✅ |
| 4 | 이벤트 주최사 스폰서 배너 | ✅ |
| 5 | 채팅 통합 서비스 | ⚠️ 공식 API 범위 내 |
| 6 | 서드파티 후원 연동 | ❌ 치지직 파트너 불가 |

---

## 10. 개발 현황

### ✅ 완료
- 치지직 Open API 연동 (최대 500명 수집)
- 숲 데이터 수집 (한국어 필터, 최대 500명)
- 카테고리 정규화 (두 플랫폼 통일)
- 게임 / 합방·이벤트 탭 분리 UI
- 아코디언 카드 UI (상위 3개 기본 펼침)
- 플랫폼 뱃지 (치지직/숲)
- 금은동 메달 (카테고리 내 시청자 순위)
- 60초 자동 갱신
- Supabase events/candidates/stats 테이블
- fuse.js + hangul-js 퍼지 매칭 + 초성 검색
- 블랙리스트 기반 일반명사 필터링
- Gemini 자동 이벤트 분석 + 등록 Cron
- 7일 미매칭 이벤트 자동 비활성화
- Supabase cleanup_old_data() 자동 정리

### 🔴 광고 붙이기 전 필수
- [ ] 숲 파트너십 신청 (developers.sooplive.co.kr)
- [ ] Next.js 보안 취약점 업그레이드 (14.2.3 → latest)
- [ ] 숲 외국인 방송 완전 차단 검증
- [ ] 모바일 반응형 UI

### 🟡 핵심 기능 (차별화)
- [ ] 이벤트 예고 타임라인 (오픈 예정 서버 일정 표시)
- [ ] 스트리머 검색 기능
- [ ] 이벤트별 참여 스트리머 통계 페이지
- [ ] 서버별 역대 최고 시청자 기록

### 🟢 UI/UX 개선
- [ ] 모바일 반응형
- [ ] 다크/라이트 모드
- [ ] 플랫폼 필터 체크박스 (숲/치지직)
- [ ] 정렬 옵션 (시청자순/시작시간순)
- [ ] 방송 시작 시간 표시
- [ ] 스트리머 카드 호버 시 미리보기

### 🔵 수익화
- [ ] 구글 애드센스 연동
- [ ] 숲 파트너십 신청
- [ ] 이벤트 오픈 시 배너 광고 슬롯

### 🟣 나중에 추가할 기능
- [ ] 최애 스트리머 즐겨찾기 + 푸시 알림 (Supabase 활용)
- [ ] 채팅 통합 뷰 (Railway 상시 서버 필요, 전역 후)
- [ ] 실시간 WebSocket 갱신 (Vercel 무료 불가, 전역 후)
- [ ] 스트리머 계정 연동 (동시송출 중복 제거)
- [ ] 이벤트 주최자 관리 페이지

---

## 11. 홍보 전략 (배포 후)

- 에펨코리아 스트리머 게시판
- 디시인사이드 스트리머 갤러리
- 트위터/X 스트리머 커뮤니티
- **타이밍이 핵심** → 봉켓몬/RPG충동서버 등 대형 이벤트 오픈 직전 게시

---

## 12. 개발자 상황

- 군복무 중, 사지방(PC 브라우저)에서만 개발 가능
- GitHub Codespaces로 브라우저에서 전체 개발
- 초급 개발 실력 (HTML/JS 기초)
- Claude로 코드 생성, 직접 수정 최소화
- 자본 거의 0원, 무료 툴 최대 활용

---

## 13. Claude 작업 지침

- Next.js 14 App Router 기준
- TypeScript 사용
- 스타일은 인라인 style (별도 CSS 파일 최소화)
- 외부 라이브러리 추가 시 package.json도 함께 업데이트
- 환경변수는 .env.example에도 추가
- 숲/치지직 두 플랫폼 모두 항상 고려
- 무료 티어 한도 내에서 설계
- 치지직/숲 상업적 이용 정책 위반하지 않도록
- 코드 설명은 한국어로
