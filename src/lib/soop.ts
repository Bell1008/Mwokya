async function fetchSoopPage(page: number) {
  const params = new URLSearchParams({
    nPageNo: String(page),
    nListCnt: '20',
    szOrder: 'view_cnt',
    szType: 'json',
    // 한국어 방송만 필터링 (언어 파라미터 추가)
    szLangType: 'ko_KR',
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

// 숲 카테고리 → 정규화된 한국어 카테고리명 매핑
const SOOP_CATEGORY_MAP: Record<string, string> = {
  // 롤
  'League of Legends': '리그 오브 레전드',
  'LOL': '리그 오브 레전드',
  // 마인크래프트
  'Minecraft': '마인크래프트',
  // 와우
  'World of Warcraft': '월드 오브 워크래프트',
  'WoW': '월드 오브 워크래프트',
  // 배그
  'PUBG: BATTLEGROUNDS': '배틀그라운드',
  'PUBG': '배틀그라운드',
  // 발로란트
  'VALORANT': '발로란트',
  // 오버워치
  'Overwatch 2': '오버워치2',
  'Overwatch': '오버워치2',
  // GTA
  'Grand Theft Auto V': 'GTA',
  'GTA V': 'GTA',
  // 피파/FC
  'EA SPORTS FC Online': 'FC온라인',
  'FIFA Online 4': 'FC온라인',
  // 몬헌
  'Monster Hunter Wilds': '몬스터헌터 와일즈',
  'Monster Hunter: World': '몬스터헌터',
  // 타르코프
  'Escape from Tarkov': '타르코프',
  // 기타
  'Just Chatting': '잡담',
  'Music/Dance': '음악/댄스',
  'Travel': '여행',
  'Sports': '스포츠',
  'Cooking': '요리',
  'Talk/Social': '토크',
}

function normalizeSoopCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return '기타'
  const first = tags[0]
  return SOOP_CATEGORY_MAP[first] || first
}

export async function getSoopLives() {
  try {
    // 20페이지 동시 수집 (최대 400개)
    const pages = await Promise.all(
      Array.from({ length: 20 }, (_, i) => fetchSoopPage(i + 1))
    )
    const all = pages.flat()

    // 중복 제거 (언어 파라미터로 이미 한국어만 오지만 혹시 모르니 한글 체크도 유지)
    const unique = Array.from(
      new Map(all.map((l: any) => [l.broad_no, l])).values()
    )

    console.log('숲 수집:', all.length, '/ 중복제거 후:', unique.length)

    return unique.map((live: any) => ({
      id: live.broad_no,
      platform: 'soop',
      streamer: live.user_nick || '알 수 없음',
      streamerId: live.user_id,
      title: live.title || '',
      viewers: live.view_cnt || 0,
      thumbnail: live.thumbnail || `https://liveimg.sooplive.co.kr/m/${live.broad_no}`,
      profileImage: live.user_profile_img || '',
      category: normalizeSoopCategory(live.category_tags || []),
      url: `https://play.sooplive.co.kr/${live.user_id}/${live.broad_no}`,
      startedAt: '',
    }))
  } catch (e) {
    console.error('숲 API 오류:', e)
    return []
  }
}
