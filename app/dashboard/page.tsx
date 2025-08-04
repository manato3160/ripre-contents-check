"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Globe,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react"
import { HistoryStats } from "@/components/history-stats"
import { HistoryFilter } from "@/components/history-filter"
import { AnalysisReport } from "@/components/analysis-report"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface AnalysisResult {
  status: "pending" | "processing" | "completed" | "error"
  score: number
  issues: Array<{
    type: "warning" | "error" | "info"
    message: string
    section: string
  }>
  productProfile?: {
    name: string
    category: string
    keyPoints: string[]
    components: string[]
    tone: string
  }
  rawOutput?: string
  summary?: string
}

export default function RipreDashboard() {
  // 一時的に認証を無効化
  // const { data: session, status } = useSession()
  // const router = useRouter()
  const [activeTab, setActiveTab] = useState("check")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [historyData, setHistoryData] = useState([
    {
      id: "RPR-2024-001",
      date: "2024-01-15T10:30:00Z",
      title: "美容サプリメント XYZ 告知文",
      score: 85,
      status: "completed" as const,
      issues: 3,
      productName: "美容サプリメント XYZ",
      category: "機能性表示食品",
      urls: ["https://example.com/product1", "https://example.com/product2"],
      summary: "薬機法に関する軽微な修正が必要ですが、全体的に適切な表現です。",
    },
    {
      id: "RPR-2024-002",
      date: "2024-01-14T15:45:00Z",
      title: "健康食品 ABC プロモーション",
      score: 92,
      status: "completed" as const,
      issues: 1,
      productName: "健康食品 ABC",
      category: "栄養補助食品",
      urls: ["https://example.com/abc"],
      summary: "コンプライアンス要件を満たしており、問題ありません。",
    },
    {
      id: "RPR-2024-003",
      date: "2024-01-13T09:15:00Z",
      title: "化粧品 DEF 新商品告知",
      score: 67,
      status: "completed" as const,
      issues: 5,
      productName: "化粧品 DEF",
      category: "化粧品",
      urls: ["https://example.com/def1", "https://example.com/def2"],
      summary: "効果効能の表現に複数の問題があり、修正が必要です。",
    },
    {
      id: "RPR-2024-004",
      date: "2024-01-12T14:20:00Z",
      title: "ダイエットサプリ GHI キャンペーン",
      score: 45,
      status: "completed" as const,
      issues: 8,
      productName: "ダイエットサプリ GHI",
      category: "機能性表示食品",
      urls: ["https://example.com/ghi"],
      summary: "重大なコンプライアンス違反の可能性があります。大幅な修正が必要です。",
    },
  ])

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    documents: "",
    officialUrl1: "",
    officialUrl2: "",
    officialUrl3: "",
    officialUrl4: "",
    officialUrl5: "",
    referenceFile1: null as File | null,
    referenceFile2: null as File | null,
    referenceFile3: null as File | null,
  })

  const [historyFilters, setHistoryFilters] = useState({
    search: "",
    category: "",
    scoreRange: "",
    dateRange: "",
  })

  const filteredHistoryData = historyData.filter((item) => {
    // Search filter
    if (
      historyFilters.search &&
      !item.title.toLowerCase().includes(historyFilters.search.toLowerCase()) &&
      !item.productName.toLowerCase().includes(historyFilters.search.toLowerCase()) &&
      !item.id.toLowerCase().includes(historyFilters.search.toLowerCase())
    ) {
      return false
    }

    // Category filter
    if (historyFilters.category && item.category !== historyFilters.category) {
      return false
    }

    // Score range filter
    if (historyFilters.scoreRange) {
      const [min, max] = historyFilters.scoreRange.split("-").map(Number)
      if (item.score < min || item.score > max) {
        return false
      }
    }

    // Date range filter
    if (historyFilters.dateRange) {
      const itemDate = new Date(item.date)
      const now = new Date()
      const cutoffDate = new Date()

      switch (historyFilters.dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3)
          break
      }

      if (itemDate < cutoffDate) {
        return false
      }
    }

    return true
  })

  const [currentStep, setCurrentStep] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setCurrentStep("分析を開始しています...")
    setEstimatedTime("最大15分程度お待ちください")

    try {
      // Progress simulation with more realistic timing
      const steps = [
        { step: "DIFY APIに接続中...", progress: 10, time: "接続中..." },
        { step: "告知文を解析中...", progress: 25, time: "約2-3分" },
        { step: "公式情報を取得中...", progress: 40, time: "約3-5分" },
        { step: "製品プロファイル生成中...", progress: 60, time: "約5-8分" },
        { step: "コンプライアンスチェック実行中...", progress: 80, time: "約8-12分" },
        { step: "最終レポート生成中...", progress: 95, time: "約12-15分" },
      ]

      // Show initial progress
      for (let i = 0; i < steps.length - 1; i++) {
        setCurrentStep(steps[i].step)
        setEstimatedTime(steps[i].time)
        setProgress(steps[i].progress)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Call DIFY API with extended timeout
      const officialUrls = [
        formData.officialUrl1,
        formData.officialUrl2,
        formData.officialUrl3,
        formData.officialUrl4,
        formData.officialUrl5,
      ].filter(url => url.trim())

      setCurrentStep("広告審査AIが厳正にチェック中...")
      setEstimatedTime("処理時間が長い場合があります")

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 1200000) // 20分タイムアウト

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documents: formData.documents,
            officialUrls,
            productInfo: null
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('API Error:', errorData)
          throw new Error(errorData.error || `API request failed with status ${response.status}`)
        }

        const data = await response.json()
        console.log('API Response:', data)

        setCurrentStep("分析完了")
        setProgress(100)

        if (data.success) {
          const newResult = data.result
          setAnalysisResult(newResult)

          // Add to history
          const newHistoryItem = {
            id: `RPR-${new Date().getFullYear()}-${String(historyData.length + 1).padStart(3, "0")}`,
            date: new Date().toISOString(),
            title: formData.documents.slice(0, 30) + "...",
            score: newResult.score,
            status: "completed" as const,
            issues: newResult.issues?.length || 0,
            productName: newResult.productProfile?.name || "未特定",
            category: newResult.productProfile?.category || "未分類",
            urls: officialUrls,
            summary: newResult.summary || (
              newResult.score >= 80
                ? "軽微な修正が推奨されます。"
                : newResult.score >= 60
                  ? "複数の修正が必要です。"
                  : "重大な問題があります。"
            ),
          }

          setHistoryData((prev) => [newHistoryItem, ...prev])

          // 分析完了後、自動的に分析結果タブに切り替え
          setActiveTab("results")
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('分析がタイムアウトしました（20分経過）。処理時間が長すぎる可能性があります。')
        }
        throw fetchError
      }

    } catch (error) {
      console.error('Analysis error:', error)

      let errorMessage = "分析中にエラーが発生しました"
      let errorType: "error" | "warning" = "error"
      let score = 0

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
          errorMessage = "分析処理がタイムアウトしました。Difyワークフローの処理時間が長すぎる可能性があります。"
          errorType = "warning"
          score = 50
        } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
          errorMessage = "ネットワーク接続エラーが発生しました。インターネット接続を確認してください。"
          errorType = "warning"
          score = 45
        } else if (error.message.includes('DIFY API unavailable')) {
          errorMessage = "DIFY APIが利用できません。サーバーの状態を確認してください。"
          errorType = "warning"
          score = 40
        } else {
          errorMessage = `${error.message}`
        }
      }

      // Show error result with more helpful information
      const errorResult = {
        status: "error" as const,
        score,
        issues: [
          {
            type: errorType,
            message: errorMessage,
            section: "システム",
          },
          {
            type: "info" as const,
            message: "以下の対処方法をお試しください：",
            section: "対処方法",
          },
          {
            type: "info" as const,
            message: "1. ネットワーク接続を確認してください",
            section: "対処方法",
          },
          {
            type: "info" as const,
            message: "2. しばらく時間をおいて再度お試しください",
            section: "対処方法",
          },
          {
            type: "info" as const,
            message: "3. 入力テキストを短くして再試行してください",
            section: "対処方法",
          },
          {
            type: "info" as const,
            message: "4. 問題が継続する場合は管理者にお問い合わせください",
            section: "対処方法",
          },
        ],
        productProfile: {
          name: "エラー",
          category: "未分類",
          keyPoints: ["エラー"],
          components: ["エラー"],
          tone: "エラー",
        },
        rawOutput: `エラー詳細:
${errorMessage}

入力データ:
- 告知文: ${formData.documents.slice(0, 200)}${formData.documents.length > 200 ? '...' : ''}
- 公式URL数: ${officialUrls.length}件

発生時刻: ${new Date().toLocaleString('ja-JP')}

このエラーが継続する場合は、以下の情報と共に管理者にお問い合わせください：
- エラーメッセージ: ${errorMessage}
- 発生時刻: ${new Date().toISOString()}
- ブラウザ: ${navigator.userAgent}`
      }

      setAnalysisResult(errorResult)
      // エラー時も分析結果タブに切り替え
      setActiveTab("results")
    } finally {
      setIsAnalyzing(false)
      setCurrentStep("")
      setEstimatedTime("")
    }
  }

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  // 分析中の全画面表示
  if (isAnalyzing) {
    const analysisSteps = [
      { label: "告知文と公式情報の整合性をチェック", color: "text-pink-400", dotColor: "bg-pink-400", active: progress >= 20 },
      { label: "薬機法・景表法チェック", color: "text-cyan-400", dotColor: "bg-cyan-400", active: progress >= 60 },
      { label: "過去の前例を参照してチェック", color: "text-purple-400", dotColor: "bg-purple-400", active: progress >= 80 },
    ]

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* 背景のグリッドパターン */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* 分析中アニメーション */}
          <div className="relative mb-12 flex h-48 w-48 items-center justify-center">
            {/* 波紋アニメーション */}
            <div className="absolute h-full w-full rounded-full bg-slate-800/50 animate-ripple"></div>
            <div className="absolute h-full w-full rounded-full bg-slate-800/50 animate-ripple [animation-delay:1s]"></div>
            <div className="absolute h-full w-full rounded-full bg-slate-800/50 animate-ripple [animation-delay:2s]"></div>
            {/* 中央のアイコン */}
            <Shield className="relative z-10 h-16 w-16 text-cyan-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          </div>

          {/* メインテキスト */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI審査中
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-2">
              {currentStep || "告知文を精密にチェックしています..."}
            </p>
            <p className="text-gray-500">
              {estimatedTime || "最大15分程度お待ちください"}
            </p>
            <div className="mt-4 text-sm text-gray-600">
              進捗: {progress}%
            </div>
          </div>

          {/* 分析ステップ */}
          <div className="space-y-6 w-full max-w-md">
            {analysisSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${step.active ? step.dotColor : 'bg-gray-700'} transition-colors duration-500`}></div>
                <span className={`text-lg ${step.active ? step.color : 'text-gray-600'} transition-colors duration-500`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-700 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Ripre 告知文チェック</h1>
                <p className="text-slate-400 text-sm">広告コンプライアンス分析システム</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                β版
              </Badge>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="check" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              チェック実行
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              分析結果
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              履歴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      チェック対象原稿
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      分析したい広告・告知文を入力してください
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Textarea
                      placeholder="https://ripre.com/event/00000/detail"
                      value={formData.documents}
                      onChange={(e) => setFormData((prev) => ({ ...prev, documents: e.target.value }))}
                      className="min-h-[40px] border-slate-300 focus:border-slate-900"
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-800 text-white">
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      公式URL情報
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      製品の公式サイトURLを入力してください（最大5つ）
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num}>
                        <Label htmlFor={`url${num}`} className="text-slate-700">
                          公式URL{num}
                        </Label>
                        <Input
                          id={`url${num}`}
                          placeholder={`https://example.com/product${num}`}
                          value={formData[`officialUrl${num}` as keyof typeof formData] as string}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [`officialUrl${num}`]: e.target.value,
                            }))
                          }
                          className="border-slate-300 focus:border-slate-900"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-700 text-white">
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      参考資料
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      公式URLがない場合の参考資料をアップロード
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[1, 2, 3].map((num) => (
                      <div
                        key={num}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-slate-400 transition-colors"
                      >
                        <Label htmlFor={`file${num}`} className="text-slate-700">
                          参考資料{num}
                        </Label>
                        <Input
                          id={`file${num}`}
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload(`referenceFile${num}`, e.target.files?.[0] || null)}
                          className="border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-900 file:text-white file:hover:bg-slate-800"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Panel */}
              <div className="space-y-6">
                <Card className="border-slate-200">
                  <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <CardTitle>分析実行</CardTitle>
                    <CardDescription className="text-slate-300">AIによる高精度コンプライアンスチェック</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!isAnalyzing && !analysisResult && (
                      <Button
                        onClick={handleAnalyze}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        disabled={!formData.documents.trim()}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        分析開始
                      </Button>
                    )}

                    {isAnalyzing && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin text-slate-600" />
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-slate-600 text-center">分析中... {progress}%</p>
                      </div>
                    )}

                    {analysisResult && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={analysisResult.score >= 80 ? "default" : "destructive"}
                            className={analysisResult.score >= 80 ? "bg-green-600" : ""}
                          >
                            スコア: {analysisResult.score}/100
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAnalysisResult(null)
                              setProgress(0)
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            再分析
                          </Button>
                        </div>
                        <Button className="w-full bg-transparent" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          レポートダウンロード
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-800">分析フロー</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-slate-600">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                        HTMLコンテンツ取得
                      </div>
                      <div className="flex items-center text-slate-600">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                        公式情報解析
                      </div>
                      <div className="flex items-center text-slate-600">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                        製品プロファイル生成
                      </div>
                      <div className="flex items-center text-slate-600">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                        コンプライアンスチェック
                      </div>
                      <div className="flex items-center text-slate-600">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                        最終レポート生成
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult ? (
              <div className="space-y-6">
                {/* 総合スコアカード */}
                <Card className="border-slate-200">
                  <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        総合評価
                      </span>
                      <Badge
                        variant={analysisResult.score >= 80 ? "default" : analysisResult.score >= 60 ? "secondary" : "destructive"}
                        className={`text-lg px-4 py-2 ${analysisResult.score >= 80 ? "bg-green-600" :
                          analysisResult.score >= 60 ? "bg-yellow-600" : "bg-red-600"
                          }`}
                      >
                        {analysisResult.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">コンプライアンススコア</span>
                          <span className="text-sm text-slate-600">{analysisResult.score}%</span>
                        </div>
                        <Progress value={analysisResult.score} className="h-3" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-900">{analysisResult.issues?.length || 0}</div>
                          <div className="text-sm text-slate-600">指摘事項</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analysisResult.issues?.filter(issue => issue.type === 'info').length || 0}
                          </div>
                          <div className="text-sm text-slate-600">情報</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {analysisResult.issues?.filter(issue => issue.type === 'error').length || 0}
                          </div>
                          <div className="text-sm text-slate-600">エラー</div>
                        </div>
                      </div>

                      {analysisResult.summary && (
                        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                          <h4 className="font-medium text-blue-900 mb-2">分析サマリー</h4>
                          <p className="text-blue-800 text-sm leading-relaxed">{analysisResult.summary}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 詳細レポート（rawOutput）*/}
                {analysisResult.rawOutput && (
                  <Card className="border-slate-200">
                    <CardHeader className="bg-slate-600 text-white">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          詳細分析レポート
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:text-slate-200"
                          onClick={() => {
                            const element = document.createElement('a');
                            const file = new Blob([analysisResult.rawOutput || ''], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = `ripre-analysis-${new Date().toISOString().split('T')[0]}.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ダウンロード
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        AI分析エンジンからの完全なレポート
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="max-h-200 overflow-y-auto">
                        <AnalysisReport content={analysisResult.rawOutput || analysisResult.summary || "分析結果を取得できませんでした。"} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* アクションボタン */}
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4">
                      <Button
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={() => {
                          const reportData = {
                            score: analysisResult.score,
                            summary: analysisResult.summary,
                            productProfile: analysisResult.productProfile,
                            issues: analysisResult.issues,
                            timestamp: new Date().toISOString(),
                            rawOutput: analysisResult.rawOutput
                          };
                          const element = document.createElement('a');
                          const file = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                          element.href = URL.createObjectURL(file);
                          element.download = `ripre-analysis-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        完全レポートをダウンロード
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAnalysisResult(null)
                          setProgress(0)
                          setActiveTab("check")
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        新しい分析を実行
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(analysisResult.rawOutput || analysisResult.summary || '')
                          // TODO: トースト通知を追加
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        結果をコピー
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">分析結果がありません</h3>
                  <p className="text-slate-500">まず「チェック実行」タブで分析を実行してください。</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryStats historyData={historyData} />
            <HistoryFilter onFilterChange={setHistoryFilters} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* History List */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        分析履歴
                      </span>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {filteredHistoryData.length}件
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      過去に実行した分析結果を確認・比較できます
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-200">
                      {filteredHistoryData.map((item) => (
                        <div
                          key={item.id}
                          className={`p-6 hover:bg-slate-50 cursor-pointer transition-colors ${selectedHistoryItem === item.id ? "bg-slate-100 border-l-4 border-slate-900" : ""
                            }`}
                          onClick={() => setSelectedHistoryItem(selectedHistoryItem === item.id ? null : item.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-medium text-slate-900">{item.title}</h3>
                                <Badge
                                  variant={
                                    item.score >= 80 ? "default" : item.score >= 60 ? "secondary" : "destructive"
                                  }
                                  className={
                                    item.score >= 80 ? "bg-green-600" : item.score >= 60 ? "bg-yellow-600" : ""
                                  }
                                >
                                  {item.score}点
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  {item.id}
                                </span>
                                <span>{new Date(item.date).toLocaleDateString("ja-JP")}</span>
                                <span className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  {item.issues}件の指摘
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.productName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{item.summary}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Panel */}
              <div className="space-y-6">
                {selectedHistoryItem ? (
                  (() => {
                    const selectedItem = historyData.find((item) => item.id === selectedHistoryItem)
                    if (!selectedItem) return null

                    return (
                      <>
                        <Card className="border-slate-200">
                          <CardHeader className="bg-slate-800 text-white">
                            <CardTitle>詳細情報</CardTitle>
                            <CardDescription className="text-slate-300">{selectedItem.id}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <Label className="text-slate-700 font-medium">分析日時</Label>
                              <p className="text-slate-900">{new Date(selectedItem.date).toLocaleString("ja-JP")}</p>
                            </div>
                            <div>
                              <Label className="text-slate-700 font-medium">総合スコア</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={selectedItem.score} className="flex-1" />
                                <span className="text-lg font-bold text-slate-900">{selectedItem.score}</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-700 font-medium">製品情報</Label>
                              <div className="space-y-2 mt-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">製品名:</span>
                                  <span className="text-sm font-medium">{selectedItem.productName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">カテゴリ:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedItem.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-700 font-medium">参照URL</Label>
                              <div className="space-y-1 mt-2">
                                {selectedItem.urls.map((url, index) => (
                                  <div key={index} className="text-xs text-slate-600 break-all">
                                    {url}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                          <CardHeader>
                            <CardTitle className="text-slate-800">アクション</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-3">
                            <Button className="w-full bg-transparent" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              詳細レポートをダウンロード
                            </Button>
                            <Button className="w-full bg-transparent" variant="outline">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              再分析を実行
                            </Button>
                            <Button className="w-full bg-transparent" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              原稿を複製して新規チェック
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()
                ) : (
                  <Card className="border-slate-200">
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 mb-2">履歴項目を選択</h3>
                      <p className="text-slate-500">左側のリストから項目をクリックして詳細を確認してください。</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}