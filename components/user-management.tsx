"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Settings,
  Trash2,
  RefreshCw,
  Calendar,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  email: string
  name: string
  isAdmin: boolean
  lastActivity: string
  reportCount: number
  hasAdminRecord: boolean
  adminId?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('管理者権限が必要です')
        }
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const data = await response.json()
      setUsers(data.users)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error('メールアドレスを入力してください')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: newUserEmail.trim(),
          userName: newUserName.trim() || 'Unknown',
          isAdminUser: newUserIsAdmin
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setIsAddDialogOpen(false)
        setNewUserEmail('')
        setNewUserName('')
        setNewUserIsAdmin(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'ユーザーの追加に失敗しました')
      }
    } catch (error) {
      toast.error('ネットワークエラーが発生しました')
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: editingUser.email,
          userName: editingUser.name,
          isAdminUser: editingUser.isAdmin
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setIsEditDialogOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error(data.error || 'ユーザーの更新に失敗しました')
      }
    } catch (error) {
      toast.error('ネットワークエラーが発生しました')
    }
  }

  const handleDeleteUser = async (userEmail: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.error || 'ユーザーの削除に失敗しました')
      }
    } catch (error) {
      toast.error('ネットワークエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <span className="ml-2">ユーザー情報を読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          再試行
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ユーザー管理</h2>
          <p className="text-muted-foreground">システムユーザーと権限の管理</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                ユーザー追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいユーザーを追加</DialogTitle>
                <DialogDescription>
                  新しいユーザーを追加し、管理者権限を設定します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-email">メールアドレス *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-name">名前</Label>
                  <Input
                    id="new-name"
                    placeholder="ユーザー名"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-admin"
                    checked={newUserIsAdmin}
                    onCheckedChange={setNewUserIsAdmin}
                  />
                  <Label htmlFor="new-admin">管理者権限を付与</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理者数</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.isAdmin).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.reportCount > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ユーザーテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>
            システムに登録されているユーザーと権限の一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>レポート数</TableHead>
                <TableHead>最終活動</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        管理者
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        一般ユーザー
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1 text-muted-foreground" />
                      {user.reportCount}件
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(user.lastActivity).toLocaleDateString('ja-JP')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog open={isEditDialogOpen && editingUser?.email === user.email} onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (!open) setEditingUser(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser({ ...user })}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ユーザー権限の編集</DialogTitle>
                            <DialogDescription>
                              {user.name} ({user.email}) の権限を編集します
                            </DialogDescription>
                          </DialogHeader>
                          {editingUser && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">名前</Label>
                                <Input
                                  id="edit-name"
                                  value={editingUser.name}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    name: e.target.value
                                  })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-admin"
                                  checked={editingUser.isAdmin}
                                  onCheckedChange={(checked) => setEditingUser({
                                    ...editingUser,
                                    isAdmin: checked
                                  })}
                                />
                                <Label htmlFor="edit-admin">管理者権限</Label>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={handleEditUser}>更新</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.name} ({user.email}) を管理者リストから削除します。
                              この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}