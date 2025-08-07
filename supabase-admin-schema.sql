-- 管理者権限管理テーブルの作成
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(user_email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_admin ON admin_users(is_admin);

-- RLS (Row Level Security) の有効化
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能
CREATE POLICY IF NOT EXISTS "Only admins can access admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_admin = true
    )
  );

-- ログイン履歴テーブルの作成
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_login_history_user_email ON login_history(user_email);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);

-- RLS (Row Level Security) の有効化
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能
CREATE POLICY IF NOT EXISTS "Only admins can access login_history" ON login_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_admin = true
    )
  );

-- 初期管理者の設定（必要に応じて変更してください）
INSERT INTO admin_users (user_email, user_name, is_admin) 
VALUES ('admin@example.com', 'システム管理者', true)
ON CONFLICT (user_email) DO NOTHING;