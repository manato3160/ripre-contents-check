"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function App() {
  const router = useRouter()

  useEffect(() => {
    // 直接ダッシュボードにリダイレクト
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  )
}
