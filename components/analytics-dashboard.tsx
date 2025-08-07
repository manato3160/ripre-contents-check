"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Users,
  FileText,
  LogIn,
  Activity,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  users: {
    totalUsers: number
    userReportCounts: Array<{
      email: string
      name: string
      count: number
      lastActivity: string
    }>
  }
  reports: {
    totalReports: number
    dailyReports: Array<{
      date: string
      count: number
      avgScore: number
    }>
  }
  logins: {
    totalLogins: number
    dailyLogins: Array<{
      date: string
      count: number
      uniqueUsers: number
    }>
  }
  usage: {
    totalUsage: number
    userUsage: Array<{
      email: string
      totalUsage: number
      avgScore: number
      ratedCount: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      console.log('Fetching analytics data...')
      const response = await fetch('/api/analytics')
      console.log('Analytics response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Analytics API error:', response.status, errorText)
        
        if (response.status === 403) {
          throw new Error('管理者権限が必要です。/admin-setup で権限を設定してください。')
        }
        if (response.status === 401) {
          throw new Error('認証が必要です')
        }
        throw new Error(`データの取得に失敗しました: ${response.status} - ${errorText}`)
      }

      const analyticsData = await response.json()
      console.log('Analytics data received:', analyticsData)
      setData(analyticsData)
      setError(null)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        <span className="ml-2">データを読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex justify-center space-x-2">
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
          {error.includes('管理者権限') && (
            <Button asChild variant="default">
              <a href="/admin-setup">管理者権限を設定</a>
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center">データがありません</div>
  }

  return (
    <div className="space-y-6">
      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              アクティブユーザー
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総レポート数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reports.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              生成されたレポート
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ログイン数</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.logins.totalLogins}</div>
            <p className="text-xs text-muted-foreground">
              累計ログイン回数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">審査機能使用回数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usage.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              累計使用回数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 詳細タブ */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="reports">レポート統計</TabsTrigger>
          <TabsTrigger value="logins">ログイン履歴</TabsTrigger>
          <TabsTrigger value="usage">使用統計</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ユーザー別レポート数グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>ユーザー別レポート数</CardTitle>
                <CardDescription>各ユーザーの生成レポート数</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.users.userReportCounts.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ユーザー一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>ユーザー一覧</CardTitle>
                <CardDescription>登録ユーザーと活動状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.users.userReportCounts.map((user: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{user.count}件</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(user.lastActivity).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 日別レポート数 */}
            <Card>
              <CardHeader>
                <CardTitle>日別レポート数</CardTitle>
                <CardDescription>過去30日間のレポート生成数</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.reports.dailyReports.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                    />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 平均スコア推移 */}
            <Card>
              <CardHeader>
                <CardTitle>平均スコア推移</CardTitle>
                <CardDescription>日別の平均審査スコア</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.reports.dailyReports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                    />
                    <Line type="monotone" dataKey="avgScore" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logins" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 日別ログイン数 */}
            <Card>
              <CardHeader>
                <CardTitle>日別ログイン数</CardTitle>
                <CardDescription>過去30日間のログイン回数</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.logins.dailyLogins.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ユニークユーザー数 */}
            <Card>
              <CardHeader>
                <CardTitle>日別ユニークユーザー数</CardTitle>
                <CardDescription>日別のアクティブユーザー数</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.logins.dailyLogins}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                    />
                    <Line type="monotone" dataKey="uniqueUsers" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ユーザー別使用回数 */}
            <Card>
              <CardHeader>
                <CardTitle>ユーザー別使用回数</CardTitle>
                <CardDescription>審査機能の使用頻度</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.usage.userUsage.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="email" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalUsage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 使用統計詳細 */}
            <Card>
              <CardHeader>
                <CardTitle>使用統計詳細</CardTitle>
                <CardDescription>ユーザー別の詳細統計</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.usage.userUsage.map((user: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          平均スコア: {user.avgScore}点
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{user.totalUsage}回使用</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          評価済み: {user.ratedCount}件
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 更新ボタン */}
      <div className="flex justify-end">
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          データを更新
        </Button>
      </div>
    </div>
  )
}