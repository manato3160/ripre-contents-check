// 管理者ユーザーを設定するスクリプト
// 使用方法: node scripts/setup-admin.js your-email@example.com

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setupAdmin(email) {
  if (!email) {
    console.error('使用方法: node scripts/setup-admin.js your-email@example.com')
    process.exit(1)
  }

  try {
    // 管理者ユーザーを追加または更新
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        user_email: email,
        user_name: 'システム管理者',
        is_admin: true
      }, {
        onConflict: 'user_email'
      })

    if (error) {
      console.error('エラー:', error)
      process.exit(1)
    }

    console.log(`✅ ${email} を管理者として設定しました`)
  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  }
}

const email = process.argv[2]
setupAdmin(email)