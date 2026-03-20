// 숲(SOOP) 라이브 목록 가져오기
export async function getSoopLives(category?: string) {
  try {
    const params = new URLSearchParams({
      nPageNo: '1',
      nListCnt: '60',
      szOrder: 'view_cnt',
      szType: 'json',
      ...(category ? { szCateNo: category } : {}),
    })

    const res = await fetch(
      `https://live.sooplive.co.kr/api/get_broad_list.php?${params}`,
      {
        headers: {
          Referer: 'https://www.sooplive.co.kr',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        next: { revalidate: 60 },
      }
    )

    const text = await res.text()
    if (!text || text.trim() === '') return []

    const data = JSON.parse(text)
    const lives = data?.REAL_BROAD || data?.DATA || []

    return lives.map((live: any) => ({
      id: live.broad_no || live.BROAD_NO,
      platform: 'soop',
      streamer: live.station_name || live.USER_NICK || '알 수 없음',
      streamerId: live.user_id || live.USER_ID,
      title: live.broad_title || live.BROAD_TITLE || '',
      viewers: parseInt(live.total_view_cnt || live.TOTAL_VIEW_CNT || '0'),
      thumbnail: `https://liveimg.sooplive.co.kr/m/${live.broad_no || live.BROAD_NO}`,
      profileImage: `https://stimg.sooplive.co.kr/LOGO/${(live.user_id || live.USER_ID)?.slice(0, 2)}/${live.user_id || live.USER_ID}/${live.user_id || live.USER_ID}.jpg`,
      category: live.broad_cate_name || live.BROAD_CATE_NAME || '',
      url: `https://play.sooplive.co.kr/${live.user_id || live.USER_ID}/${live.broad_no || live.BROAD_NO}`,
      startedAt: live.broad_start || live.BROAD_START,
    }))
  } catch (e) {
    console.error('숲 API 오류:', e)
    return []
  }
}
