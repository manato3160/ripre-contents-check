import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
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
      // テーブルが存在しない場合は false を返す
      return false
    }

    return data?.is_admin || false
  } catch (error) {
    console.error('Admin permission check exception:', error)
    return false
  }
}

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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'users':
        return await getUserAnalytics()
      case 'reports':
        return await getReportAnalytics()
      case 'login':
        return await getLoginAnalytics()
      case 'usage':
        return await getUsageAnalytics()
      default:
        return await getAllAnalytics()
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

async function getUserAnalytics() {
  // ユーザー統計
  const { data: userStats, error: userError } = await supabase
    .from('analysis_history')
    .select('user_email, user_name, created_at')
    .order('created_at', { ascending: false })

  if (userError) {
    console.error('User analytics error:', userError)
    // データが存在しない場合は空のデータを返す
    if (userError.code === '42P01') {
      return NextResponse.json({
        totalUsers: 0,
        userReportCounts: []
      })
    }
    throw new Error(`ユーザー統計の取得に失敗しました: ${userError.message}`)
  }

  // ユーザーごとのレポート数
  const userReportCounts = userStats.reduce((acc: any, item: any) => {
    const email = item.user_email
    if (!acc[email]) {
      acc[email] = {
        email,
        name: item.user_name || 'Unknown',
        count: 0,
        lastActivity: item.created_at
      }
    }
    acc[email].count++
    // より新しい名前で更新（最新の名前を保持）
    if (item.user_name && item.user_name !== 'Unknown') {
      acc[email].name = item.user_name
    }
    if (new Date(item.created_at) > new Date(acc[email].lastActivity)) {
      acc[email].lastActivity = item.created_at
    }
    return acc
  }, {})

  return NextResponse.json({
    totalUsers: Object.keys(userReportCounts).length,
    userReportCounts: Object.values(userReportCounts)
  })
}

async function getReportAnalytics() {
  // 日別レポート数
  const { data: dailyReports, error: dailyError } = await supabase
    .from('analysis_history')
    .select('created_at, score')
    .order('created_at', { ascending: false })

  if (dailyError) {
    console.error('Report analytics error:', dailyError)
    if (dailyError.code === '42P01') {
      return NextResponse.json({
        totalReports: 0,
        dailyReports: []
      })
    }
    throw new Error(`レポート統計の取得に失敗しました: ${dailyError.message}`)
  }

  // 日別集計
  const dailyCounts = dailyReports.reduce((acc: any, item: any) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, count: 0, totalScore: 0, avgScore: 0 }
    }
    acc[date].count++
    acc[date].totalScore += item.score
    acc[date].avgScore = Math.round(acc[date].totalScore / acc[date].count)
    return acc
  }, {})

  return NextResponse.json({
    totalReports: dailyReports.length,
    dailyReports: Object.values(dailyCounts).slice(0, 30) // 直近30日
  })
}

async function getLoginAnalytics() {
  // ログイン履歴
  const { data: loginHistory, error: loginError } = await supabase
    .from('login_history')
    .select('user_email, user_name, login_at')
    .order('login_at', { ascending: false })
    .limit(1000)

  if (loginError) {
    console.error('Login analytics error:', loginError)
    if (loginError.code === '42P01') {
      return NextResponse.json({
        totalLogins: 0,
        dailyLogins: []
      })
    }
    throw new Error(`ログイン統計の取得に失敗しました: ${loginError.message}`)
  }

  // 日別ログイン数
  const dailyLogins = loginHistory.reduce((acc: any, item: any) => {
    const date = new Date(item.login_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, count: 0, uniqueUsers: new Set() }
    }
    acc[date].count++
    acc[date].uniqueUsers.add(item.user_email)
    return acc
  }, {})

  // Set を配列に変換
  const processedDailyLogins = Object.values(dailyLogins).map((item: any) => ({
    date: item.date,
    count: item.count,
    uniqueUsers: item.uniqueUsers.size
  })).slice(0, 30)

  return NextResponse.json({
    totalLogins: loginHistory.length,
    dailyLogins: processedDailyLogins
  })
}

async function getUsageAnalytics() {
  // 審査機能使用統計
  const { data: usageStats, error: usageError } = await supabase
    .from('analysis_history')
    .select('user_email, user_name, created_at, score, user_rating')
    .order('created_at', { ascending: false })

  if (usageError) {
    console.error('Usage analytics error:', usageError)
    if (usageError.code === '42P01') {
      return NextResponse.json({
        totalUsage: 0,
        userUsage: []
      })
    }
    throw new Error(`使用統計の取得に失敗しました: ${usageError.message}`)
  }

  // ユーザー別使用回数
  const userUsage = usageStats.reduce((acc: any, item: any) => {
    const email = item.user_email
    if (!acc[email]) {
      acc[email] = {
        email,
        name: item.user_name || 'Unknown',
        totalUsage: 0,
        avgScore: 0,
        totalScore: 0,
        ratedCount: 0
      }
    }
    acc[email].totalUsage++
    acc[email].totalScore += item.score
    acc[email].avgScore = Math.round(acc[email].totalScore / acc[email].totalUsage)
    if (item.user_rating) {
      acc[email].ratedCount++
    }
    return acc
  }, {})

  return NextResponse.json({
    totalUsage: usageStats.length,
    userUsage: Object.values(userUsage)
  })
}

async function getAllAnalytics() {
  try {
    const [users, reports, logins, usage] = await Promise.all([
      getUserAnalytics().then(res => res.json()).catch(err => ({ totalUsers: 0, userReportCounts: [] })),
      getReportAnalytics().then(res => res.json()).catch(err => ({ totalReports: 0, dailyReports: [] })),
      getLoginAnalytics().then(res => res.json()).catch(err => ({ totalLogins: 0, dailyLogins: [] })),
      getUsageAnalytics().then(res => res.json()).catch(err => ({ totalUsage: 0, userUsage: [] }))
    ])

    return NextResponse.json({
      users,
      reports,
      logins,
      usage
    })
  } catch (error) {
    console.error('Get all analytics error:', error)
    // フォールバック: 空のデータを返す
    return NextResponse.json({
      users: { totalUsers: 0, userReportCounts: [] },
      reports: { totalReports: 0, dailyReports: [] },
      logins: { totalLogins: 0, dailyLogins: [] },
      usage: { totalUsage: 0, userUsage: [] }
    })
  }
}