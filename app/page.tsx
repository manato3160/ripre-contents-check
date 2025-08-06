"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function App() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return // 認証状態の読み込み中

    if (session) {
      // ログイン済みの場合はダッシュボードへ
      router.push('/dashboard')
    } else {
      // 未ログインの場合はログインページへ
      router.push('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-600">リダイレクト中...</p>
      </div>
    </div>
  )
}
