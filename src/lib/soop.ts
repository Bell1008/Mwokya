async function fetchSoopPage(page: number) {
  const params = new URLSearchParams({
    nPageNo: String(page),
    nListCnt: '50',       // 한 번에 50개씩 (최대값)
    szOrder: 'view_cnt',
    szType: 'json',
    szLangType: 'ko_KR',  // 한국어 방송만 요청
  })

  const res = await fetch(
    `https://api.m.afreecatv.com/broad/a/items?${params}`,
    {
      headers: {
        Referer: 'https://www.sooplive.co.kr',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      next: { revalidate: 60 },
    }
  )

  const text = await res.text()
  if (!text || text.trim() === '') return []

  try {
    const data = JSON.parse(text)
    const groups = data?.data?.groups || []
    const lives: any[] = []
    for (const group of groups) {
      lives.push(...(group?.contents || []))
    }
    return lives
  } catch {
    return []
  }
}

// 숲 카테고리 → 정규화된 한국어 카테고리명 매핑
const SOOP_CATEGORY_MAP: Record<string, string> = {
  'League of Legends': '리그 오브 레전드',
  'LOL': '리그 오브 레전드',
  'Minecraft': '마인크래프트',
  'World of Warcraft': '월드 오브 워크래프트',
  'WoW': '월드 오브 워크래프트',
  'PUBG: BATTLEGROUNDS': '배틀그라운드',
  'PUBG': '배틀그라운드',
  'VALORANT': '발로란트',
  'Overwatch 2': '오버워치2',
  'Overwatch': '오버워치2',
  'Grand Theft Auto V': 'GTA',
  'GTA V': 'GTA',
  'EA SPORTS FC Online': 'FC온라인',
  'FIFA Online 4': 'FC온라인',
  'Monster Hunter Wilds': '몬스터헌터 와일즈',
  'Monster Hunter: World': '몬스터헌터',
  'Escape from Tarkov': '타르코프',
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

// 한국어 방송 판별 (3중 체크)
function isKoreanStream(live: any): boolean {
  const hasKoreanTitle = /[가-힣]/.test(live.title || '')
  const hasKoreanLangTag = (live.lang_tags || []).includes('Korean') ||
    live.strm_lang_type === 'ko_KR'
  const hasKoreanNick = /[가-힣]/.test(live.user_nick || '')
  return hasKoreanTitle || hasKoreanLangTag || hasKoreanNick
}

export async function getSoopLives() {
  try {
    // szLangType=ko_KR 파라미터로 한국어 방송만 요청 + 10페이지 (최대 500개)
    const pages = await Promise.all(
      Array.from({ length: 10 }, (_, i) => fetchSoopPage(i + 1))
    )
    const all = pages.flat()

    // 혹시 외국 방송 섞이면 추가 필터
    const koreanOnly = all.filter(isKoreanStream)

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
      category: normalizeSoopCategory(live.category_tags || []),
      url: `https://play.sooplive.co.kr/${live.user_id}/${live.broad_no}`,
      startedAt: '',
    }))
  } catch (e) {
    console.error('숲 API 오류:', e)
    return []
  }
}
