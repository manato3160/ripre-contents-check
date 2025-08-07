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

// GET: ユーザー一覧取得
export async function GET(request: NextRequest) {
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

    // 管理者ユーザーの取得（メインソース）
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .order('updated_at', { ascending: false })

    if (adminError) {
      console.error('Admin users fetch error:', adminError)
      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
    }

    // レポート数を取得（analysis_historyから）
    const { data: reportCounts, error: reportError } = await supabase
      .from('analysis_history')
      .select('user_email, created_at')
      .order('created_at', { ascending: false })

    if (reportError && reportError.code !== '42P01') {
      console.error('Report counts fetch error:', reportError)
    }

    // レポート数を集計
    const reportCountMap = new Map()
    const lastActivityMap = new Map()
    
    if (reportCounts) {
      reportCounts.forEach((report: any) => {
        const email = report.user_email
        reportCountMap.set(email, (reportCountMap.get(email) || 0) + 1)
        
        if (!lastActivityMap.has(email) || 
            new Date(report.created_at) > new Date(lastActivityMap.get(email))) {
          lastActivityMap.set(email, report.created_at)
        }
      })
    }

    // ユーザー情報をマージ
    const allUsers = adminUsers.map((admin: any) => ({
      email: admin.user_email,
      name: admin.user_name || 'Unknown',
      isAdmin: admin.is_admin,
      lastActivity: lastActivityMap.get(admin.user_email) || admin.updated_at,
      reportCount: reportCountMap.get(admin.user_email) || 0,
      hasAdminRecord: true,
      adminId: admin.id,
      createdAt: admin.created_at
    }))

    return NextResponse.json({
      users: allUsers.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      )
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// POST: ユーザーの管理者権限を更新
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

    const { userEmail, userName, isAdminUser } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'ユーザーメールが必要です' }, { status: 400 })
    }

    // 自分自身の権限を削除することを防ぐ
    if (userEmail === session.user.email && !isAdminUser) {
      return NextResponse.json({ error: '自分自身の管理者権限を削除することはできません' }, { status: 400 })
    }

    // ユーザーの管理者権限を更新
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        user_email: userEmail,
        user_name: userName || 'Unknown',
        is_admin: isAdminUser
      }, {
        onConflict: 'user_email'
      })
      .select()

    if (error) {
      console.error('User update error:', error)
      return NextResponse.json({ error: 'ユーザー権限の更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${userEmail} の権限を更新しました`,
      data 
    })
  } catch (error) {
    console.error('User update API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

// DELETE: ユーザーの管理者権限を削除
export async function DELETE(request: NextRequest) {
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

    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'ユーザーメールが必要です' }, { status: 400 })
    }

    // 自分自身を削除することを防ぐ
    if (userEmail === session.user.email) {
      return NextResponse.json({ error: '自分自身を削除することはできません' }, { status: 400 })
    }

    // ユーザーを削除
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_email', userEmail)

    if (error) {
      console.error('User delete error:', error)
      return NextResponse.json({ error: 'ユーザーの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${userEmail} を削除しました`
    })
  } catch (error) {
    console.error('User delete API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}