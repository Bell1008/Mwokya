'use client'

import { useEffect, useState } from 'react'

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

interface Announcement {
  id: string
  name: string
  game: string | null
  status: 'upcoming' | 'active' | 'ended'
  open_date: string | null
  description: string | null
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

// ─── 검색창 ───
function SearchBar({ data, onClose }: { data: Data; onClose: () => void }) {
  const [query, setQuery] = useState('')

  const allStreams = [
    ...data.game.flatMap(c => c.streams),
    ...data.event.flatMap(c => c.streams),
  ]
  const uniqueStreams = Array.from(new Map(allStreams.map(s => [s.id, s])).values())

  const allCategories = [
    ...data.game.map(c => ({ ...c, type: '게임' })),
    ...data.event.map(c => ({ ...c, type: '이벤트' })),
  ]

  const q = query.trim().toLowerCase()
  const filteredStreams = q ? uniqueStreams.filter(s =>
    s.streamer.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
  ).slice(0, 8) : []

  const filteredCategories = q ? allCategories.filter(c =>
    c.name.toLowerCase().includes(q)
  ).slice(0, 4) : []

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#222', border: '1px solid #333', borderRadius: 8, padding: '6px 12px', gap: 8 }}>
        <span style={{ fontSize: 14, opacity: 0.4 }}>🔍</span>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="스트리머, 게임, 이벤트 검색..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13 }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>✕</button>
        )}
      </div>

      {q && (filteredStreams.length > 0 || filteredCategories.length > 0) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, marginTop: 4, zIndex: 200, overflow: 'hidden' }}>
          {filteredCategories.length > 0 && (
            <div>
              <div style={{ padding: '8px 12px 4px', fontSize: 11, color: '#555' }}>카테고리</div>
              {filteredCategories.map(cat => (
                <div key={cat.id} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: '1px solid #222' }}
                  onClick={onClose}>
                  <span style={{ fontSize: 11, background: cat.type === '게임' ? '#333' : '#2a1a3a', color: cat.type === '게임' ? '#888' : '#a78bfa', padding: '1px 6px', borderRadius: 4 }}>{cat.type}</span>
                  <span style={{ fontSize: 13, color: '#ddd' }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>{cat.streams.length}명 방송중</span>
                </div>
              ))}
            </div>
          )}
          {filteredStreams.length > 0 && (
            <div>
              <div style={{ padding: '8px 12px 4px', fontSize: 11, color: '#555' }}>스트리머</div>
              {filteredStreams.map(stream => (
                <a key={stream.id} href={stream.url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #1a1a1a' }}>
                  {stream.profileImage
                    ? <img src={stream.profileImage} alt={stream.streamer} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333' }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#ddd', fontWeight: 600 }}>{stream.streamer}</div>
                    <div style={{ fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stream.title}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontSize: 10, background: stream.platform === 'chzzk' ? '#03C75A22' : '#00BFFF22', color: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF', padding: '1px 5px', borderRadius: 3 }}>
                      {stream.platform === 'chzzk' ? '치지직' : '숲'}
                    </span>
                    <span style={{ fontSize: 11, color: '#888' }}>👁 {formatViewers(stream.viewers)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HOT 포디움 ───
function HotPodium({ streams }: { streams: Stream[] }) {
  if (streams.length === 0) return null
  const top5 = streams.slice(0, 5)
  // 순서: 4위 2위 1위 3위 5위
  const order = [3, 1, 0, 2, 4].filter(i => top5[i])
  const heights = [80, 100, 130, 100, 80]
  const sizes = [100, 120, 160, 120, 100]

  return (
    <div style={{ padding: '20px 16px 0' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12, fontWeight: 600 }}>🔥 실시간 HOT</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
        {order.map((idx, pos) => {
          const stream = top5[idx]
          if (!stream) return null
          const rank = idx + 1
          const height = heights[pos]
          const size = sizes[pos]
          const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#888', '#888']

          return (
            <a key={stream.id} href={stream.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* 프로필 이미지 */}
              <div style={{ position: 'relative' }}>
                {stream.profileImage
                  ? <img src={stream.profileImage} alt={stream.streamer}
                      style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${rankColors[idx]}` }} />
                  : <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: '#333', border: `2px solid ${rankColors[idx]}` }} />
                }
                <div style={{ position: 'absolute', bottom: -4, right: -4, background: rankColors[idx], color: idx < 3 ? '#000' : '#fff', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {rank}
                </div>
              </div>
              {/* 이름 */}
              <div style={{ fontSize: 11, color: '#ddd', fontWeight: 600, maxWidth: size * 0.7, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stream.streamer}
              </div>
              {/* 시청자 수 */}
              <div style={{ fontSize: 10, color: '#888' }}>👁 {formatViewers(stream.viewers)}</div>
              {/* 포디움 받침대 */}
              <div style={{
                width: size * 0.8, height,
                background: idx === 0 ? 'linear-gradient(180deg, #FFD70033, #FFD70011)' :
                            idx === 1 ? 'linear-gradient(180deg, #C0C0C033, #C0C0C011)' :
                            idx === 2 ? 'linear-gradient(180deg, #CD7F3233, #CD7F3211)' : '#1a1a1a',
                border: `1px solid ${rankColors[idx]}33`,
                borderRadius: '4px 4px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                  {stream.platform === 'chzzk' ? '치지직' : '숲'}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ─── 오픈 예정 타임라인 ───
function EventTimeline({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null

  const active = announcements.filter(a => a.status === 'active')
  const upcoming = announcements.filter(a => a.status === 'upcoming')

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12, fontWeight: 600 }}>📅 이벤트 일정</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(a => (
          <div key={a.id} style={{ background: '#1a2a1a', border: '1px solid #03C75A33', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#03C75A', flexShrink: 0, boxShadow: '0 0 6px #03C75A' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.name}</div>
              {a.description && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{a.description}</div>}
            </div>
            <span style={{ fontSize: 11, color: '#03C75A', fontWeight: 700 }}>진행중</span>
          </div>
        ))}
        {upcoming.map(a => (
          <div key={a.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#555', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{a.name}</div>
              {a.description && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{a.description}</div>}
            </div>
            <span style={{ fontSize: 11, color: '#666' }}>{a.open_date ? a.open_date.slice(5).replace('-', '/') : '미정'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 아코디언 섹션 ───
function ServerSection({ cat, index }: { cat: Category; index: number }) {
  const [open, setOpen] = useState(index < 3)

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', textAlign: 'left' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2a2a2a', color: index < 3 ? '#000' : '#666', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{cat.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#aaa' }}>👁 {formatViewers(cat.totalViewers)}명</span>
            <span style={{ fontSize: 11, color: '#444' }}>·</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>🎙 {cat.streams.length}명</span>
            {cat.chzzkCount > 0 && <span style={{ fontSize: 10, background: '#03C75A22', color: '#03C75A', border: '1px solid #03C75A33', padding: '1px 6px', borderRadius: 10 }}>치지직 {cat.chzzkCount}</span>}
            {cat.soopCount > 0 && <span style={{ fontSize: 10, background: '#00BFFF22', color: '#00BFFF', border: '1px solid #00BFFF33', padding: '1px 6px', borderRadius: 10 }}>숲 {cat.soopCount}</span>}
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#444', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #222', padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {cat.streams.slice(0, 20).map((stream, i) => (
            <a key={stream.id} href={stream.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stream.thumbnail
                    ? <img src={stream.thumbnail} alt={stream.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    : stream.profileImage
                      ? <img src={stream.profileImage} alt={stream.streamer} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ fontSize: 20, opacity: 0.1 }}>📺</div>
                  }
                  <div style={{ position: 'absolute', top: 4, left: 4, background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>
                    {stream.platform === 'chzzk' ? '치지직' : '숲'}
                  </div>
                  <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.8)', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>
                    👁 {formatViewers(stream.viewers)}
                  </div>
                  {i < 3 && <div style={{ position: 'absolute', top: 4, right: 4, background: ['#FFD700', '#C0C0C0', '#CD7F32'][i], color: '#000', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>}
                </div>
                <div style={{ padding: '6px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {stream.profileImage && <img src={stream.profileImage} alt={stream.streamer} style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stream.streamer}</div>
                    <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{stream.title}</div>
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'game' | 'event'>('home')
  const [showSearch, setShowSearch] = useState(false)

  async function fetchData() {
    try {
      const [livesRes, annRes] = await Promise.all([
        fetch('/api/lives'),
        fetch('/api/announcements'),
      ])
      const livesData = await livesRes.json()
      setData(livesData)
      if (annRes.ok) {
        const annData = await annRes.json()
        setAnnouncements(annData)
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

  const allStreams = [...data.game.flatMap(c => c.streams), ...data.event.flatMap(c => c.streams)]
  const uniqueStreams = Array.from(new Map(allStreams.map(s => [s.id, s])).values())
    .sort((a, b) => b.viewers - a.viewers)

  const tabs = [
    { key: 'home', label: '홈' },
    { key: 'game', label: '게임 카테고리', count: data.game.reduce((s, c) => s + c.streams.length, 0) },
    { key: 'event', label: '대규모·합방·서버·이벤트', count: data.event.reduce((s, c) => s + c.streams.length, 0) },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <header style={{ background: '#141414', borderBottom: '1px solid #1e1e1e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }} onClick={() => setActiveTab('home')}>🎮 뭐켜</div>

        {/* 검색창 */}
        {showSearch
          ? <SearchBar data={data} onClose={() => setShowSearch(false)} />
          : <button onClick={() => setShowSearch(true)} style={{ flex: 1, maxWidth: 500, background: '#222', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 12px', color: '#555', fontSize: 12, cursor: 'text', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔍</span> 스트리머, 게임, 이벤트 검색...
            </button>
        }

        <div style={{ fontSize: 11, color: '#444', flexShrink: 0, display: showSearch ? 'none' : 'block' }}>
          {lastUpdated ? `${lastUpdated}` : ''}
        </div>
        <button onClick={fetchData} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', fontSize: 11, padding: '4px 10px', borderRadius: 16, cursor: 'pointer', flexShrink: 0, display: showSearch ? 'none' : 'block' }}>
          🔄
        </button>
      </header>

      {/* 탭 */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '0 16px', display: 'flex', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', color: activeTab === tab.key ? '#fff' : '#444', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 400, borderBottom: activeTab === tab.key ? '2px solid #E74C3C' : '2px solid transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <span style={{ fontSize: 10, background: activeTab === tab.key ? '#E74C3C22' : '#1a1a1a', color: activeTab === tab.key ? '#E74C3C' : '#333', padding: '1px 5px', borderRadius: 8 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
        {loading ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>불러오는 중...</div>
        ) : (
          <>
            {/* 홈 탭 */}
            {activeTab === 'home' && (
              <div>
                <HotPodium streams={uniqueStreams} />
                <EventTimeline announcements={announcements} />

                {/* 광고 배너 슬롯 */}
                <div style={{ margin: '0 16px 16px', background: '#1a1a1a', border: '1px dashed #2a2a2a', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#333', fontSize: 12 }}>
                  광고 배너 슬롯 (애드센스 / 스폰서)
                </div>

                {/* 홈에서 게임 카테고리 미리보기 */}
                <div style={{ padding: '0 16px' }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 10, fontWeight: 600 }}>🎮 게임 카테고리</div>
                  {data.game.slice(0, 3).map((cat, i) => (
                    <ServerSection key={cat.id} cat={cat} index={i} />
                  ))}
                  {data.game.length > 3 && (
                    <button onClick={() => setActiveTab('game')} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px', color: '#666', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                      전체 보기 ({data.game.length}개 카테고리) →
                    </button>
                  )}
                </div>

                {/* 홈에서 합방 미리보기 */}
                {data.event.length > 0 && (
                  <div style={{ padding: '16px 16px 0' }}>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 10, fontWeight: 600 }}>⚡ 대규모·합방·서버·이벤트</div>
                    {data.event.slice(0, 2).map((cat, i) => (
                      <ServerSection key={cat.id} cat={cat} index={i} />
                    ))}
                    {data.event.length > 2 && (
                      <button onClick={() => setActiveTab('event')} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px', color: '#666', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                        전체 보기 ({data.event.length}개 이벤트) →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 게임 탭 */}
            {activeTab === 'game' && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: '#444', marginBottom: 10 }}>총 {data.game.reduce((s, c) => s + c.streams.length, 0)}명 방송 중 · {data.game.length}개 카테고리</div>
                {data.game.map((cat, i) => <ServerSection key={cat.id} cat={cat} index={i} />)}
              </div>
            )}

            {/* 합방 탭 */}
            {activeTab === 'event' && (
              <div style={{ padding: '12px 16px' }}>
                {data.event.length === 0
                  ? <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>현재 진행 중인 합방·이벤트가 없습니다</div>
                  : <>
                      <div style={{ fontSize: 12, color: '#444', marginBottom: 10 }}>총 {data.event.reduce((s, c) => s + c.streams.length, 0)}명 방송 중 · {data.event.length}개 이벤트</div>
                      {data.event.map((cat, i) => <ServerSection key={cat.id} cat={cat} index={i} />)}
                    </>
                }
              </div>
            )}
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #141414', padding: '12px 16px', textAlign: 'center', color: '#2a2a2a', fontSize: 11 }}>
        숲 · 치지직 데이터를 60초마다 자동으로 수집합니다
      </footer>
    </main>
  )
}
