async function fetchSoopPage(page: number) {
  const params = new URLSearchParams({
    nPageNo: String(page),
    nListCnt: '20',
    szOrder: 'view_cnt',
    szType: 'json',
  })

  const res = await fetch(
    `https://api.m.afreecatv.com/broad/a/items?${params}`,
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
    lives.push(...(group?.contents || []))
  }
  return lives
}

export async function getSoopLives() {
  try {
    // 20페이지 동시 수집 (최대 400개)
    const pages = await Promise.all(
      Array.from({ length: 20 }, (_, i) => fetchSoopPage(i + 1))
    )
    const all = pages.flat()

    // 한글 제목 방송만 필터링
    const koreanOnly = all.filter((live: any) =>
      /[가-힣]/.test(live.title || '')
    )

    // 중복 제거
    const unique = Array.from(
      new Map(koreanOnly.map((l: any) => [l.broad_no, l])).values()
    )

    console.log('숲 수집:', all.length, '/ 한국어:', unique.length)

    return unique.map((live: any) => ({
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
