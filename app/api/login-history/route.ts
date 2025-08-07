import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwarded?.split(',')[0] || realIp || '127.0.0.1'

    // ログイン履歴を記録
    const { error } = await supabase
      .from('login_history')
      .insert({
        user_email: session.user.email,
        user_name: session.user.name,
        user_agent: userAgent,
        ip_address: ipAddress
      })

    if (error) {
      console.error('Login history insert error:', error)
      // ログイン履歴の記録に失敗してもログイン自体は成功させる
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login history API error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}