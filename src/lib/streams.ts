import { getChzzkLives } from './chzzk'
import { getSoopLives } from './soop'

// ─────────────────────────────────────────────
// 카테고리 정규화 맵
// 두 플랫폼에서 오는 다양한 표현을 하나로 통일
// ─────────────────────────────────────────────
const CATEGORY_NORMALIZE: Record<string, string> = {
  // 롤
  '리그 오브 레전드': '리그 오브 레전드',
  'League of Legends': '리그 오브 레전드',
  'League_of_Legends': '리그 오브 레전드',
  'LOL': '리그 오브 레전드',
  'LoL': '리그 오브 레전드',
  '롤': '리그 오브 레전드',

  // 마인크래프트
  '마인크래프트': '마인크래프트',
  'Minecraft': '마인크래프트',
  'minecraft': '마인크래프트',
  '마크': '마인크래프트',

  // 와우
  '월드 오브 워크래프트': '월드 오브 워크래프트',
  'World of Warcraft': '월드 오브 워크래프트',
  'WorldofWarcraft': '월드 오브 워크래프트',
  'WoW': '월드 오브 워크래프트',
  '와우': '월드 오브 워크래프트',
  '클래식': '월드 오브 워크래프트',

  // 배그
  '배틀그라운드': '배틀그라운드',
  'PUBG: BATTLEGROUNDS': '배틀그라운드',
  'PUBG_BATTLEGROUNDS': '배틀그라운드',
  'PUBG': '배틀그라운드',
  '배그': '배틀그라운드',

  // 발로란트
  '발로란트': '발로란트',
  'VALORANT': '발로란트',
  'Valorant': '발로란트',
  '발로': '발로란트',

  // 오버워치
  '오버워치2': '오버워치2',
  '오버워치': '오버워치2',
  'Overwatch 2': '오버워치2',
  'Overwatch': '오버워치2',
  'OW2': '오버워치2',

  // GTA
  'GTA': 'GTA',
  'GTA5': 'GTA',
  'Grand Theft Auto V': 'GTA',
  'GrandTheftAutoV': 'GTA',
  '인생모드': 'GTA',

  // FC온라인
  'FC온라인': 'FC온라인',
  'EA SPORTS FC Online': 'FC온라인',
  'EASPORTSFCOnline': 'FC온라인',
  'FIFA Online 4': 'FC온라인',
  '피파온라인': 'FC온라인',

  // 몬헌
  '몬스터헌터 와일즈': '몬스터헌터 와일즈',
  'Monster Hunter Wilds': '몬스터헌터 와일즈',
  'MonsterHunterWilds': '몬스터헌터 와일즈',
  '몬헌': '몬스터헌터 와일즈',
  '몬스터헌터': '몬스터헌터 와일즈',

  // 타르코프
  '타르코프': '타르코프',
  'Escape from Tarkov': '타르코프',
  'EscapefromTarkov': '타르코프',
  'EFT': '타르코프',

  // 스타크래프트
  '스타크래프트': '스타크래프트',
  'StarCraft': '스타크래프트',
  'StarCraft II': '스타크래프트',
  'StarCraftII': '스타크래프트',
  '스타2': '스타크래프트',

  // 디아블로
  '디아블로 4': '디아블로4',
  'Diablo IV': '디아블로4',
  'DiabloIV': '디아블로4',

  // 봉켓몬/퍼켓몬 (마인크래프트 서버이지만 별도 분류)
  '봉켓몬': '봉켓몬 서버',
  '퍼켓몬': '퍼켓몬 서버',

  // 잡담
  'Just Chatting': '잡담',
  '잡담': '잡담',
  'Talk/Social': '잡담',

  // 음악
  'Music/Dance': '음악/댄스',
  '음악': '음악/댄스',
}

// 카테고리 정규화 함수
// category 값이나 title에서 키워드 감지
function normalizeCategory(category: string, title: string): string {
  // 1. 카테고리 직접 매핑 시도
  const direct = CATEGORY_NORMALIZE[category?.trim()]
  if (direct) return direct

  // 2. 제목에서 특수 서버 키워드 감지 (봉켓몬, 퍼켓몬 등)
  if (/봉켓몬/i.test(title)) return '봉켓몬 서버'
  if (/퍼켓몬/i.test(title)) return '퍼켓몬 서버'
  if (/멸망전/i.test(title)) return '멸망전'
  if (/인생모드|인생 모드/i.test(title)) return 'GTA'
  if (/하드코어.*와우|와우.*하드코어/i.test(title)) return '월드 오브 워크래프트'

  // 3. 카테고리에서 언더스코어 제거 후 재시도 (치지직은 League_of_Legends 형태로 옴)
  const cleaned = category?.replace(/_/g, ' ').trim()
  const cleanedMatch = CATEGORY_NORMALIZE[cleaned]
  if (cleanedMatch) return cleanedMatch

  // 4. 그대로 반환 (알 수 없는 카테고리)
  return category?.trim() || '기타'
}

// ─────────────────────────────────────────────
// 통합 라이브 목록
// ─────────────────────────────────────────────
export async function getAllLives() {
  const [chzzkLives, soopLives] = await Promise.all([
    getChzzkLives(),
    getSoopLives(),
  ])

  const all = [...chzzkLives, ...soopLives].map((live) => ({
    ...live,
    // 카테고리 정규화 적용
    category: normalizeCategory(live.category || '', live.title || ''),
  }))

  return all.sort((a, b) => b.viewers - a.viewers)
}

// ─────────────────────────────────────────────
// 카테고리별 그룹핑
// ─────────────────────────────────────────────
export async function getLivesByCategory() {
  const all = await getAllLives()

  const categoryMap = new Map<string, any[]>()

  for (const live of all) {
    const cat = live.category || '기타'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(live)
  }

  const categories = Array.from(categoryMap.entries())
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
    .slice(0, 15)

  return categories
}

// 시청자 수 포맷
export function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}
