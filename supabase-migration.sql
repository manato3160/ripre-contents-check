-- 既存のanalysis_historyテーブルにuser_emailとuser_nameカラムを追加
ALTER TABLE analysis_history 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_email ON analysis_history(user_email);

-- 既存データに一時的なユーザー情報を設定（必要に応じて）
-- UPDATE analysis_history SET user_email = 'temp@example.com' WHERE user_email IS NULL;