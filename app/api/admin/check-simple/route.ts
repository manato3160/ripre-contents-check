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
    
    console.log('Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        isAdmin: false, 
        error: 'No session or email',
        debug: { session: !!session }
      }, { status: 401 })
    }

    // 直接SQLクエリで管理者権限をチェック（RLS無効化後）
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_email', session.user.email)

    console.log('Admin check result:', {
      userEmail: session.user.email,
      data,
      error,
      isAdmin: data && data.length > 0 ? data[0].is_admin : false
    })

    if (error) {
      console.error('Admin check error:', error)
      return NextResponse.json({ 
        isAdmin: false, 
        error: error.message,
        code: error.code,
        userEmail: session.user.email
      })
    }

    const isAdmin = data && data.length > 0 ? data[0].is_admin : false

    return NextResponse.json({ 
      isAdmin,
      userEmail: session.user.email,
      userData: data,
      debug: {
        dataLength: data?.length,
        firstRecord: data?.[0]
      }
    })
  } catch (error) {
    console.error('Admin check API error:', error)
    return NextResponse.json({ 
      isAdmin: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}