"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useAdmin() {
  const { session, isAuthenticated } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !session?.user?.email) {
        console.log('useAdmin: Not authenticated or no email')
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        console.log('useAdmin: Checking admin status for', session.user.email)
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        console.log('useAdmin: Admin check response:', data)
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, session])

  return {
    isAdmin,
    isLoading,
    session
  }
}