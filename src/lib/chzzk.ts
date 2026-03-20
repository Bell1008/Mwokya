import { ChzzkClient } from 'chzzk'

const client = new ChzzkClient()

export async function getChzzkLives() {
  try {
    // 여러 페이지 동시 수집
    const requests = Array.from({ length: 10 }, (_, i) =>
      client.search.lives('', { size: 50, offset: i * 50 })
    )
    const results = await Promise.all(requests)
    const lives = results.flatMap((r: any) => r?.lives || [])

    // 중복 제거
    const unique = Array.from(new Map(lives.map((l: any) => [l.liveId, l])).values())

    console.log('치지직 수집:', unique.length)

    return unique.map((live: any) => ({
      id: live.liveId,
      platform: 'chzzk',
      streamer: live.channel?.channelName || '알 수 없음',
      streamerId: live.channel?.channelId,
      title: live.liveTitle || '',
      viewers: live.concurrentUserCount || 0,
      thumbnail: live.liveImageUrl,
      profileImage: live.channel?.channelImageUrl,
      category: live.liveCategoryValue || '',
      url: `https://chzzk.naver.com/live/${live.channel?.channelId}`,
      startedAt: live.openDate,
    }))
  } catch (e) {
    console.error('치지직 API 오류:', e)
    return []
  }
}

export function filterServerStreams(lives: any[], serverKeywords: string[]) {
  return lives.filter((live) =>
    serverKeywords.some(
      (kw) => live.title?.includes(kw) || live.category?.includes(kw)
    )
  )
}
