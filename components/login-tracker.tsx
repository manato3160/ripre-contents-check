"use client"

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function LoginTracker() {
  const { session, isAuthenticated } = useAuth()

  useEffect(() => {
    const recordLogin = async () => {
      if (!isAuthenticated || !session?.user?.email) {
        return
      }

      try {
        await fetch('/api/login-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error('Failed to record login:', error)
        // ログイン履歴の記録に失敗してもアプリケーションの動作には影響しない
      }
    }

    // セッションが確立されたときに一度だけ記録
    if (isAuthenticated && session) {
      recordLogin()
    }
  }, [isAuthenticated, session])

  // このコンポーネントは何も表示しない
  return null
}