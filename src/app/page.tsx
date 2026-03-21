'use client'

import { useEffect, useState } from 'react'

// ─── 타입 ───
interface Stream {
  id: string | number
  platform: 'chzzk' | 'soop'
  streamer: string
  title: string
  viewers: number
  thumbnail?: string
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

function formatViewers(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return count.toString()
}

// ─── 아코디언 섹션 ───
function ServerSection({ cat, index }: { cat: Category; index: number }) {
  const [open, setOpen] = useState(index < 3) // 상위 3개는 기본 열림

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* 헤더 (클릭으로 열고 닫기) */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#fff',
          textAlign: 'left',
        }}
      >
        {/* 순위 */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#2a2a2a',
          color: index < 3 ? '#000' : '#888',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {index + 1}
        </div>

        {/* 서버명 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{cat.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>
              👁 {formatViewers(cat.totalViewers)}명 시청 중
            </span>
            <span style={{ fontSize: 13, color: '#666' }}>·</span>
            <span style={{ fontSize: 13, color: '#aaa' }}>
              🎙 {cat.streams.length}명 방송 중
            </span>
            {cat.chzzkCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: '#03C75A22', color: '#03C75A',
                border: '1px solid #03C75A44',
                padding: '1px 7px', borderRadius: 20,
              }}>
                치지직 {cat.chzzkCount}
              </span>
            )}
            {cat.soopCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: '#00BFFF22', color: '#00BFFF',
                border: '1px solid #00BFFF44',
                padding: '1px 7px', borderRadius: 20,
              }}>
                숲 {cat.soopCount}
              </span>
            )}
          </div>
        </div>

        {/* 화살표 */}
        <div style={{
          fontSize: 18, color: '#555', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▾
        </div>
      </button>

      {/* 스트리머 목록 (아코디언 내용) */}
      {open && (
        <div style={{
          borderTop: '1px solid #2a2a2a',
          padding: '12px 16px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {cat.streams.slice(0, 20).map((stream, i) => (
            <a
              key={stream.id}
              href={stream.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: '#222',
                border: '1px solid #333',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {/* 썸네일 */}
                <div style={{
                  position: 'relative', aspectRatio: '16/9',
                  background: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {stream.thumbnail ? (
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                    />
                  ) : stream.profileImage ? (
                    <img
                      src={stream.profileImage}
                      alt={stream.streamer}
                      style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: 28, opacity: 0.15 }}>📺</div>
                  )}

                  {/* 플랫폼 뱃지 */}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 3,
                  }}>
                    {stream.platform === 'chzzk' ? '치지직' : '숲'}
                  </div>

                  {/* 시청자 수 */}
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,0.8)',
                    fontSize: 11, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 3,
                  }}>
                    👁 {formatViewers(stream.viewers)}
                  </div>

                  {/* 카테고리 내 순위 메달 */}
                  {i < 3 && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      background: ['#FFD700', '#C0C0C0', '#CD7F32'][i],
                      color: '#000', fontSize: 10, fontWeight: 700,
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </div>
                  )}
                </div>

                {/* 스트리머 정보 */}
                <div style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {stream.profileImage && (
                    <img
                      src={stream.profileImage}
                      alt={stream.streamer}
                      style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stream.streamer}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {stream.title}
                    </div>
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

// ─── 메인 페이지 (클라이언트) ───
export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  async function fetchData() {
    try {
      const res = await fetch('/api/lives')
      const data = await res.json()
      setCategories(data)
      setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 60000) // 60초마다 갱신
    return () => clearInterval(timer)
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <header style={{
        background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🎮 뭐켜</div>
        <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
          {lastUpdated ? `${lastUpdated} 기준` : '로딩 중...'}
        </div>
        <button
          onClick={fetchData}
          style={{
            background: '#2a2a2a', border: '1px solid #444',
            color: '#aaa', fontSize: 12, padding: '4px 12px',
            borderRadius: 20, cursor: 'pointer',
          }}
        >
          🔄 새로고침
        </button>
      </header>

      {/* 본문 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '80px 0', fontSize: 14 }}>
            데이터 불러오는 중...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '80px 0', fontSize: 14 }}>
            현재 방송 중인 스트리머가 없습니다
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
              총 {categories.reduce((s, c) => s + c.streams.length, 0)}명 방송 중 · {categories.length}개 카테고리
            </div>
            {categories.map((cat, i) => (
              <ServerSection key={cat.id} cat={cat} index={i} />
            ))}
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '16px 24px', textAlign: 'center', color: '#444', fontSize: 11 }}>
        숲 · 치지직 데이터를 60초마다 자동으로 수집합니다
      </footer>
    </main>
  )
}
