import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('History GET request received');
    
    // セッション情報を取得
    const session = await getServerSession(authOptions)
    console.log('Session in history API:', session);
    
    // 一時的に認証チェックを無効化して、全ての履歴を取得
    console.log('Fetching all history data (temporary)');

    // 全ての履歴データを取得（一時的）
    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'データベースエラー', details: error.message }, { status: 500 })
    }

    console.log('Raw data from Supabase:', data);

    // データが存在しない場合は空配列を返す
    if (!data || data.length === 0) {
      console.log('No data found');
      return NextResponse.json([])
    }

    // Supabaseのデータを適切な形式に変換
    const formattedData = data.map((item: any) => ({
      id: String(item.id), // 確実に文字列として扱う
      created_at: item.created_at,
      title: item.title,
      score: item.score,
      issues: item.issues || [],
      summary: item.summary,
      user_rating: item.user_rating,
      human_issue_count: item.human_issue_count,
      raw_output: item.raw_output,
      user_email: item.user_email,
      user_name: item.user_name,
      user_image: item.user_image,
    }))

    console.log('Formatted data:', formattedData);
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // セッション情報を取得
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    
    // Supabaseに新しい履歴データを保存（ユーザー情報を含む）
    const { data, error } = await supabase
      .from('analysis_history')
      .insert([{
        user_email: session.user.email,
        user_name: session.user.name,
        user_image: session.user.image,
        title: body.title,
        score: body.score,
        issues: body.issues,
        summary: body.summary,
        user_rating: body.user_rating,
        human_issue_count: body.human_issue_count,
        raw_output: body.raw_output,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'データの保存に失敗しました' }, { status: 500 })
    }

    // 返すデータのIDも文字列として確実に処理
    const formattedData = data?.map((item: any) => ({
      ...item,
      id: String(item.id)
    }));
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'リクエストの処理に失敗しました' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // セッション情報を取得
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { id, user_rating, human_issue_count, title } = body

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    // 更新するフィールドを動的に構築
    const updateFields: any = {}
    if (user_rating !== undefined) updateFields.user_rating = user_rating
    if (human_issue_count !== undefined) updateFields.human_issue_count = human_issue_count
    if (title !== undefined) updateFields.title = title

    // 更新するフィールドがない場合はエラー
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: '更新するフィールドが指定されていません' }, { status: 400 })
    }

    // ユーザー自身の履歴のみ更新可能
    const { data, error } = await supabase
      .from('analysis_history')
      .update(updateFields)
      .eq('id', id)
      .eq('user_email', session.user.email) // ユーザー認証チェック
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ 
        error: '評価の更新に失敗しました', 
        details: error.message 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '対象の履歴が見つかりません' }, { status: 404 })
    }

    // 返すデータも文字列として確実に処理
    const formattedResponse = {
      ...data,
      id: String(data.id)
    };
    return NextResponse.json(formattedResponse)
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'リクエストの処理に失敗しました' }, { status: 500 })
  }
}

