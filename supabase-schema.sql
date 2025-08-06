-- analysis_history テーブルの作成
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  title TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  issues JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  user_rating VARCHAR(10),
  human_issue_count INTEGER,
  raw_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_email ON analysis_history(user_email);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at DESC);

-- RLS (Row Level Security) の有効化
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY IF NOT EXISTS "Users can only access their own data" ON analysis_history
  FOR ALL USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');