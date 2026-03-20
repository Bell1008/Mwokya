import { getChzzkLives, filterServerStreams } from './chzzk'
import { getSoopLives } from './soop'

// 숲 + 치지직 통합 라이브 목록
export async function getAllLives() {
  const [chzzkLives, soopLives] = await Promise.all([
    getChzzkLives(),
    getSoopLives(),
  ])

  const all = [...chzzkLives, ...soopLives]
  return all.sort((a, b) => b.viewers - a.viewers)
}

// 카테고리별 자동 그룹핑 (하드코딩 없이 실제 데이터 기반)
export async function getLivesByCategory() {
  const all = await getAllLives()

  // 카테고리별로 자동 분류
  const categoryMap = new Map<string, any[]>()

  for (const live of all) {
    const cat = live.category?.trim() || '기타'
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, [])
    }
    categoryMap.get(cat)!.push(live)
  }

  // 시청자 총합 기준 정렬, 상위 10개 카테고리만
  const categories = Array.from(categoryMap.entries())
    .map(([name, streams]) => ({
      id: name,
      name,
      streams,
      totalViewers: streams.reduce((sum, s) => sum + s.viewers, 0),
    }))
    .filter((cat) => cat.streams.length > 0)
    .sort((a, b) => b.totalViewers - a.totalViewers)
    .slice(0, 10)

  return categories
}

// 시청자 수 포맷 (12345 -> 1.2만)
export function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}

// filterServerStreams는 chzzk.ts에서 import해서 re-export
export { filterServerStreams }
