import { getLivesByCategory } from '@/lib/streams'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  try {
    const categories = await getLivesByCategory()
    return NextResponse.json(categories)
  } catch (e) {
    console.error('API 오류:', e)
    return NextResponse.json([], { status: 500 })
  }
}
