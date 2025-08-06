-- analysis_historyテーブルにuser_imageカラムを追加
ALTER TABLE analysis_history 
ADD COLUMN IF NOT EXISTS user_image VARCHAR(500);

-- インデックスの作成（必要に応じて）
-- CREATE INDEX IF NOT EXISTS idx_analysis_history_user_image ON analysis_history(user_image);