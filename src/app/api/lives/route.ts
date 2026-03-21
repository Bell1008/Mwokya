import { getLivesByCategory } from '@/lib/streams'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getLivesByCategory()
    return NextResponse.json(data)
  } catch (e) {
    console.error('API 오류:', e)
    return NextResponse.json({ game: [], event: [] }, { status: 500 })
  }
}
