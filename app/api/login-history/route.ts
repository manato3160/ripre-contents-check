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
    const { error: loginError } = await supabase
      .from('login_history')
      .insert({
        user_email: session.user.email,
        user_name: session.user.name,
        user_agent: userAgent,
        ip_address: ipAddress
      })

    if (loginError) {
      console.error('Login history insert error:', loginError)
    }

    // 既存のユーザー情報をチェック
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('is_admin')
      .eq('user_email', session.user.email)
      .single()

    // 新規ユーザーの場合のみ追加（既存ユーザーの権限は保持）
    if (checkError && checkError.code === 'PGRST116') {
      // ユーザーが存在しない場合のみ新規作成
      console.log('Creating new user:', session.user.email)
      const { error: userError } = await supabase
        .from('admin_users')
        .insert({
          user_email: session.user.email,
          user_name: session.user.name || 'Unknown',
          is_admin: false // デフォルトは一般ユーザー
        })

      if (userError) {
        console.error('User info insert error:', userError)
      } else {
        console.log('New user created successfully')
      }
    } else if (!checkError) {
      // 既存ユーザーの場合は名前のみ更新（権限は保持）
      console.log('Updating existing user name:', session.user.email, 'is_admin:', existingUser?.is_admin)
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          user_name: session.user.name || 'Unknown',
          updated_at: new Date().toISOString()
        })
        .eq('user_email', session.user.email)

      if (updateError) {
        console.error('User info update error:', updateError)
      } else {
        console.log('User name updated successfully, admin status preserved')
      }
    } else {
      console.error('Unexpected error checking user:', checkError)
    }

    if (userError) {
      console.error('User info upsert error:', userError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login history API error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}