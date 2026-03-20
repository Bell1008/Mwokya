// 숲(SOOP) 라이브 목록 가져오기
export async function getSoopLives(category?: string) {
  try {
    const params = new URLSearchParams({
      nPageNo: '1',
      nListCnt: '60',
      szOrder: 'view_cnt',
      ...(category ? { szCateNo: category } : {}),
    })

    const res = await fetch(
      `http://api.m.afreecatv.com/broad/a/items?${params}`,
      {
        headers: {
          Referer: 'https://www.sooplive.co.kr',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        next: { revalidate: 60 },
      }
    )

    const text = await res.text()
    if (!text || text.trim() === '') return []

    const data = JSON.parse(text)
    const groups = data?.data?.groups || []
    const lives: any[] = []

    for (const group of groups) {
      const contents = group?.contents || []
      lives.push(...contents)
    }

    return lives.map((live: any) => ({
      id: live.broad_no,
      platform: 'soop',
      streamer: live.user_nick || '알 수 없음',
      streamerId: live.user_id,
      title: live.title || '',
      viewers: live.view_cnt || 0,
      thumbnail: live.thumbnail || `https://liveimg.sooplive.co.kr/m/${live.broad_no}`,
      profileImage: live.user_profile_img || '',
      category: (live.category_tags || []).join(', '),
      url: `https://play.sooplive.co.kr/${live.user_id}/${live.broad_no}`,
      startedAt: '',
    }))
  } catch (e) {
    console.error('숲 API 오류:', e)
    return []
  }
}
