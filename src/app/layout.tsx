import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '스트리머 서버 트래커 - 숲·치지직 실시간 통합',
  description: '숲(SOOP)과 치지직에서 지금 핫한 게임 서버를 실시간으로 확인하세요. 와우, 마인크래프트, GTA 서버 스트리머 랭킹.',
  keywords: '숲, 치지직, 스트리머, 와우서버, 마인크래프트서버, 실시간랭킹',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
