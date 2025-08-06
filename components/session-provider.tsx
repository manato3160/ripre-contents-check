"use client"

import { SessionProvider } from "next-auth/react"

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider 
      refetchInterval={0} // 自動更新を無効化（パフォーマンス向上）
      refetchOnWindowFocus={false} // フォーカス時の更新を無効化
      basePath="/api/auth" // 明示的にベースパスを指定
    >
      {children}
    </SessionProvider>
  )
}