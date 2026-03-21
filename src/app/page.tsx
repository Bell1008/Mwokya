'use client'

import { useEffect, useState } from 'react'

interface Stream {
  id: string | number
  platform: 'chzzk' | 'soop'
  streamer: string
  title: string
  viewers: number
  thumbnail?: string | null
  profileImage?: string
  url: string
}

interface Category {
  id: string
  name: string
  streams: Stream[]
  totalViewers: number
  chzzkCount: number
  soopCount: number
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

function ServerSection({ cat, index }: { cat: Category; index: number }) {
  const [open, setOpen] = useState(index < 3)

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, color: '#fff', textAlign: 'left' }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2a2a2a',
          color: index < 3 ? '#000' : '#666',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{cat.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>👁 {formatViewers(cat.totalViewers)}명</span>
            <span style={{ fontSize: 12, color: '#555' }}>·</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>🎙 {cat.streams.length}명</span>
            {cat.chzzkCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#03C75A22', color: '#03C75A', border: '1px solid #03C75A44', padding: '1px 7px', borderRadius: 20 }}>
                치지직 {cat.chzzkCount}
              </span>
            )}
            {cat.soopCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#00BFFF22', color: '#00BFFF', border: '1px solid #00BFFF44', padding: '1px 7px', borderRadius: 20 }}>
                숲 {cat.soopCount}
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: 16, color: '#444', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #222', padding: '12px 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {cat.streams.slice(0, 20).map((stream, i) => (
            <a key={stream.id} href={stream.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stream.thumbnail ? (
                    <img src={stream.thumbnail} alt={stream.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                  ) : stream.profileImage ? (
                    <img src={stream.profileImage} alt={stream.streamer} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: 24, opacity: 0.15 }}>📺</div>
                  )}
                  <div style={{ position: 'absolute', top: 5, left: 5, background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
                    {stream.platform === 'chzzk' ? '치지직' : '숲'}
                  </div>
                  <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.8)', fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>
                    👁 {formatViewers(stream.viewers)}
                  </div>
                  {i < 3 && (
                    <div style={{ position: 'absolute', top: 5, right: 5, background: ['#FFD700', '#C0C0C0', '#CD7F32'][i], color: '#000', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </div>
                  )}
                </div>
                <div style={{ padding: '7px 9px', display: 'flex', gap: 7, alignItems: 'center' }}>
                  {stream.profileImage && (
                    <img src={stream.profileImage} alt={stream.streamer} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
                  )}
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

export default function Home() {
  const [data, setData] = useState<Data>({ game: [], event: [] })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'game' | 'event'>('game')

  async function fetchData() {
    try {
      const res = await fetch('/api/lives')
      const json = await res.json()
      setData(json)
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

  const currentList = activeTab === 'game' ? data.game : data.event
  const totalStreams = currentList.reduce((s, c) => s + c.streams.length, 0)

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #222', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>🎮 뭐켜</div>
        <div style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>
          {lastUpdated ? `${lastUpdated} 기준` : '로딩 중...'}
        </div>
        <button onClick={fetchData} style={{ background: '#2a2a2a', border: '1px solid #333', color: '#888', fontSize: 11, padding: '4px 10px', borderRadius: 16, cursor: 'pointer' }}>
          🔄 새로고침
        </button>
      </header>

      {/* 탭 */}
      <div style={{ background: '#141414', borderBottom: '1px solid #222', padding: '0 20px', display: 'flex', gap: 0 }}>
        {[
          { key: 'game', label: '게임 카테고리', count: data.game.reduce((s, c) => s + c.streams.length, 0) },
          { key: 'event', label: '대규모·합방·서버·이벤트', count: data.event.reduce((s, c) => s + c.streams.length, 0) },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'game' | 'event')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 16px',
              color: activeTab === tab.key ? '#fff' : '#555',
              fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
              borderBottom: activeTab === tab.key ? '2px solid #E74C3C' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.label}
            <span style={{ fontSize: 11, background: activeTab === tab.key ? '#E74C3C22' : '#2a2a2a', color: activeTab === tab.key ? '#E74C3C' : '#444', padding: '1px 6px', borderRadius: 10 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 14px' }}>
        {loading ? (
          <div style={{ color: '#444', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>데이터 불러오는 중...</div>
        ) : currentList.length === 0 ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '60px 0', fontSize: 13 }}>
            {activeTab === 'event' ? '현재 진행 중인 합방·이벤트가 없습니다' : '방송 중인 스트리머가 없습니다'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>
              총 {totalStreams}명 방송 중 · {currentList.length}개 카테고리
            </div>
            {currentList.map((cat, i) => (
              <ServerSection key={cat.id} cat={cat} index={i} />
            ))}
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #161616', padding: '14px 20px', textAlign: 'center', color: '#333', fontSize: 11 }}>
        숲 · 치지직 데이터를 60초마다 자동으로 수집합니다
      </footer>
    </main>
  )
}
