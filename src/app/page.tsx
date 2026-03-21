'use client'

import { useEffect, useState, useRef } from 'react'

// ─── 타입 ───
interface Stream {
  id: string | number
  platform: 'chzzk' | 'soop'
  streamer: string
  title: string
  viewers: number
  thumbnail?: string | null
  profileImage?: string
  url: string
  category?: string
}

interface Category {
  id: string
  name: string
  streams: Stream[]
  totalViewers: number
  chzzkCount: number
  soopCount: number
}

interface EventItem {
  id: string
  name: string
  game: string | null
  keywords: string[]
  is_active: boolean
}

interface Data {
  game: Category[]
  event: Category[]
}

function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}

// ─── 검색 결과 타입 ───
interface SearchResult {
  type: 'streamer' | 'game' | 'event'
  label: string
  sub: string
  url?: string
  platform?: string
  viewers?: number
}

// ─── 통합 검색 ───
function searchAll(query: string, data: Data): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().replace(/\s/g, '')
  const results: SearchResult[] = []
  const seen = new Set<string>()

  // 스트리머 검색
  const allStreams = [...data.game.flatMap(c => c.streams), ...data.event.flatMap(c => c.streams)]
  const uniqueStreams = Array.from(new Map(allStreams.map(s => [s.id, s])).values())

  for (const s of uniqueStreams) {
    const name = s.streamer.toLowerCase().replace(/\s/g, '')
    if (name.includes(q) && !seen.has(s.streamer)) {
      seen.add(s.streamer)
      results.push({
        type: 'streamer',
        label: s.streamer,
        sub: s.title,
        url: s.url,
        platform: s.platform,
        viewers: s.viewers,
      })
    }
  }

  // 게임 카테고리 검색
  for (const cat of data.game) {
    const name = cat.name.toLowerCase().replace(/\s/g, '')
    if (name.includes(q) && !seen.has('game_' + cat.id)) {
      seen.add('game_' + cat.id)
      results.push({
        type: 'game',
        label: cat.name,
        sub: `${cat.streams.length}명 방송 중`,
        viewers: cat.totalViewers,
      })
    }
  }

  // 이벤트/서버 검색
  for (const cat of data.event) {
    const name = cat.name.toLowerCase().replace(/\s/g, '')
    if (name.includes(q) && !seen.has('event_' + cat.id)) {
      seen.add('event_' + cat.id)
      results.push({
        type: 'event',
        label: cat.name,
        sub: `${cat.streams.length}명 참여 중`,
        viewers: cat.totalViewers,
      })
    }
  }

  return results.slice(0, 10)
}

// ─── 검색바 컴포넌트 ───
function SearchBar({ data, onSelect }: { data: Data; onSelect: (tab: string, id?: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResults(searchAll(query, data))
  }, [query, data])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeColor = { streamer: '#03C75A', game: '#7B68EE', event: '#FF6B35' }
  const typeLabel = { streamer: '스트리머', game: '게임', event: '이벤트' }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#222', border: `1px solid ${focused ? '#555' : '#333'}`, borderRadius: 24, padding: '8px 16px', gap: 8, transition: 'border-color 0.2s' }}>
        <span style={{ fontSize: 14, opacity: 0.4 }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="스트리머, 게임, 이벤트 검색..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
        )}
      </div>

      {focused && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, marginTop: 6, overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                if (r.url) window.open(r.url, '_blank')
                else if (r.type === 'game') onSelect('game', r.label)
                else if (r.type === 'event') onSelect('event', r.label)
                setFocused(false)
                setQuery('')
              }}
              style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #222' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#222')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 10, fontWeight: 700, background: typeColor[r.type] + '22', color: typeColor[r.type], border: `1px solid ${typeColor[r.type]}44`, padding: '2px 6px', borderRadius: 10, flexShrink: 0 }}>
                {typeLabel[r.type]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
              </div>
              {r.viewers !== undefined && (
                <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>👁 {formatViewers(r.viewers)}</span>
              )}
              {r.platform && (
                <span style={{ fontSize: 10, fontWeight: 700, background: r.platform === 'chzzk' ? '#03C75A22' : '#00BFFF22', color: r.platform === 'chzzk' ? '#03C75A' : '#00BFFF', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>
                  {r.platform === 'chzzk' ? '치지직' : '숲'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {focused && query && results.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, marginTop: 6, padding: '16px', textAlign: 'center', color: '#555', fontSize: 13, zIndex: 200 }}>
          검색 결과 없음
        </div>
      )}
    </div>
  )
}

// ─── 홈 탭 ───
function HomeTab({ data, events, onTabChange }: { data: Data; events: EventItem[]; onTabChange: (tab: string) => void }) {
  const allStreams = data.game.flatMap(c => c.streams)
  const top5 = Array.from(new Map(allStreams.map(s => [s.id, s])).values())
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 5)

  const activeEvents = data.event.filter(e => e.streams.length > 0)

  // 오픈 예정 이벤트 (Supabase에서 가져온 것 중 현재 방송 없는 것)
  const upcomingEvents = events.filter(e =>
    e.is_active && !data.event.find(de => de.name === e.name)
  )

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* 광고 배너 슬롯 */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', border: '1px solid #1e3a5f', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#4a9eff', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>ADVERTISEMENT</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>광고 문의</div>
          <div style={{ fontSize: 12, color: '#888' }}>스트리머 서버 이벤트 배너 · 게임사 직접 광고 유치</div>
        </div>
        <div style={{ background: '#4a9eff22', border: '1px solid #4a9eff44', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#4a9eff', cursor: 'pointer', flexShrink: 0 }}>
          문의하기
        </div>
      </div>

      {/* 진행중인 이벤트 배너 */}
      {activeEvents.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: '#FF6B35', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            진행중인 이벤트
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeEvents.map(e => (
              <div
                key={e.id}
                onClick={() => onTabChange('event')}
                style={{ background: '#FF6B3511', border: '1px solid #FF6B3533', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={el => { el.currentTarget.style.background = '#FF6B3522' }}
                onMouseLeave={el => { el.currentTarget.style.background = '#FF6B3511' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: '#FF6B35' }}>
                  👁 {formatViewers(e.totalViewers)} · {e.streams.length}명 방송중
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 오픈 예정 타임라인 */}
      {upcomingEvents.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7B68EE', marginBottom: 10 }}>📅 오픈 예정</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcomingEvents.map(e => (
              <div key={e.id} style={{ background: '#7B68EE11', border: '1px solid #7B68EE33', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, background: '#7B68EE', borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</span>
                  {e.game && <span style={{ fontSize: 11, color: '#7B68EE', marginLeft: 8 }}>{e.game}</span>}
                </div>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>오픈 예정</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 실시간 HOT TOP5 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', marginBottom: 10 }}>🔥 실시간 HOT TOP 5</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top5.map((s, i) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={el => { el.currentTarget.style.borderColor = '#444' }}
                onMouseLeave={el => { el.currentTarget.style.borderColor = '#2a2a2a' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#2a2a2a', color: i < 3 ? '#000' : '#666', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </div>
                {s.profileImage && (
                  <img src={s.profileImage} alt={s.streamer} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.streamer}</div>
                  <div style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>👁 {formatViewers(s.viewers)}</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    <span style={{ background: s.platform === 'chzzk' ? '#03C75A' : '#00BFFF', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                      {s.platform === 'chzzk' ? '치지직' : '숲'}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 아코디언 섹션 ───
function ServerSection({ cat, index }: { cat: Category; index: number }) {
  const [open, setOpen] = useState(index < 3)

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', textAlign: 'left' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2a2a2a', color: index < 3 ? '#000' : '#666', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{cat.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#aaa' }}>👁 {formatViewers(cat.totalViewers)}</span>
            <span style={{ fontSize: 11, color: '#444' }}>·</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>🎙 {cat.streams.length}명</span>
            {cat.chzzkCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#03C75A22', color: '#03C75A', border: '1px solid #03C75A44', padding: '1px 6px', borderRadius: 10 }}>치지직 {cat.chzzkCount}</span>}
            {cat.soopCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#00BFFF22', color: '#00BFFF', border: '1px solid #00BFFF44', padding: '1px 6px', borderRadius: 10 }}>숲 {cat.soopCount}</span>}
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#444', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #222', padding: '10px 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {cat.streams.slice(0, 20).map((stream, i) => (
            <a key={stream.id} href={stream.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}
                onMouseEnter={el => { el.currentTarget.style.borderColor = '#444' }}
                onMouseLeave={el => { el.currentTarget.style.borderColor = '#2a2a2a' }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stream.thumbnail ? (
                    <img src={stream.thumbnail} alt={stream.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                  ) : stream.profileImage ? (
                    <img src={stream.profileImage} alt={stream.streamer} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 22, opacity: 0.15 }}>📺</div>
                  )}
                  <div style={{ position: 'absolute', top: 5, left: 5, background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
                    {stream.platform === 'chzzk' ? '치지직' : '숲'}
                  </div>
                  <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.8)', fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>
                    👁 {formatViewers(stream.viewers)}
                  </div>
                  {i < 3 && (
                    <div style={{ position: 'absolute', top: 5, right: 5, background: ['#FFD700', '#C0C0C0', '#CD7F32'][i], color: '#000', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </div>
                  )}
                </div>
                <div style={{ padding: '7px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {stream.profileImage && <img src={stream.profileImage} alt={stream.streamer} style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stream.streamer}</div>
                    <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{stream.title}</div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 메인 ───
export default function Home() {
  const [data, setData] = useState<Data>({ game: [], event: [] })
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'game' | 'event'>('home')
  const [scrolled, setScrolled] = useState(false)

  async function fetchData() {
    try {
      const [livesRes, eventsRes] = await Promise.all([
        fetch('/api/lives'),
        fetch('/api/events'),
      ])
      const livesData = await livesRes.json()
      setData(livesData)
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      }
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const tabs = [
    { key: 'home', label: '홈' },
    { key: 'game', label: '게임 카테고리', count: data.game.reduce((s, c) => s + c.streams.length, 0) },
    { key: 'event', label: '대규모·합방·서버·이벤트', count: data.event.reduce((s, c) => s + c.streams.length, 0) },
  ]

  const currentList = activeTab === 'game' ? data.game : activeTab === 'event' ? data.event : []

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <header style={{ background: scrolled ? 'rgba(15,15,15,0.95)' : '#1a1a1a', borderBottom: '1px solid #222', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)', transition: 'background 0.2s' }}>
        <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, fontWeight: 700, padding: 0, flexShrink: 0 }}>
          🎮 뭐켜
        </button>
        <SearchBar data={data} onSelect={(tab, id) => setActiveTab(tab as any)} />
        <div style={{ fontSize: 11, color: '#444', flexShrink: 0, display: 'none' }} className="desktop-time">
          {lastUpdated ? `${lastUpdated} 기준` : ''}
        </div>
        <button onClick={fetchData} style={{ background: '#222', border: '1px solid #333', color: '#666', fontSize: 11, padding: '5px 10px', borderRadius: 16, cursor: 'pointer', flexShrink: 0 }}>
          🔄
        </button>
      </header>

      {/* 탭 */}
      <div style={{ background: '#141414', borderBottom: '1px solid #1a1a1a', padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 14px', color: activeTab === tab.key ? '#fff' : '#555', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400, borderBottom: activeTab === tab.key ? '2px solid #E74C3C' : '2px solid transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <span style={{ fontSize: 10, background: activeTab === tab.key ? '#E74C3C22' : '#222', color: activeTab === tab.key ? '#E74C3C' : '#444', padding: '1px 5px', borderRadius: 8 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <span style={{ fontSize: 10, color: '#333' }}>{lastUpdated ? `${lastUpdated} 갱신` : ''}</span>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 12px' }}>
        {loading ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>데이터 불러오는 중...</div>
        ) : activeTab === 'home' ? (
          <HomeTab data={data} events={events} onTabChange={tab => setActiveTab(tab as any)} />
        ) : currentList.length === 0 ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
            {activeTab === 'event' ? '현재 진행 중인 합방·이벤트가 없습니다' : '방송 중인 스트리머가 없습니다'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: '#333', marginBottom: 10 }}>
              총 {currentList.reduce((s, c) => s + c.streams.length, 0)}명 방송 중 · {currentList.length}개 카테고리
            </div>
            {currentList.map((cat, i) => (
              <ServerSection key={cat.id} cat={cat} index={i} />
            ))}
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #161616', padding: '12px 16px', textAlign: 'center', color: '#2a2a2a', fontSize: 10 }}>
        숲 · 치지직 데이터를 60초마다 자동으로 수집합니다
      </footer>

      <style>{`
        @media (max-width: 600px) {
          .desktop-time { display: none !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </main>
  )
}
