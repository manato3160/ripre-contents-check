-- デバッグ用: テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'login_history', 'analysis_history');

-- admin_usersテーブルの構造確認
\d admin_users;

-- 既存のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- RLSの状態確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';

-- 一時的にRLSを完全に無効化（テスト用）
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_history DISABLE ROW LEVEL SECURITY;

-- 既存のデータ確認
SELECT * FROM admin_users;

-- テストデータの挿入
INSERT INTO admin_users (user_email, user_name, is_admin) 
VALUES ('test@example.com', 'テストユーザー', true)
ON CONFLICT (user_email) DO UPDATE SET is_admin = true;

-- 確認
SELECT * FROM admin_users;