-- 一時的にRLSを無効化（管理者設定後に再度有効化してください）
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 管理者設定後に以下を実行してRLSを再度有効化
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;