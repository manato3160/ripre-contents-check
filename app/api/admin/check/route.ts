import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // 管理者権限チェック
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_admin')
      .eq('user_email', session.user.email)
      .single()

    if (error) {
      console.error('Admin check error:', error)
      // テーブルが存在しない場合やその他のエラーの場合は false を返す
      return NextResponse.json({ 
        isAdmin: false, 
        error: error.message,
        needsSetup: error.code === 'PGRST116' // テーブルが存在しない
      })
    }

    return NextResponse.json({ isAdmin: data?.is_admin || false })
  } catch (error) {
    console.error('Admin check API error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}