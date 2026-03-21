import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Event {
  id: string
  name: string
  game: string | null
  keywords: string[]
  is_active: boolean
  auto_detected: boolean
}

let cachedEvents: Event[] = []
let cacheTime = 0

export async function getActiveEvents(): Promise<Event[]> {
  const now = Date.now()
  if (now - cacheTime < 60000 && cachedEvents.length > 0) return cachedEvents

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

// game 파라미터 추가
export async function reportCandidate(keyword: string, titles: string[], game?: string) {
  const { data: existing } = await supabase
    .from('event_candidates')
    .select('*')
    .eq('keyword', keyword)
    .eq('processed', false)
    .single()

  if (existing) {
    await supabase
      .from('event_candidates')
      .update({
        count: existing.count + titles.length,
        sample_titles: [...new Set([...existing.sample_titles, ...titles])].slice(0, 10),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('event_candidates').insert({
      keyword,
      count: titles.length,
      sample_titles: titles.slice(0, 10),
      game: game || null,
    })
  }
}

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
      .update({ match_count: existing.match_count + 1, last_matched_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('keyword_stats').insert({ event_id: eventId, keyword, match_count: 1 })
  }
}
