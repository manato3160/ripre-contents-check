import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
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

    const { email } = await request.json()
    const targetEmail = email || session.user.email

    // 管理者ユーザーを追加
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        user_email: targetEmail,
        user_name: session.user.name || 'システム管理者',
        is_admin: true
      }, {
        onConflict: 'user_email'
      })
      .select()

    if (error) {
      console.error('Admin setup error:', error)
      return NextResponse.json({ 
        error: 'テーブルが存在しない可能性があります。Supabaseでスキーマを作成してください。',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${targetEmail} を管理者として設定しました`,
      data 
    })
  } catch (error) {
    console.error('Admin setup API error:', error)
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}