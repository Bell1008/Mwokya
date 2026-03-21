import { getChzzkLives } from './chzzk'
import { getSoopLives } from './soop'
import { getActiveEvents } from './events'
import { matchLivesToEvents, detectAnomalies } from './matcher'

// ─── 카테고리 정규화 맵 ───
const CATEGORY_NORMALIZE: Record<string, string> = {
  '리그 오브 레전드': '리그 오브 레전드',
  'League of Legends': '리그 오브 레전드',
  'League_of_Legends': '리그 오브 레전드',
  'LOL': '리그 오브 레전드', 'LoL': '리그 오브 레전드', '롤': '리그 오브 레전드',
  '마인크래프트': '마인크래프트', 'Minecraft': '마인크래프트', 'minecraft': '마인크래프트', '마크': '마인크래프트',
  '월드 오브 워크래프트': '월드 오브 워크래프트', 'World of Warcraft': '월드 오브 워크래프트',
  'WorldofWarcraft': '월드 오브 워크래프트', 'WoW': '월드 오브 워크래프트', '와우': '월드 오브 워크래프트',
  '배틀그라운드': '배틀그라운드', 'PUBG: BATTLEGROUNDS': '배틀그라운드', 'PUBG_BATTLEGROUNDS': '배틀그라운드', 'PUBG': '배틀그라운드', '배그': '배틀그라운드',
  '발로란트': '발로란트', 'VALORANT': '발로란트', 'Valorant': '발로란트', '발로': '발로란트',
  '오버워치2': '오버워치2', '오버워치': '오버워치2', 'Overwatch 2': '오버워치2', 'Overwatch': '오버워치2', 'OW2': '오버워치2',
  'GTA': 'GTA', 'GTA5': 'GTA', 'Grand Theft Auto V': 'GTA', 'GrandTheftAutoV': 'GTA',
  'FC온라인': 'FC온라인', 'EA SPORTS FC Online': 'FC온라인', 'EASPORTSFCOnline': 'FC온라인', 'FIFA Online 4': 'FC온라인',
  '몬스터헌터 와일즈': '몬스터헌터 와일즈', 'Monster Hunter Wilds': '몬스터헌터 와일즈', 'MonsterHunterWilds': '몬스터헌터 와일즈', '몬헌': '몬스터헌터 와일즈',
  '타르코프': '타르코프', 'Escape from Tarkov': '타르코프', 'EFT': '타르코프',
  '스타크래프트': '스타크래프트', 'StarCraft': '스타크래프트', 'StarCraft II': '스타크래프트',
  'Just Chatting': '잡담', '잡담': '잡담', 'Talk/Social': '잡담',
  'Music/Dance': '음악/댄스',
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

// ─── 카테고리별 그룹핑 (이벤트 시스템 통합) ───
export async function getLivesByCategory() {
  const [all, activeEvents] = await Promise.all([
    getAllLives(),
    getActiveEvents().catch(() => []),  // Supabase 오류 시 빈 배열
  ])

  const categoryMap = new Map<string, any[]>()

  // 1. Supabase 이벤트 매칭 (DB에 등록된 이벤트)
  if (activeEvents.length > 0) {
    const eventMatches = matchLivesToEvents(all as any, activeEvents)
    const matchedIds = new Set<string | number>()

    for (const [eventId, { name, game, lives }] of eventMatches) {
      if (lives.length === 0) continue
      const key = name
      if (!categoryMap.has(key)) categoryMap.set(key, [])
      categoryMap.get(key)!.push(...lives)
      lives.forEach((l) => matchedIds.add(l.id))
    }

    // 이벤트에 매칭된 라이브는 일반 카테고리에서 제외
    const unmatched = all.filter((l) => !matchedIds.has(l.id))

    // 2. 나머지는 일반 카테고리로
    for (const live of unmatched) {
      const cat = live.category || '기타'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(live)
    }

    // 3. 이상 감지 (백그라운드, 결과 기다리지 않음)
    const existingKeywords = activeEvents.flatMap((e) => e.keywords)
    const anomalies = detectAnomalies(all as any, existingKeywords)
    if (anomalies.length > 0) {
      const { reportCandidate } = await import('./events')
      anomalies.forEach(({ keyword, titles }) => {
        reportCandidate(keyword, titles).catch(() => {})
      })
    }
  } else {
    // Supabase 없으면 일반 카테고리만
    for (const live of all) {
      const cat = live.category || '기타'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(live)
    }
  }

  return Array.from(categoryMap.entries())
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
}

export function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}
