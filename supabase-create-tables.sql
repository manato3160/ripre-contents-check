-- 管理者権限管理テーブルの作成（RLS無効で作成）
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_admin_users_email ON admin_users(user_email);
CREATE INDEX idx_admin_users_is_admin ON admin_users(is_admin);

-- 管理者を直接設定
INSERT INTO admin_users (user_email, user_name, is_admin) 
VALUES ('sakamoto_manato@socialbase.co.jp', 'システム管理者', true);

-- ログイン履歴テーブルの作成
CREATE TABLE login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- インデックスの作成
CREATE INDEX idx_login_history_user_email ON login_history(user_email);
CREATE INDEX idx_login_history_login_at ON login_history(login_at DESC);

-- 確認
SELECT * FROM admin_users;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admin_users', 'login_history');