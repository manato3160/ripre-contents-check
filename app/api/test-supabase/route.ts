import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20))

    // 1. 基本的な接続テスト
    const { data: connectionTest, error: connectionError } = await supabase
      .from('analysis_history')
      .select('count', { count: 'exact', head: true })

    console.log('Connection test result:', { connectionTest, connectionError })

    // 2. admin_usersテーブルの存在確認
    const { data: adminTableTest, error: adminTableError } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true })

    console.log('Admin table test result:', { adminTableTest, adminTableError })

    // 3. テーブル一覧の取得をスキップ
    const tables = null
    const tablesError = { message: 'Skipped table listing' }

    console.log('Tables test result:', { tables, tablesError })

    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError?.message,
          data: connectionTest
        },
        adminTable: {
          success: !adminTableError,
          error: adminTableError?.message,
          code: adminTableError?.code,
          data: adminTableTest
        },
        tables: {
          success: !tablesError,
          error: tablesError?.message,
          data: tables
        }
      },
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
      }
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}