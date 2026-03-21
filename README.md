# 🎮 뭐켜 (Mwokya)

숲(SOOP) + 치지직 실시간 통합 스트리머 트래커

**지금 어떤 게임/서버/이벤트가 핫한지, 어떤 스트리머가 방송 중인지 한눈에.**

🔗 https://mwokya.vercel.app

---

## 주요 기능

- 숲·치지직 라이브 실시간 통합 (최대 1000명)
- **게임 카테고리** / **대규모 합방·서버·이벤트** 탭 분리
- 이벤트 자동 감지 (fuse.js + hangul-js + Gemini AI)
- 플랫폼별 방송 인원 표시 (치지직/숲 뱃지)
- 시청자 수 금/은/동 메달
- 60초마다 자동 갱신

---

## 기술 스택

- **Next.js 14** (App Router) + TypeScript
- **치지직** 공식 Open API
- **숲** 공개 엔드포인트
- **Supabase** (이벤트 DB)
- **Gemini 2.0 Flash** (이벤트 자동 분석)
- **fuse.js + hangul-js** (한국어 퍼지 매칭)
- **Vercel** 배포 + Cron

---

## 로컬 개발

```bash
git clone https://github.com/Bell1008/Mwokya
cd Mwokya
npm install
cp .env.example .env.local
# .env.local 에 키 입력 후
npm run dev
```

---

## 환경변수

```env
CHZZK_CLIENT_ID=
CHZZK_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
CRON_SECRET=
```

---

## 배포

Vercel에 GitHub 저장소 연결 후 환경변수 입력하면 자동 배포.

---

## 라이선스

개인 프로젝트. 치지직/숲 API 이용약관 준수.
