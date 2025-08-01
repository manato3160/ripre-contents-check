"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Calendar } from "lucide-react"

interface HistoryStatsProps {
  historyData: Array<{
    id: string
    date: string
    score: number
    issues: number
    status: string
  }>
}

export function HistoryStats({ historyData }: HistoryStatsProps) {
  const averageScore = Math.round(historyData.reduce((sum, item) => sum + item.score, 0) / historyData.length)
  const totalIssues = historyData.reduce((sum, item) => sum + item.issues, 0)
  const highScoreCount = historyData.filter((item) => item.score >= 80).length
  const lowScoreCount = historyData.filter((item) => item.score < 60).length

  const recentTrend = historyData.length >= 2 ? historyData[0].score - historyData[1].score : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">平均スコア</CardTitle>
          <BarChart3 className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{averageScore}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={averageScore} className="flex-1" />
            <span className="text-xs text-slate-600">/100</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">総チェック数</CardTitle>
          <Calendar className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{historyData.length}</div>
          <div className="flex items-center space-x-2 mt-2">
            {recentTrend > 0 ? (
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="text-xs">+{recentTrend}pt</span>
              </div>
            ) : recentTrend < 0 ? (
              <div className="flex items-center text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span className="text-xs">{recentTrend}pt</span>
              </div>
            ) : (
              <span className="text-xs text-slate-600">変化なし</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">高スコア率</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round((highScoreCount / historyData.length) * 100)}%
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {highScoreCount}/{historyData.length} 件が80点以上
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">要注意案件</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{lowScoreCount}</div>
          <p className="text-xs text-slate-600 mt-2">60点未満の案件数</p>
        </CardContent>
      </Card>
    </div>
  )
}
