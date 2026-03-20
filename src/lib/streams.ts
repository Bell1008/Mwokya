import { getChzzkLives, filterServerStreams } from './chzzk'
import { getSoopLives } from './soop'

// 현재 핫한 서버 키워드 목록 (수동 업데이트 or DB에서 가져오기)
export const HOT_SERVERS = [
  {
    id: 'wow',
    name: '와우 서버',
    keywords: ['와우', 'WoW', '월드오브워크래프트', '클래식', '하드코어'],
    color: '#C69B3A',
  },
  {
    id: 'minecraft',
    name: '마인크래프트 서버',
    keywords: ['마인크래프트', 'minecraft', '마크', '서버', '퍼켓몬', '봉켓몬'],
    color: '#5B8731',
  },
  {
    id: 'gta',
    name: 'GTA 서버',
    keywords: ['GTA', '인생모드', 'RP', '리얼라이프'],
    color: '#1B74E4',
  },
  {
    id: 'lethal',
    name: '리썰컴퍼니',
    keywords: ['리썰', 'Lethal Company', '리썰컴퍼니'],
    color: '#8B0000',
  },
]

// 숲 + 치지직 통합 라이브 목록
export async function getAllLives() {
  const [chzzkLives, soopLives] = await Promise.all([
    getChzzkLives(),
    getSoopLives(),
  ])

  const all = [...chzzkLives, ...soopLives]

  // 시청자 수 내림차순 정렬
  return all.sort((a, b) => b.viewers - a.viewers)
}

// 서버별 스트리머 그룹핑
export async function getLivesByServer() {
  const all = await getAllLives()

  return HOT_SERVERS.map((server) => ({
    ...server,
    streams: filterServerStreams(all, server.keywords),
    totalViewers: filterServerStreams(all, server.keywords)
      .reduce((sum, s) => sum + s.viewers, 0),
  })).sort((a, b) => b.totalViewers - a.totalViewers)
}

// 시청자 수 포맷 (12345 -> 1.2만)
export function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}
