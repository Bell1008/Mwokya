import { getLivesByServer } from '@/lib/streams'
import { formatViewers } from '@/lib/streams'

export const revalidate = 60

export default async function Home() {
  const servers = await getLivesByServer()

  return (
    <main style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <header style={{ background: '#1a1a1a', borderBottom: '1px solid #333', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>🎮 스트리머 서버 트래커</div>
        <div style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
          숲 + 치지직 실시간 통합
        </div>
        <div style={{ fontSize: 12, color: '#555', padding: '4px 10px', border: '1px solid #333', borderRadius: 20 }}>
          60초마다 자동 갱신
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* 핫한 서버 목록 */}
        {servers.map((server) => (
          <section key={server.id} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: server.color, borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{server.name}</h2>
              <div style={{ fontSize: 13, color: '#888' }}>
                총 {formatViewers(server.totalViewers)}명 시청 중 · {server.streams.length}명 방송
              </div>
            </div>

            {server.streams.length === 0 ? (
              <div style={{ color: '#555', fontSize: 14, padding: '20px 0' }}>현재 방송 중인 스트리머 없음</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {server.streams.slice(0, 12).map((stream, i) => (
                  <a
                    key={stream.id}
                    href={stream.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: 10,
                      overflow: 'hidden',
                      transition: 'border-color .15s',
                    }}>
                      {/* 썸네일 */}
                      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#222' }}>
                        {stream.thumbnail && (
                          <img
                            src={stream.thumbnail}
                            alt={stream.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                        {/* 플랫폼 뱃지 */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: stream.platform === 'chzzk' ? '#03C75A' : '#00BFFF',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {stream.platform === 'chzzk' ? '치지직' : '숲'}
                        </div>
                        {/* 시청자 수 */}
                        <div style={{
                          position: 'absolute', bottom: 8, right: 8,
                          background: 'rgba(0,0,0,.75)',
                          fontSize: 12, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          👁 {formatViewers(stream.viewers)}
                        </div>
                        {/* 순위 */}
                        {i < 3 && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8,
                            background: ['#FFD700','#C0C0C0','#CD7F32'][i],
                            color: '#000', fontSize: 11, fontWeight: 700,
                            width: 22, height: 22, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {i + 1}
                          </div>
                        )}
                      </div>

                      {/* 스트리머 정보 */}
                      <div style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {stream.profileImage && (
                          <img
                            src={stream.profileImage}
                            alt={stream.streamer}
                            style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: '#333' }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stream.streamer}
                          </div>
                          <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stream.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 푸터 */}
      <footer style={{ borderTop: '1px solid #222', padding: '16px 24px', textAlign: 'center', color: '#555', fontSize: 12 }}>
        숲 · 치지직 데이터를 60초마다 자동으로 수집합니다. 광고 문의: contact@streamtracker.kr
      </footer>
    </main>
  )
}
