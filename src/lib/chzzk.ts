// 치지직 공식 API로 라이브 목록 가져오기
export async function getChzzkLives(category?: string) {
  try {
    // Client 인증 토큰 발급
    const tokenRes = await fetch('https://auth.chzzk.naver.com/auth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantType: 'client_credentials',
        clientId: process.env.CHZZK_CLIENT_ID,
        clientSecret: process.env.CHZZK_CLIENT_SECRET,
      }),
    })

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.content?.accessToken

    if (!accessToken) {
      console.error('치지직 토큰 발급 실패:', tokenData)
      return []
    }

    // 라이브 목록 조회
    const livesRes = await fetch(
      `https://api.chzzk.naver.com/service/v1/lives?size=50${category ? `&categoryId=${category}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Client-Id': process.env.CHZZK_CLIENT_ID || '',
        },
      }
    )

    const livesData = await livesRes.json()

    return (livesData.content?.data || []).map((live: any) => ({
      id: live.liveId,
      platform: 'chzzk',
      streamer: live.channel?.channelName || '알 수 없음',
      streamerId: live.channel?.channelId,
      title: live.liveTitle,
      viewers: live.concurrentUserCount || 0,
      thumbnail: live.liveImageUrl,
      profileImage: live.channel?.channelImageUrl,
      category: live.liveCategoryValue,
      url: `https://chzzk.naver.com/live/${live.channel?.channelId}`,
      startedAt: live.openDate,
    }))
  } catch (e) {
    console.error('치지직 API 오류:', e)
    return []
  }
}

// 치지직 서버 방송 감지
export function filterServerStreams(lives: any[], serverKeywords: string[]) {
  return lives.filter((live) =>
    serverKeywords.some(
      (kw) =>
        live.title?.includes(kw) ||
        live.category?.includes(kw)
    )
  )
}
