// app/api/history/route.ts
import { supabase } from '@/lib/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 履歴を全件取得する (GET)
export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false }); // 新しいものが上に来るように

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 新しい履歴を保存する (POST)
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('analysis_history')
    .insert([
      {
        title: body.title,
        score: body.score,
        issues: body.issues,
        summary: body.summary,
        user_rating: body.user_rating,
        human_issue_count: body.human_issue_count,
        raw_output: body.raw_output,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}