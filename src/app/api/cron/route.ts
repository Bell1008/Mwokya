import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Vercel Cron 인증 체크
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 미처리 후보 가져오기 (count 5 이상)
    const { data: candidates } = await supabase
      .from('event_candidates')
      .select('*')
      .eq('processed', false)
      .gte('count', 5)
      .order('count', { ascending: false })
      .limit(5)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ message: '처리할 후보 없음' })
    }

    const geminiKey = process.env.GEMINI_API_KEY
    const googleSearchKey = process.env.GOOGLE_SEARCH_API_KEY
    const googleSearchCx = process.env.GOOGLE_SEARCH_CX

    const results = []

    for (const candidate of candidates) {
      try {
        // 2. Google Custom Search로 이벤트 정보 검색
        let searchContext = ''
        if (googleSearchKey && googleSearchCx) {
          const searchRes = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${googleSearchKey}&cx=${googleSearchCx}&q=${encodeURIComponent(candidate.keyword + ' 스트리머 서버 이벤트 2026')}&num=3`
          )
          const searchData = await searchRes.json()
          const snippets = searchData.items?.map((item: any) => item.snippet).join('\n') || ''
          searchContext = snippets
        }

        // 3. Gemini로 분석
        if (geminiKey) {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `한국 스트리밍 이벤트 분석가입니다. 아래 정보를 분석해주세요.

키워드: "${candidate.keyword}"
사용된 방송 제목 예시: ${candidate.sample_titles.join(', ')}
검색 결과: ${searchContext || '없음'}

이것이 대규모 스트리머 합방 이벤트/서버라면 JSON으로 답하세요:
{
  "is_event": true,
  "name": "이벤트 정식 명칭",
  "game": "게임 이름",
  "keywords": ["키워드1", "키워드2", "오타변형1"]
}

이벤트가 아니라면: {"is_event": false}

JSON만 출력하세요.`
                  }]
                }],
                generationConfig: { temperature: 0.1 }
              })
            }
          )

          const geminiData = await geminiRes.json()
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
          const cleaned = text.replace(/```json|```/g, '').trim()
          const parsed = JSON.parse(cleaned)

          if (parsed.is_event && parsed.name) {
            // 4. Supabase에 자동 등록
            await supabase.from('events').insert({
              name: parsed.name,
              game: parsed.game || null,
              keywords: parsed.keywords || [candidate.keyword],
              is_active: true,
              auto_detected: true,
            })
            results.push({ keyword: candidate.keyword, registered: parsed.name })
          }
        }

        // 5. 후보 처리 완료 표시
        await supabase
          .from('event_candidates')
          .update({ processed: true })
          .eq('id', candidate.id)

      } catch (e) {
        console.error('후보 처리 오류:', candidate.keyword, e)
      }
    }

    // 6. 30일 미사용 이벤트 자동 비활성화
    await supabase
      .from('events')
      .update({ is_active: false })
      .eq('auto_detected', true)
      .lt('last_matched_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({ processed: results })
  } catch (e) {
    console.error('Cron 오류:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
