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

    // まず既存の管理者がいるかチェック
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admin_users')
      .select('user_email')
      .eq('is_admin', true)

    console.log('Existing admins check:', { existingAdmins, checkError })

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
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: `データベースエラー: ${error.message}`,
        code: error.code,
        details: error.details,
        hint: error.hint
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