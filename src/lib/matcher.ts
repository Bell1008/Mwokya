import Fuse from 'fuse.js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Hangul = require('hangul-js')

// ─── 블랙리스트 ───
// 합방 키워드로 쓰면 안 되는 단어들
const BLACKLIST = new Set([
  // 게임명
  '리그', '오브', '레전드', '마인크래프트', '배틀그라운드', '발로란트',
  '오버워치', '스타크래프트', '워크래프트', '디아블로', '메이플', '스토리',
  '프로젝트', '좀보이드', '림월드', '타르코프', '포트나이트', '에이펙스',
  '붉은사막', '사막', '크림슨', '몬스터헌터', '몬헌', '와일즈', '엘든링',
  '파이널판타지', '로스트아크', '로아', '던전', '파이터', '사이버펑크',
  '발더스게이트', '하데스', '스팀', '에픽', '넥슨', '엔씨', '카카오',
  // 롤 관련
  '챔피언', '솔로랭크', '랭크', '칼바람', '우르프', '시즌',
  // 일반 방송 단어
  '방송', '시작', '오늘', '게임', '같이', '즐거운', '재미있는',
  '라이브', '스트리밍', '첫', '날', '주', '달', '년', '방',
  '중', '일차', '일', '화', '편', '회', '차', '번',
  '입니다', '합니다', '시청', '구독', '알림', '좋아요',
  '안녕', '하세요', '감사', '시청자', '여러분',
  // 조사/접속사
  '그리고', '하지만', '그래서', '이제', '드디어', '다시', '새로운',
  '복귀', '귀환', '새벽', '오전', '오후', '저녁', '밤', '낮',
  // 숫자/순서
  '시작', '종료', '완료', '끝', '마지막', '처음',
])

// 합방 이벤트일 가능성 있는 키워드 패턴
// 고유명사처럼 생긴 것들 (2~6글자 한글, 블랙리스트 아닌 것)
function isValidEventKeyword(word: string): boolean {
  // 2글자 미만 제외
  if (word.length < 2) return false
  // 6글자 초과 제외 (너무 긴 건 문장)
  if (word.length > 6) return false
  // 블랙리스트 포함 단어 제외
  if (BLACKLIST.has(word)) return false
  // 블랙리스트 단어를 포함하는 경우 제외
  for (const bl of BLACKLIST) {
    if (bl.length >= 2 && word.includes(bl) && word !== bl) return false
  }
  // 한글만 포함 (숫자, 영어 섞인 건 제외)
  if (!/^[가-힣]+$/.test(word)) return false
  return true
}

export interface LiveItem {
  id: string | number
  platform: string
  title: string
  category: string
  streamer: string
  viewers: number
  thumbnail: string | null
  profileImage: string
  url: string
  startedAt: string
}

// ─── 이상 감지 ───
// 같은 게임 카테고리 내에서 3명 이상 동시에 쓰는 신규 키워드 감지
export function detectAnomalies(
  lives: LiveItem[],
  existingKeywords: string[]
): { keyword: string; titles: string[]; count: number; game: string }[] {

  // 기존 등록된 키워드 set
  const knownKeywords = new Set(existingKeywords.map(k => k.toLowerCase()))

  // 게임 카테고리별로 그룹핑
  const byCategory = new Map<string, LiveItem[]>()
  for (const live of lives) {
    const cat = live.category || '기타'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(live)
  }

  const results: { keyword: string; titles: string[]; count: number; game: string }[] = []

  for (const [category, categoryLives] of byCategory) {
    // 카테고리 자체가 블랙리스트 게임이면 스킵
    // (롤, 배그 등 일반 게임 카테고리는 분석 안 함)
    const isGeneralGame = [
      '리그 오브 레전드', '배틀그라운드', '발로란트', '오버워치2',
      'FC온라인', '타르코프', '스타크래프트', '잡담', '음악/댄스', '기타'
    ].includes(category)

    if (isGeneralGame) continue

    // 제목에서 유효한 키워드 추출
    const wordMap = new Map<string, string[]>()

    for (const live of categoryLives) {
      const words = live.title.match(/[가-힣]{2,6}/g) || []
      const validWords = words.filter(isValidEventKeyword)

      for (const word of validWords) {
        // 이미 알려진 키워드면 스킵
        if (knownKeywords.has(word.toLowerCase())) continue
        if (!wordMap.has(word)) wordMap.set(word, [])
        wordMap.get(word)!.push(live.title)
      }
    }

    // 3명 이상 사용한 키워드만
    for (const [word, titles] of wordMap) {
      if (titles.length >= 3) {
        results.push({
          keyword: word,
          titles: [...new Set(titles)].slice(0, 10),
          count: titles.length,
          game: category,
        })
      }
    }
  }

  return results
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// ─── 이벤트 매칭 ───
// Supabase에 등록된 이벤트와 라이브 매칭
export function matchLivesToEvents(
  lives: LiveItem[],
  events: { id: string; name: string; game: string | null; keywords: string[] }[]
): Map<string, { name: string; game: string | null; lives: LiveItem[] }> {

  const result = new Map<string, { name: string; game: string | null; lives: LiveItem[] }>()

  for (const live of lives) {
    const searchText = `${live.title} ${live.category}`.toLowerCase()

    for (const event of events) {
      let matched = false

      for (const keyword of event.keywords) {
        const kw = keyword.toLowerCase()

        // 1. 직접 포함 체크
        if (searchText.includes(kw)) {
          matched = true
          break
        }

        // 2. fuse.js 퍼지 매칭 (오타 허용)
        const fuse = new Fuse([searchText], { threshold: 0.2 })
        if (fuse.search(kw).length > 0) {
          matched = true
          break
        }

        // 3. 초성 매칭 (ㅂㅋㅁ → 봉켓몬)
        if (kw.length >= 2) {
          const titleChosung = Hangul.d(live.title, true).join('')
          const kwChosung = Hangul.d(kw, true).join('')
          if (kwChosung.length >= 2 && titleChosung.includes(kwChosung)) {
            matched = true
            break
          }
        }
      }

      if (matched) {
        if (!result.has(event.id)) {
          result.set(event.id, { name: event.name, game: event.game, lives: [] })
        }
        result.get(event.id)!.lives.push(live)
        break
      }
    }
  }

  return result
}
