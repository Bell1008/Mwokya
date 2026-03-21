import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .neq('status', 'ended')
      .order('status', { ascending: true }) // active 먼저
      .order('open_date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e) {
    console.error('announcements 오류:', e)
    return NextResponse.json([])
  }
}
