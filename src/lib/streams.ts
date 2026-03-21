import { getChzzkLives } from './chzzk'
import { getSoopLives } from './soop'
import { getActiveEvents } from './events'
import { matchLivesToEvents, detectAnomalies } from './matcher'

// ─── 카테고리 정규화 맵 ───
const CATEGORY_NORMALIZE: Record<string, string> = {
  // 롤
  '리그 오브 레전드': '리그 오브 레전드',
  'League of Legends': '리그 오브 레전드',
  'League_of_Legends': '리그 오브 레전드',
  'LOL': '리그 오브 레전드', 'LoL': '리그 오브 레전드', '롤': '리그 오브 레전드',

  // 마인크래프트
  '마인크래프트': '마인크래프트', 'Minecraft': '마인크래프트',
  'minecraft': '마인크래프트', '마크': '마인크래프트',

  // 와우
  '월드 오브 워크래프트': '월드 오브 워크래프트',
  'World of Warcraft': '월드 오브 워크래프트',
  'WorldofWarcraft': '월드 오브 워크래프트',
  'WoW': '월드 오브 워크래프트', '와우': '월드 오브 워크래프트',

  // 배그
  '배틀그라운드': '배틀그라운드',
  'PUBG: BATTLEGROUNDS': '배틀그라운드',
  'PUBG:_BATTLEGROUNDS': '배틀그라운드',
  'PUBG_BATTLEGROUNDS': '배틀그라운드',
  'PUBG: 배틀그라운드': '배틀그라운드',
  'PUBG:_배틀그라운드': '배틀그라운드',
  'PUBG': '배틀그라운드', '배그': '배틀그라운드',

  // 발로란트
  '발로란트': '발로란트', 'VALORANT': '발로란트',
  'Valorant': '발로란트', '발로': '발로란트',

  // 오버워치
  '오버워치2': '오버워치2', '오버워치': '오버워치2',
  'Overwatch 2': '오버워치2', 'Overwatch': '오버워치2', 'OW2': '오버워치2',

  // GTA
  'GTA': 'GTA', 'GTA5': 'GTA',
  'Grand Theft Auto V': 'GTA', 'GrandTheftAutoV': 'GTA',

  // FC온라인
  'FC온라인': 'FC온라인', 'EA SPORTS FC Online': 'FC온라인',
  'EASPORTSFCOnline': 'FC온라인', 'FIFA Online 4': 'FC온라인',

  // 몬헌
  '몬스터헌터 와일즈': '몬스터헌터 와일즈',
  'Monster Hunter Wilds': '몬스터헌터 와일즈',
  'MonsterHunterWilds': '몬스터헌터 와일즈', '몬헌': '몬스터헌터 와일즈',
  '몬스터헌터': '몬스터헌터 와일즈',

  // 타르코프
  '타르코프': '타르코프', 'Escape from Tarkov': '타르코프', 'EFT': '타르코프',

  // 스타크래프트
  '스타크래프트': '스타크래프트', 'StarCraft': '스타크래프트',
  'StarCraft II': '스타크래프트', 'StarCraftII': '스타크래프트', '스타2': '스타크래프트',

  // 워크래프트3
  '워크래프트3': '워크래프트3', 'Warcraft III': '워크래프트3',
  'WarcraftIII': '워크래프트3', 'Warcraft_III': '워크래프트3',

  // 디아블로
  '디아블로4': '디아블로4', '디아블로 4': '디아블로4',
  'Diablo IV': '디아블로4', 'DiabloIV': '디아블로4',

  // 메이플스토리
  '메이플스토리': '메이플스토리', 'MapleStory': '메이플스토리',

  // 바이오하자드
  '바이오하자드 레퀴엠': '바이오하자드 레퀴엠',
  'Resident Evil Requiem': '바이오하자드 레퀴엠',
  'ResidentEvilRequiem': '바이오하자드 레퀴엠',

  // 림월드
  '림월드': '림월드', 'RimWorld': '림월드',

  // 잡담
  'Just Chatting': '잡담', '잡담': '잡담',
  'Talk/Social': '잡담', 'talk': '잡담', 'Talk': '잡담',

  // 음악
  'Music/Dance': '음악/댄스', '음악': '음악/댄스',
}

function normalizeCategory(category: string, title: string): string {
  const direct = CATEGORY_NORMALIZE[category?.trim()]
  if (direct) return direct

  if (/봉켓몬/i.test(title)) return '봉켓몬 서버'
  if (/퍼켓몬/i.test(title)) return '퍼켓몬 서버'
  if (/멸망전/i.test(title)) return '멸망전'
  if (/인생모드|인생 모드/i.test(title)) return 'GTA'

  const cleaned = category?.replace(/_/g, ' ').trim()
  return CATEGORY_NORMALIZE[cleaned] || category?.trim() || '기타'
}

// ─── 합방/이벤트 판별 키워드 ───
// 이 카테고리에 속하면 "합방" 탭으로 분류
const EVENT_CATEGORY_KEYWORDS = [
  '봉켓몬', '퍼켓몬', '멸망전', '합방', '서버', '이벤트',
  '프로젝트', '시즌', '대회', '컵', '리그', '토너먼트',
]

function isEventCategory(name: string): boolean {
  return EVENT_CATEGORY_KEYWORDS.some((kw) => name.includes(kw))
}

// ─── 전체 라이브 수집 ───
export async function getAllLives() {
  const [chzzkLives, soopLives] = await Promise.all([
    getChzzkLives(),
    getSoopLives(),
  ])

  const all = [...chzzkLives, ...soopLives].map((live) => ({
    ...live,
    category: normalizeCategory(live.category || '', live.title || ''),
  }))

  return all.sort((a, b) => b.viewers - a.viewers)
}

// ─── 카테고리별 그룹핑 ───
export async function getLivesByCategory() {
  const [all, activeEvents] = await Promise.all([
    getAllLives(),
    getActiveEvents().catch(() => []),
  ])

  const gameCategoryMap = new Map<string, any[]>()   // 게임 카테고리
  const eventCategoryMap = new Map<string, any[]>()  // 합방/이벤트 카테고리

  // 1. Supabase 이벤트 매칭
  const matchedIds = new Set<string | number>()

  if (activeEvents.length > 0) {
    const eventMatches = matchLivesToEvents(all as any, activeEvents)

    for (const [, { name, lives }] of eventMatches) {
      if (lives.length === 0) continue
      if (!eventCategoryMap.has(name)) eventCategoryMap.set(name, [])
      eventCategoryMap.get(name)!.push(...lives)
      lives.forEach((l) => matchedIds.add(l.id))
    }

    // 이상 감지 (백그라운드)
    const existingKeywords = activeEvents.flatMap((e) => e.keywords)
    const anomalies = detectAnomalies(all as any, existingKeywords)
    if (anomalies.length > 0) {
      const { reportCandidate } = await import('./events')
      anomalies.forEach(({ keyword, titles }) => {
        reportCandidate(keyword, titles).catch(() => {})
      })
    }
  }

  // 2. 나머지 분류
  for (const live of all) {
    if (matchedIds.has(live.id)) continue

    const cat = live.category || '기타'

    if (isEventCategory(cat)) {
      // 합방 탭으로
      if (!eventCategoryMap.has(cat)) eventCategoryMap.set(cat, [])
      eventCategoryMap.get(cat)!.push(live)
    } else {
      // 게임 탭으로
      if (!gameCategoryMap.has(cat)) gameCategoryMap.set(cat, [])
      gameCategoryMap.get(cat)!.push(live)
    }
  }

  const toCategory = (map: Map<string, any[]>) =>
    Array.from(map.entries())
      .map(([name, streams]) => ({
        id: name,
        name,
        streams: streams.sort((a: any, b: any) => b.viewers - a.viewers),
        totalViewers: streams.reduce((sum: number, s: any) => sum + s.viewers, 0),
        chzzkCount: streams.filter((s: any) => s.platform === 'chzzk').length,
        soopCount: streams.filter((s: any) => s.platform === 'soop').length,
      }))
      .filter((cat) => cat.streams.length > 0)
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 20)

  return {
    game: toCategory(gameCategoryMap),
    event: toCategory(eventCategoryMap),
  }
}

export function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}
