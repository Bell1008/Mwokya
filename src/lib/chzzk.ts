// 치지직 공식 Open API
export async function getChzzkLives() {
  try {
    const clientId = process.env.CHZZK_CLIENT_ID || ''
    const clientSecret = process.env.CHZZK_CLIENT_SECRET || ''

    let allLives: any[] = []
    let next: string | null = null

    for (let i = 0; i < 10; i++) {
      const url: string = next
        ? `https://openapi.chzzk.naver.com/open/v1/lives?size=20&next=${next}`
        : `https://openapi.chzzk.naver.com/open/v1/lives?size=20`

      const res = await fetch(url, {
        headers: {
          'Client-Id': clientId,
          'Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      })

      const data = await res.json()
      const lives = data?.content?.data || []
      allLives.push(...lives)

      next = data?.content?.page?.next || null
      if (!next || lives.length === 0) break
    }

    console.log('치지직 수집:', allLives.length)

    return allLives.map((live: any) => ({
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
