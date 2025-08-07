-- 1. RLSを一時的に無効化
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DROP POLICY IF EXISTS "Only admins can access admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow initial admin setup" ON admin_users;
DROP POLICY IF EXISTS "Allow admin setup and access" ON admin_users;

-- 3. 管理者を直接設定
INSERT INTO admin_users (user_email, user_name, is_admin) 
VALUES ('sakamoto_manato@socialbase.co.jp', 'システム管理者', true)
ON CONFLICT (user_email) DO UPDATE SET 
  is_admin = true,
  updated_at = NOW();

-- 4. 確認
SELECT * FROM admin_users;

-- 5. 必要に応じてRLSを再度有効化（後で実行）
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;