"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useAdmin() {
  const { session, isAuthenticated } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastCheckedEmail, setLastCheckedEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !session?.user?.email) {
        console.log('useAdmin: Not authenticated or no email')
        setIsAdmin(false)
        setIsLoading(false)
        setLastCheckedEmail(null)
        return
      }

      // 同じユーザーの場合は再チェックをスキップ（キャッシュ）
      if (lastCheckedEmail === session.user.email && !isLoading) {
        console.log('useAdmin: Using cached result for', session.user.email)
        return
      }

      try {
        console.log('useAdmin: Checking admin status for', session.user.email)
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        console.log('useAdmin: Admin check response:', data)
        setIsAdmin(data.isAdmin || false)
        setLastCheckedEmail(session.user.email)
      } catch (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, session?.user?.email])

  // 管理者権限を手動で更新する関数
  const refreshAdminStatus = async () => {
    if (!session?.user?.email) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/check')
      const data = await response.json()
      setIsAdmin(data.isAdmin || false)
      setLastCheckedEmail(session.user.email)
    } catch (error) {
      console.error('Admin refresh error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isAdmin,
    isLoading,
    session,
    refreshAdminStatus
  }
}