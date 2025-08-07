import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 管理者権限チェック
async function checkAdminPermission(userEmail: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_admin')
      .eq('user_email', userEmail)
      .single()

    if (error) {
      console.error('Admin permission check error:', error)
      return false
    }

    return data?.is_admin || false
  } catch (error) {
    console.error('Admin permission check exception:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const isAdmin = await checkAdminPermission(session.user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // analysis_historyから全ユーザーを取得
    const { data: historyUsers, error: historyError } = await supabase
      .from('analysis_history')
      .select('user_email, user_name')
      .order('created_at', { ascending: false })

    if (historyError && historyError.code !== '42P01') {
      console.error('History users fetch error:', historyError)
      return NextResponse.json({ error: 'ユーザー履歴の取得に失敗しました' }, { status: 500 })
    }

    let syncedCount = 0
    const errors = []

    if (historyUsers && historyUsers.length > 0) {
      // ユニークなユーザーを抽出
      const uniqueUsers = new Map()
      historyUsers.forEach((user: any) => {
        if (!uniqueUsers.has(user.user_email)) {
          uniqueUsers.set(user.user_email, {
            user_email: user.user_email,
            user_name: user.user_name || 'Unknown'
          })
        }
      })

      // 各ユーザーをadmin_usersテーブルに同期
      for (const user of uniqueUsers.values()) {
        try {
          // 既存ユーザーをチェック
          const { data: existingUser, error: checkError } = await supabase
            .from('admin_users')
            .select('is_admin')
            .eq('user_email', user.user_email)
            .single()

          if (checkError && checkError.code === 'PGRST116') {
            // 新規ユーザーの場合のみ追加
            const { error } = await supabase
              .from('admin_users')
              .insert({
                user_email: user.user_email,
                user_name: user.user_name,
                is_admin: false // デフォルトは一般ユーザー
              })

            if (error) {
              errors.push(`${user.user_email}: ${error.message}`)
            } else {
              syncedCount++
            }
          } else if (!checkError) {
            // 既存ユーザーの場合は名前のみ更新（権限は保持）
            const { error } = await supabase
              .from('admin_users')
              .update({
                user_name: user.user_name,
                updated_at: new Date().toISOString()
              })
              .eq('user_email', user.user_email)

            if (error) {
              errors.push(`${user.user_email}: ${error.message}`)
            } else {
              syncedCount++
            }
          }
        } catch (error) {
          errors.push(`${user.user_email}: ${error}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount}人のユーザーを同期しました`,
      syncedCount,
      errors: errors.length > 0 ? errors : null
    })
  } catch (error) {
    console.error('User sync API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}