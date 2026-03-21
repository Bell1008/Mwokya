import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, game, keywords, is_active')
      .eq('is_active', true)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}
