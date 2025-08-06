"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, BarChart3, CheckCircle, Zap } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // ログイン済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      })
    } catch (error) {
      console.error('ログインエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ローディング中の表示
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-slate-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-slate-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-100/40 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ripre告知文チェック</h1>
              <p className="text-slate-600 text-sm">広告コンプライアンス分析</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-slate-300">
            β版
          </Badge>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            もう見逃さない。
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              専門AI
            </span>
            で次のステージへ
          </h1>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xl text-slate-700 leading-relaxed">告知文と公式HPのURLをアップするだけで、専門AIが自動チェック。</p>
            <p className="text-xl text-slate-700 leading-relaxed">
              誤字脱字から薬機法まで、プロ級のコンプライアンスチェックを。
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto mb-20">
          <Card className="bg-white border-slate-200 shadow-xl">
            <CardHeader className="text-center pb-6 bg-slate-900 text-white rounded-t-lg">
              <CardTitle className="text-2xl text-white">ログイン</CardTitle>
              <CardDescription className="text-slate-300">Googleアカウントで開始</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-8">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Googleでログイン</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">精密な整合性チェック</h3>
              <p className="text-slate-600 leading-relaxed">
                公式HPとの一字一句レベルでの比較により、矛盾点を漏れなく検出
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">リソースを最大化</h3>
              <p className="text-slate-600 leading-relaxed">複数のURLを並行処理し、数分で包括的な分析結果を提供するため、煩雑なチェック業務から解放。</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">ヒューマンエラーの排除</h3>
              <p className="text-slate-600 leading-relaxed">人間による確認では見落としがちな細かな誤記や表記揺れ、情報の抜け漏れなどをAIが確実に検出。</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 Ripre. All rights reserved. | 広告コンプライアンス分析システム
          </p>
        </footer>
      </div>
    </div>
  )
}
