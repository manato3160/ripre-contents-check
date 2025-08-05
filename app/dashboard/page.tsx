"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FileText,
  Globe,
  Upload,
  Clock,
  Shield,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Star,
  AlertTriangle,
  Bot,
  User,
  GitCompareArrows,
} from "lucide-react"
import { HistoryStats } from "@/components/history-stats"
import { HistoryFilter } from "@/components/history-filter"
import { AnalysisReport } from "@/components/analysis-report"
import { Toaster } from "sonner"
import { cn, getAiIssueCountFromReport } from "@/lib/utils"

// --- ここから追加 ---
interface HistoryItem {
  id: string;
  created_at: string;
  title: string;
  score: number;
  issues: any[];
  summary: string;
  user_rating: string | null;
  human_issue_count: number | null;
  raw_output: string;
}
// --- ここまで追加 ---

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
  const [activeTab, setActiveTab] = useState("check")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // --- 評価機能用のState ---
  const [userRating, setUserRating] = useState<string | null>(null);
  const [humanIssueCount, setHumanIssueCount] = useState<number | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRatingInDialog, setSelectedRatingInDialog] = useState<string>('A');
  const [humanIssueCountInDialog, setHumanIssueCountInDialog] = useState('');

  // --- ここから修正 ---
  // historyDataの初期値を空配列にする
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  // --- ここまで修正 ---

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null)
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null)

  // --- ここから追加 ---
  // ページ読み込み時に履歴を取得する
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (!response.ok) {
          throw new Error('履歴の取得に失敗しました');
        }
        const data = await response.json();
        setHistoryData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchHistory();
  }, []);
  // --- ここまで追加 ---

  // 履歴データをローカルストレージに保存する関数
  const saveHistoryToStorage = (historyData: any[]) => {
    try {
      localStorage.setItem('ripre-analysis-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('履歴データの保存に失敗しました:', error);
    }
  };

  // 履歴データが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && historyData.length > 0) {
      saveHistoryToStorage(historyData);
    }
  }, [historyData]);

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
    // 新しい分析が開始されたら、前回のユーザー評価をリセット
    setUserRating(null);
    setHumanIssueCount(null);
    setHumanIssueCountInDialog('');

    setIsAnalyzing(true)
    setProgress(0)
    setCurrentStep("審査を開始しています...")
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

        setCurrentStep("審査完了")
        setProgress(100)

        if (data.success) {
          const newResult = data.result
          setAnalysisResult(newResult)

          // Add to history with complete analysis data
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
            // 完全な分析結果を保存
            fullAnalysisResult: {
              ...newResult,
              originalDocuments: formData.documents,
              analysisTimestamp: new Date().toISOString(),
              officialUrls: officialUrls
            }
          }

          setHistoryData((prev) => [newHistoryItem, ...prev])

          // 分析完了後、自動的に分析結果タブに切り替え
          setActiveTab("results")

          // --- ここから追加 ---
          // 分析結果をデータベースに保存
          const newHistoryItemForDB = {
            title: formData.documents.slice(0, 50) + "...",
            score: newResult.score,
            issues: newResult.issues || [],
            summary: newResult.summary || "サマリーなし",
            user_rating: null,
            human_issue_count: null,
            raw_output: newResult.rawOutput || ""
          };

          try {
            const response = await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newHistoryItemForDB)
            });
            if (response.ok) {
              const savedItem = await response.json();
              // 履歴のリストを更新
              setHistoryData(prev => [savedItem[0], ...prev]);
            }
          } catch (error) {
            console.error("履歴の保存に失敗しました", error);
          }
          // --- ここまで追加 ---
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('審査がタイムアウトしました（20分経過）。処理時間が長すぎる可能性があります。')
        }
        throw fetchError
      }

    } catch (error) {
      console.error('Analysis error:', error)

      let errorMessage = "審査中にエラーが発生しました"
      let errorType: "error" | "warning" = "error"
      let score = 0

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
          errorMessage = "審査処理がタイムアウトしました。Difyワークフローの処理時間が長すぎる可能性があります。"
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

  const handleRatingSubmit = async () => {
    const rating = selectedRatingInDialog;
    const count = parseInt(humanIssueCountInDialog, 10);
    const issueCount = isNaN(count) ? 0 : count;

    setUserRating(rating);
    setHumanIssueCount(issueCount);
    setIsRatingDialogOpen(false);

    // 最新の履歴項目を更新する
    if (historyData.length > 0) {
      const latestHistory = historyData[0];
      const updatedHistory = { ...latestHistory, user_rating: rating, human_issue_count: issueCount };

      // TODO: ここにSupabaseのUpdate APIを呼び出す処理を追加することも可能
      // 今回はシンプルにするため、画面上の表示更新のみ
      setHistoryData([updatedHistory, ...historyData.slice(1)]);
    }
  };

  // AI指摘数をレポート内容から正確に計算
  const aiIssueCount = useMemo(() => {
    return getAiIssueCountFromReport(analysisResult?.rawOutput);
  }, [analysisResult]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* 背景のグリッドパターン */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* 分析中アニメーション */}
          <div className="relative mb-12 flex h-48 w-48 items-center justify-center">
            {/* 波紋アニメーション */}
            <div className="absolute h-full w-full rounded-full bg-white animate-ripple"></div>
            <div className="absolute h-full w-full rounded-full bg-white animate-ripple [animation-delay:1s]"></div>
            <div className="absolute h-full w-full rounded-full bg-white animate-ripple [animation-delay:2s]"></div>
            {/* 中央のアイコン */}
            <Shield className="relative z-10 h-16 w-16 text-slate-800 drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]" />
          </div>

          {/* メインテキスト */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">
              <span className="bg-gradient-to-r from-pink-500 via-cyan-500 to-purple-500 bg-clip-text text-transparent">AI審査中</span>
            </h1>
            <p className="text-xl text-slate-600 mb-2">告知文を精密にチェックしています...</p>
            <p className="text-slate-500">最大15分程度お待ちください</p>
          </div>

          {/* 分析ステップ */}
          <div className="space-y-6 w-full max-w-md">
            {analysisSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${step.active ? step.dotColor : 'bg-slate-300'} transition-colors duration-500`}></div>
                <span className={`text-lg ${step.active ? step.color : 'text-slate-500'} transition-colors duration-500`}>
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
      <Toaster richColors position="top-center" />

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

      {/* 評価用ダイアログ */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>今回の審査結果はいかがでしたか？</DialogTitle>
            <DialogDescription>
              AIの審査精度向上のため、評価にご協力ください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="human-issue-count">人間による指摘数</Label>
              <Input
                id="human-issue-count"
                type="number"
                placeholder="人間が指摘した件数を入力"
                value={humanIssueCountInDialog}
                onChange={(e) => setHumanIssueCountInDialog(e.target.value)}
              />
            </div>
            <div>
              <Label>精度の評価</Label>
              <RadioGroup
                defaultValue="A"
                className="grid grid-cols-5 gap-2 pt-2"
                value={selectedRatingInDialog}
                onValueChange={setSelectedRatingInDialog}
              >
                {['A', 'B', 'C', 'D', 'E'].map((rating) => (
                  <div key={rating} className="flex flex-col items-center space-y-2">
                    <RadioGroupItem value={rating} id={`rating-${rating}`} className="sr-only" />
                    <Label
                      htmlFor={`rating-${rating}`}
                      className={cn(
                        "flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 w-16 h-16 text-2xl font-bold hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        selectedRatingInDialog === rating && "border-slate-900"
                      )}
                    >
                      {rating}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRatingSubmit}>評価を決定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="check" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              チェック実行
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              審査結果
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
                    審査したい広告・告知文を入力してください
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
                    <CardTitle>審査実行</CardTitle>
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
                        審査開始
                      </Button>
                    )}

                    {isAnalyzing && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin text-slate-600" />
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-slate-600 text-center">審査中... {progress}%</p>
                      </div>
                    )}

                    {analysisResult && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={analysisResult.score >= 80 ? "default" : "destructive"}
                            className={analysisResult.score >= 80 ? "bg-green-600" : ""}
                          >
                            スコア: {userRating}
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
                            再審査
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-800">審査フロー</CardTitle>
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
              <>
                {/* 新しい「総合評価」カード */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between bg-slate-800 text-white rounded-t-lg">
                    <div>
                      <CardTitle className="flex items-center text-white">
                        <Star className="h-5 w-5 mr-2" />
                        総合評価
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        AIの審査結果に対する評価
                      </CardDescription>
                    </div>
                    <div>
                      {userRating ? (
                        <Badge variant="secondary" className="text-lg bg-green-600 text-white">
                          精度：{userRating}
                        </Badge>
                      ) : (
                        <Button onClick={() => setIsRatingDialogOpen(true)}>
                          評価する
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-slate-500">AI指摘数</p>
                        <p className="text-2xl font-bold">{aiIssueCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">人間による指摘数</p>
                        <p className="text-2xl font-bold">{humanIssueCount ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">差異</p>
                        <p className="text-2xl font-bold text-destructive">
                          {humanIssueCount !== null ? Math.abs(aiIssueCount - humanIssueCount) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 mb-1">コンプライアンススコア</p>
                      <Progress value={analysisResult.score} />
                    </div>
                    <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">審査サマリー</h4>
                      <p className="text-sm text-blue-800">{analysisResult.summary}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle>詳細審査レポート</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnalysisReport content={analysisResult.rawOutput || analysisResult.summary || ""} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">審査結果がありません</h3>
                  <p className="text-slate-500 mb-4">チェック実行タブか審査を開始してください</p>
                  <Button onClick={() => setActiveTab("check")} variant="outline">
                    チェック実行に戻る
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <HistoryStats data={historyData} />
                <div className="mt-6">
                  <HistoryFilter filters={historyFilters} onFiltersChange={setHistoryFilters} />
                </div>
              </div>
              <div className="lg:col-span-3">
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        審査履歴
                      </span>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {filteredHistoryData.length}件
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full"
                      value={openHistoryId || ""}
                      onValueChange={setOpenHistoryId}
                    >
                      {filteredHistoryData.map((item: any) => {
                        const aiCount = getAiIssueCountFromReport(item.raw_output);
                        const humanCount = typeof item.human_issue_count === 'number' ? item.human_issue_count : null;
                        const difference = humanCount !== null ? Math.abs(aiCount - humanCount) : null;

                        const ratingColors: { [key: string]: string } = {
                          'A': 'bg-green-600',
                          'B': 'bg-green-600',
                          'C': 'bg-yellow-600',
                          'D': 'bg-destructive',
                          'E': 'bg-destructive',
                        };

                        return (
                          <AccordionItem value={item.id} key={item.id} className="border-b-0">
                            <Card className="mb-2 border-slate-200">
                              <AccordionTrigger className="p-6 hover:no-underline">
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex-1 text-left">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                                      {item.user_rating ? (
                                        <Badge className={cn("text-white", ratingColors[item.user_rating] || 'bg-secondary')}>
                                          評価: {item.user_rating}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">未評価</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                                      <span className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        {new Date(item.created_at).toLocaleDateString("ja-JP")}
                                      </span>
                                      <span className="flex items-center">
                                        <Bot className="h-4 w-4 mr-1.5" />
                                        AI指摘数: {aiCount}
                                      </span>
                                      <span className="flex items-center">
                                        <User className="h-4 w-4 mr-1.5" />
                                        人間による指摘数: {humanCount ?? '-'}
                                      </span>
                                      <span className="flex items-center">
                                        <GitCompareArrows className="h-4 w-4 mr-1.5" />
                                        差異: {difference ?? '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert('ダウンロード処理');
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert('再審査処理');
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="p-6 pt-0">
                                  <div className="border-t border-slate-200 pt-4">
                                    <AnalysisReport content={item.raw_output || "レポート内容がありません。"} />
                                  </div>
                                </div>
                              </AccordionContent>
                            </Card>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}