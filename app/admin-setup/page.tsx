"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminSetupPage() {
  const { session, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSetupAdmin = async () => {
    if (!isAuthenticated) {
      setResult({ success: false, message: 'ログインが必要です' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email || session?.user?.email })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || 'エラーが発生しました' })
      }
    } catch (error) {
      setResult({ success: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>ログインが必要です</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-slate-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-slate-600" />
          </div>
          <CardTitle>管理者権限設定</CardTitle>
          <CardDescription>
            アナリティクス機能を使用するために管理者権限を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder={session?.user?.email || 'メールアドレスを入力'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-sm text-slate-500 mt-1">
              空欄の場合は現在のユーザー（{session?.user?.email}）が設定されます
            </p>
          </div>

          <Button 
            onClick={handleSetupAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? '設定中...' : '管理者権限を設定'}
          </Button>

          {result && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          <div className="text-center">
            <a 
              href="/dashboard" 
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              ダッシュボードに戻る
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}