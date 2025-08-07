-- 管理者権限を復旧
UPDATE admin_users 
SET is_admin = true, updated_at = NOW() 
WHERE user_email = 'sakamoto_manato@socialbase.co.jp';

-- 存在しない場合は作成
INSERT INTO admin_users (user_email, user_name, is_admin) 
VALUES ('sakamoto_manato@socialbase.co.jp', 'システム管理者', true)
ON CONFLICT (user_email) DO UPDATE SET 
  is_admin = true,
  updated_at = NOW();

-- 確認
SELECT * FROM admin_users WHERE user_email = 'sakamoto_manato@socialbase.co.jp';