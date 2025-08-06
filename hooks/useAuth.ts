"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    console.log('useAuth - status:', status, 'session:', !!session)
    
    if (status === "loading") {
      setIsLoading(true)
      return
    }

    if (status === "unauthenticated" || !session) {
      if (!hasRedirected) {
        console.log('User not authenticated, redirecting to login...')
        setHasRedirected(true)
        // 少し遅延を入れてリダイレクト
        setTimeout(() => {
          router.replace('/login')
        }, 100)
      }
      return
    }

    if (status === "authenticated" && session) {
      console.log('User authenticated, showing dashboard')
      setIsLoading(false)
      setHasRedirected(false)
    }
  }, [session, status, router, hasRedirected])

  // 追加の安全策：一定時間後に強制的にローディングを解除
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status !== "loading" && session) {
        setIsLoading(false)
      }
    }, 3000) // 3秒後

    return () => clearTimeout(timeout)
  }, [status, session])

  return {
    session,
    status,
    isLoading: isLoading || status === "loading",
    isAuthenticated: status === "authenticated" && !!session
  }
}