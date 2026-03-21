import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── 타입 ───
export interface Event {
  id: string
  name: string
  game: string | null
  keywords: string[]
  is_active: boolean
  auto_detected: boolean
}

// ─── 활성 이벤트 목록 가져오기 (60초 캐시) ───
let cachedEvents: Event[] = []
let cacheTime = 0

export async function getActiveEvents(): Promise<Event[]> {
  const now = Date.now()
  if (now - cacheTime < 60000 && cachedEvents.length > 0) {
    return cachedEvents
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('이벤트 로드 오류:', error)
    return cachedEvents
  }

  cachedEvents = data || []
  cacheTime = now
  return cachedEvents
}

// ─── 이상 감지: 후보 키워드 등록 ───
export async function reportCandidate(keyword: string, titles: string[]) {
  const { data: existing } = await supabase
    .from('event_candidates')
    .select('*')
    .eq('keyword', keyword)
    .eq('processed', false)
    .single()

  if (existing) {
    // 이미 있으면 count 증가
    await supabase
      .from('event_candidates')
      .update({
        count: existing.count + titles.length,
        sample_titles: [...new Set([...existing.sample_titles, ...titles])].slice(0, 10),
      })
      .eq('id', existing.id)
  } else {
    // 새로 등록
    await supabase.from('event_candidates').insert({
      keyword,
      count: titles.length,
      sample_titles: titles.slice(0, 10),
    })
  }
}

// ─── 키워드 매칭 통계 업데이트 ───
export async function updateKeywordStat(eventId: string, keyword: string) {
  const { data: existing } = await supabase
    .from('keyword_stats')
    .select('*')
    .eq('event_id', eventId)
    .eq('keyword', keyword)
    .single()

  if (existing) {
    await supabase
      .from('keyword_stats')
      .update({
        match_count: existing.match_count + 1,
        last_matched_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('keyword_stats').insert({
      event_id: eventId,
      keyword,
      match_count: 1,
    })
  }
}
