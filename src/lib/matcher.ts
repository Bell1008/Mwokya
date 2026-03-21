import Fuse from 'fuse.js'

// hangul-js: 초성 검색용 (타입 없으므로 require)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Hangul = require('hangul-js')

// ─── 퍼지 매칭 엔진 ───
// 제목 목록에서 특정 키워드와 유사한 항목 찾기
export function fuzzyMatch(titles: string[], keyword: string): string[] {
  if (!titles.length || !keyword) return []

  // 1. fuse.js 퍼지 매칭 (오타, 띄어쓰기 차이 허용)
  const fuse = new Fuse(titles, {
    threshold: 0.35,      // 0=완전일치, 1=모두매칭. 0.35가 적당
    minMatchCharLength: 2,
    includeScore: true,
  })

  const fuseResults = fuse.search(keyword).map((r) => r.item)

  // 2. hangul-js 초성 매칭 (ㅂㅋㅁ → 봉켓몬)
  const chosung = Hangul.d(keyword, true).join('')  // 키워드 초성 추출
  const chosungResults = titles.filter((title) => {
    const titleChosung = Hangul.d(title, true).join('')
    return titleChosung.includes(chosung)
  })

  // 3. 단순 포함 체크 (가장 기본)
  const includeResults = titles.filter((title) =>
    title.toLowerCase().includes(keyword.toLowerCase())
  )

  // 합치고 중복 제거
  return [...new Set([...includeResults, ...fuseResults, ...chosungResults])]
}

// ─── 라이브 목록에서 이벤트 매칭 ───
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

export interface EventMatch {
  eventId: string
  eventName: string
  game: string | null
  keyword: string
  lives: LiveItem[]
}

export function matchLivesToEvents(
  lives: LiveItem[],
  events: { id: string; name: string; game: string | null; keywords: string[] }[]
): Map<string, { name: string; game: string | null; lives: LiveItem[] }> {
  const result = new Map<string, { name: string; game: string | null; lives: LiveItem[] }>()

  for (const live of lives) {
    const searchText = `${live.title} ${live.category}`

    for (const event of events) {
      let matched = false

      for (const keyword of event.keywords) {
        const matches = fuzzyMatch([searchText], keyword)
        if (matches.length > 0) {
          matched = true
          break
        }
      }

      if (matched) {
        if (!result.has(event.id)) {
          result.set(event.id, { name: event.name, game: event.game, lives: [] })
        }
        result.get(event.id)!.lives.push(live)
        break  // 하나의 이벤트에만 매칭
      }
    }
  }

  return result
}

// ─── 이상 감지: 새 이벤트 후보 찾기 ───
// 5명 이상이 비슷한 키워드를 쓰면 후보로 등록
export function detectAnomalies(
  lives: LiveItem[],
  existingKeywords: string[]
): { keyword: string; titles: string[]; count: number }[] {
  const titleWords = new Map<string, string[]>()

  for (const live of lives) {
    // 제목에서 2글자 이상 한글 단어 추출
    const words = live.title.match(/[가-힣]{2,}/g) || []
    for (const word of words) {
      // 이미 알려진 키워드면 스킵
      if (existingKeywords.some((kw) => word.includes(kw) || kw.includes(word))) continue

      if (!titleWords.has(word)) titleWords.set(word, [])
      titleWords.get(word)!.push(live.title)
    }
  }

  // 5명 이상 사용한 키워드만 반환
  return Array.from(titleWords.entries())
    .filter(([, titles]) => titles.length >= 5)
    .map(([keyword, titles]) => ({ keyword, titles, count: titles.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)  // 상위 10개만
}
