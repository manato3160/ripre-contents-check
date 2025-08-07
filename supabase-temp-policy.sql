-- 一時的に管理者テーブルへの挿入を許可するポリシーを追加
CREATE POLICY IF NOT EXISTS "Allow initial admin setup" ON admin_users
  FOR INSERT WITH CHECK (true);

-- または、既存のポリシーを一時的に削除して新しいポリシーを作成
DROP POLICY IF EXISTS "Only admins can access admin_users" ON admin_users;

-- より柔軟なポリシーを作成（初回セットアップ用）
CREATE POLICY "Allow admin setup and access" ON admin_users
  FOR ALL USING (
    -- 管理者は全てのレコードにアクセス可能
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_admin = true
    )
    OR
    -- テーブルが空の場合は誰でも挿入可能（初回セットアップ用）
    NOT EXISTS (SELECT 1 FROM admin_users WHERE is_admin = true)
  )
  WITH CHECK (
    -- 管理者は全てのレコードを変更可能
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' 
      AND is_admin = true
    )
    OR
    -- テーブルが空の場合は誰でも挿入可能（初回セットアップ用）
    NOT EXISTS (SELECT 1 FROM admin_users WHERE is_admin = true)
  );