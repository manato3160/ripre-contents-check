import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session: session ? {
        user: {
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image
        }
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({ error: 'セッション情報の取得に失敗しました' }, { status: 500 })
  }
}