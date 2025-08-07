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
        console.log('Recording login for:', session.user.email)
        const response = await fetch('/api/login-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('Login recorded successfully')
        } else {
          console.error('Failed to record login:', response.status)
        }
      } catch (error) {
        console.error('Failed to record login:', error)
        // ログイン履歴の記録に失敗してもアプリケーションの動作には影響しない
      }
    }

    // セッションが確立されたときに一度だけ記録
    if (isAuthenticated && session) {
      // 少し遅延を入れてセッションが完全に確立されてから実行
      const timer = setTimeout(recordLogin, 1000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, session])

  // このコンポーネントは何も表示しない
  return null
}