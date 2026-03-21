/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'liveimg.sooplive.co.kr' },
      { protocol: 'https', hostname: 'liveimg.afreecatv.com' },
      { protocol: 'https', hostname: 'stimg.sooplive.co.kr' },
      { protocol: 'https', hostname: 'nng-phinf.pstatic.net' },
      { protocol: 'https', hostname: 'livecloud-thumb.akamaized.net' },
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
    ],
  },
}

module.exports = nextConfig
