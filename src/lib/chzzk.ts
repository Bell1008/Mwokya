export async function getChzzkLives() {
  try {
    const clientId = process.env.CHZZK_CLIENT_ID || ''
    const clientSecret = process.env.CHZZK_CLIENT_SECRET || ''

    if (!clientId || !clientSecret) {
      console.error('치지직 API 키가 없습니다')
      return []
    }

    const allLives: any[] = []
    let next: string | null = null

    for (let i = 0; i < 25; i++) {
      const url: string = next
        ? `https://openapi.chzzk.naver.com/open/v1/lives?size=20&next=${encodeURIComponent(next)}`
        : `https://openapi.chzzk.naver.com/open/v1/lives?size=20`

      const res = await fetch(url, {
        headers: {
          'Client-Id': clientId,
          'Client-Secret': clientSecret,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },  // no-store 대신 60초 캐시로 변경
      })

      if (!res.ok) {
        console.error('치지직 API 오류:', res.status)
        break
      }

      const data: any = await res.json()
      const lives: any[] = data?.content?.data ?? []
      allLives.push(...lives)

      next = data?.content?.page?.next ?? null
      if (!next || lives.length === 0) break
    }

    console.log('치지직 수집:', allLives.length)

    return allLives.map((live: any) => ({
      id: live.liveId as number,
      platform: 'chzzk' as const,
      streamer: (live.channelName as string) || '알 수 없음',
      streamerId: live.channelId as string,
      title: (live.liveTitle as string) || '',
      viewers: (live.concurrentUserCount as number) || 0,
      thumbnail: null,
      profileImage: (live.channelImageUrl as string) || '',
      category: (live.liveCategoryValue as string) || (live.liveCategory as string) || '',
      url: `https://chzzk.naver.com/live/${live.channelId as string}`,
      startedAt: live.openDate as string,
    }))
  } catch (e) {
    console.error('치지직 API 오류:', e)
    return []
  }
}

export function filterServerStreams(lives: any[], serverKeywords: string[]) {
  return lives.filter((live: any) =>
    serverKeywords.some(
      (kw) => (live.title as string)?.includes(kw) || (live.category as string)?.includes(kw)
    )
  )
}
