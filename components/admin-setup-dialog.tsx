"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface AdminSetupDialogProps {
  onAdminSetup?: () => void
  onAdminStatusChange?: () => void
}

export function AdminSetupDialog({ onAdminSetup, onAdminStatusChange }: AdminSetupDialogProps) {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [open, setOpen] = useState(false)

  const handleSetupAdmin = async () => {
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
        setTimeout(() => {
          setOpen(false)
          onAdminSetup?.()
          onAdminStatusChange?.()
        }, 2000)
      } else {
        setResult({ success: false, message: data.error || 'エラーが発生しました' })
      }
    } catch (error) {
      setResult({ success: false, message: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          管理者権限を設定
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>管理者権限設定</span>
          </DialogTitle>
          <DialogDescription>
            アナリティクス機能を使用するために管理者権限を設定します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-email">メールアドレス</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder={session?.user?.email || 'メールアドレスを入力'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              空欄の場合は現在のユーザー（{session?.user?.email}）が設定されます
            </p>
          </div>

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
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSetupAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? '設定中...' : '管理者権限を設定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}