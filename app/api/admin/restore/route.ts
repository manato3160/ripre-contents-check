import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 緊急時の管理者権限復旧API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    console.log('Admin restore request from:', session.user.email)

    // 特定のメールアドレスのみ管理者権限を復旧可能
    const allowedEmails = [
      'sakamoto_manato@socialbase.co.jp',
      'admin@example.com'
    ]

    if (!allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ 
        error: '権限がありません。許可されたメールアドレスではありません。' 
      }, { status: 403 })
    }

    // 管理者権限を強制的に復旧
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        user_email: session.user.email,
        user_name: session.user.name || 'システム管理者',
        is_admin: true
      }, {
        onConflict: 'user_email'
      })
      .select()

    if (error) {
      console.error('Admin restore error:', error)
      return NextResponse.json({ 
        error: '管理者権限の復旧に失敗しました',
        details: error.message 
      }, { status: 500 })
    }

    console.log('Admin restored successfully:', data)

    return NextResponse.json({ 
      success: true, 
      message: `${session.user.email} の管理者権限を復旧しました`,
      data 
    })
  } catch (error) {
    console.error('Admin restore API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}