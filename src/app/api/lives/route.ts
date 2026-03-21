import { getLivesByCategory } from '@/lib/streams'
import { NextResponse } from 'next/server'

// 동적 라우트로 명시 (빌드 타임 정적 생성 방지)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const categories = await getLivesByCategory()
    return NextResponse.json(categories)
  } catch (e) {
    console.error('API 오류:', e)
    return NextResponse.json([], { status: 500 })
  }
}
