import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any[] = []

  try {
    // ─── 1. 미처리 후보 가져오기 ───
    const { data: candidates } = await supabase
      .from('event_candidates')
      .select('*')
      .eq('processed', false)
      .gte('count', 3)
      .order('count', { ascending: false })
      .limit(5)

    if (candidates && candidates.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY

      for (const candidate of candidates) {
        try {
          if (geminiKey) {
            // ─── 2. Gemini로 이벤트 여부 분석 ───
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `한국 스트리밍 플랫폼(치지직, 숲) 이벤트 분석가입니다.

키워드: "${candidate.keyword}"
게임: "${candidate.game || '미상'}"
방송 제목 예시: ${JSON.stringify(candidate.sample_titles)}
동시 사용 인원: ${candidate.count}명

분석 기준:
- 이 키워드가 여러 스트리머가 함께하는 대규모 합방/서버/이벤트를 가리키는가?
- 단순 게임 이름, 일반 명사, 방송 제목의 흔한 단어가 아닌가?
- 3명 이상이 동시에 같은 맥락으로 쓰는 고유 이벤트명인가?

JSON만 출력 (다른 텍스트 없이):
이벤트라면: {"is_event": true, "name": "이벤트 정식명칭", "game": "게임명", "keywords": ["키워드1", "오타변형", "초성약어"]}
아니라면: {"is_event": false, "reason": "이유 한줄"}`
                    }]
                  }],
                  generationConfig: { temperature: 0.1 }
                })
              }
            )

            const geminiData = await geminiRes.json()
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
            const cleaned = text.replace(/```json|```/g, '').trim()

            let parsed: any = {}
            try { parsed = JSON.parse(cleaned) } catch { parsed = { is_event: false } }

            if (parsed.is_event && parsed.name) {
              // ─── 3. 이벤트로 판별 → Supabase 등록 ───
              // 중복 체크
              const { data: existing } = await supabase
                .from('events')
                .select('id')
                .eq('name', parsed.name)
                .single()

              if (!existing) {
                await supabase.from('events').insert({
                  name: parsed.name,
                  game: parsed.game || candidate.game || null,
                  keywords: parsed.keywords || [candidate.keyword],
                  is_active: true,
                  auto_detected: true,
                  last_matched_at: new Date().toISOString(),
                })
                results.push({ action: 'registered', name: parsed.name, keyword: candidate.keyword })
              }
            } else {
              results.push({ action: 'rejected', keyword: candidate.keyword, reason: parsed.reason })
            }
          }

          // ─── 4. 후보 처리 완료 표시 ───
          await supabase
            .from('event_candidates')
            .update({ processed: true })
            .eq('id', candidate.id)

        } catch (e) {
          console.error('후보 처리 오류:', candidate.keyword, e)
        }
      }
    }

    // ─── 5. 오래된 데이터 정리 (Supabase 함수 호출) ───
    await supabase.rpc('cleanup_old_data')

    // ─── 6. 종료된 이벤트 감지 ───
    // 7일간 매칭 0회인 자동감지 이벤트 비활성화
    const { data: staleEvents } = await supabase
      .from('events')
      .select('id, name, last_matched_at')
      .eq('is_active', true)
      .eq('auto_detected', true)
      .lt('last_matched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (staleEvents && staleEvents.length > 0) {
      for (const event of staleEvents) {
        await supabase
          .from('events')
          .update({ is_active: false })
          .eq('id', event.id)
        results.push({ action: 'deactivated', name: event.name })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('Cron 오류:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
