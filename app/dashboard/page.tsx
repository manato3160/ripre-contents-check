"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/useAuth"
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
  CheckCircle,
  Edit2,
  Check,
  X,
} from "lucide-react"

import { AnalysisReport } from "@/components/analysis-report"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { LoginTracker } from "@/components/login-tracker"
import { Toaster } from "sonner"
import { cn, getAiIssueCountFromReport } from "@/lib/utils"
import { useAdmin } from "@/hooks/useAdmin"

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
  user_email: string;
  user_name: string | null;
  user_image: string | null;
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
  const { session, isLoading, isAuthenticated, status } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useAdmin()

  // デバッグ用ログ
  useEffect(() => {
    console.log('Dashboard render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'status:', status)
    console.log('Dashboard render - isAdmin:', isAdmin, 'adminLoading:', adminLoading)
  }, [isLoading, isAuthenticated, status, isAdmin, adminLoading])

  // すべてのstateを最初に宣言
  const [activeTab, setActiveTab] = useState("reports")

  // 管理者権限がない場合にアナリティクスタブが選択されないようにする
  useEffect(() => {
    if (activeTab === "analytics" && !isAdmin) {
      setActiveTab("reports")
    }
  }, [activeTab, isAdmin])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [userRating, setUserRating] = useState<string | null>(null);
  const [humanIssueCount, setHumanIssueCount] = useState<number | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRatingInDialog, setSelectedRatingInDialog] = useState<string>('A');
  const [humanIssueCountInDialog, setHumanIssueCountInDialog] = useState('');
  const [isReportListRatingDialogOpen, setIsReportListRatingDialogOpen] = useState(false);
  const [currentReportForRating, setCurrentReportForRating] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null)
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

  const [currentStep, setCurrentStep] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")

  // 認証状態の確認は useAuth フックで処理される

  // セッション確立後に履歴を取得する
  useEffect(() => {
    const fetchHistory = async () => {
      console.log('fetchHistory called, session:', session);
      if (!session) {
        console.log('No session, skipping history fetch');
        return;
      }

      try {
        console.log('Fetching history for user:', session.user?.email);
        const response = await fetch('/api/history');
        console.log('History API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('History API error:', response.status, errorText);
          if (response.status === 401) {
            console.log('認証が必要です');
            return;
          }
          throw new Error(`履歴の取得に失敗しました: ${response.status}`);
        }

        const data = await response.json();
        console.log('History data received:', data);
        setHistoryData(data);
      } catch (error) {
        console.error('履歴取得エラー:', error);
        setHistoryData([]); // エラーの場合は空配列を設定
      }
    };

    fetchHistory();
  }, [session]) // sessionが変更されたときに実行

  // 履歴データが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && historyData.length > 0) {
      saveHistoryToStorage(historyData);
    }
  }, [historyData])



  // 自動選択を削除 - ユーザーが明示的に選択した場合のみ表示

  // AI指摘数をレポート内容から正確に計算
  const aiIssueCount = useMemo(() => {
    return getAiIssueCountFromReport(analysisResult?.rawOutput);
  }, [analysisResult])

  // 認証状態が読み込み中、または未認証の場合
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {isLoading ? "認証状態を確認中..." : "ログインページにリダイレクト中..."}
          </p>
          {/* デバッグ情報（本番環境では削除） */}
          <p className="text-xs text-slate-400 mt-2">
            Status: {status} | Loading: {isLoading.toString()} | Authenticated: {isAuthenticated.toString()}
          </p>
        </div>
      </div>
    )
  }

  // 履歴データをローカルストレージに保存する関数
  const saveHistoryToStorage = (historyData: any[]) => {
    try {
      localStorage.setItem('ripre-analysis-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('履歴データの保存に失敗しました:', error);
    }
  };

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
      }, 900000) // 15分タイムアウト（DIFY側と統一）

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
        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

        setCurrentStep("審査完了")
        setProgress(100)

        if (data.success) {
          const newResult = data.result
          setAnalysisResult(newResult)

          // 審査完了後に評価ダイアログを表示（現在は無効化）
          // setTimeout(() => {
          //   setIsRatingDialogOpen(true);
          // }, 1000); // 1秒後に表示

          // Add to history with complete analysis data
          const newHistoryItem: HistoryItem = {
            id: `RPR-${new Date().getFullYear()}-${String(historyData.length + 1).padStart(3, "0")}`,
            created_at: new Date().toISOString(),
            title: formData.documents.slice(0, 30) + "...",
            score: newResult.score,
            issues: newResult.issues || [],
            summary: newResult.summary || (
              newResult.score >= 80
                ? "軽微な修正が推奨されます。"
                : newResult.score >= 60
                  ? "複数の修正が必要です。"
                  : "重大な問題があります。"
            ),
            user_rating: null,
            human_issue_count: null,
            raw_output: newResult.rawOutput || "",
            user_email: session?.user?.email || "",
            user_name: session?.user?.name || null,
            user_image: session?.user?.image || null
          }

          // 分析完了後も「審査する」タブに留まる
          // setActiveTab("analyze") // 既に審査するタブにいるので不要

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
              // データベースから返されたアイテムを使用して履歴を更新
              const dbHistoryItem: HistoryItem = {
                ...newHistoryItem,
                id: String(savedItem[0].id), // 確実に文字列として扱う
                created_at: savedItem[0].created_at,
                user_rating: savedItem[0].user_rating,
                human_issue_count: savedItem[0].human_issue_count,
                raw_output: savedItem[0].raw_output,
                user_email: savedItem[0].user_email,
                user_name: savedItem[0].user_name,
                user_image: savedItem[0].user_image
              };
              setHistoryData(prev => [dbHistoryItem, ...prev]);
            } else {
              // データベース保存に失敗した場合はローカルのアイテムを使用
              setHistoryData((prev) => [newHistoryItem, ...prev]);
            }
          } catch (error) {
            console.error("履歴の保存に失敗しました", error);
            // エラーの場合もローカルのアイテムを使用
            setHistoryData((prev) => [newHistoryItem, ...prev]);
          }
          // --- ここまで追加 ---
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('審査がタイムアウトしました（15分経過）。DIFY側で処理が完了している可能性があります。履歴を確認してください。')
        }
        throw fetchError
      }

    } catch (error) {
      console.error('Analysis error:', error)

      // officialUrls を再定義
      const officialUrls = [
        formData.officialUrl1,
        formData.officialUrl2,
        formData.officialUrl3,
        formData.officialUrl4,
        formData.officialUrl5,
      ].filter(url => url.trim())

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
      // エラー時も「審査する」タブに留まる
      // setActiveTab("analyze") // 既に審査するタブにいるので不要
    } finally {
      setIsAnalyzing(false)
      setCurrentStep("")
      setEstimatedTime("")
    }
  }

  const handleTitleUpdate = async () => {
    if (!selectedReportId || !editingTitle.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReportId,
          title: editingTitle.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('タイトルの更新に失敗しました');
      }

      // 履歴データの更新
      setHistoryData(prev => prev.map(item =>
        item.id === selectedReportId
          ? { ...item, title: editingTitle.trim() }
          : item
      ));

      setIsEditingTitle(false);
    } catch (error) {
      console.error('タイトル更新エラー:', error);
      alert('タイトルの更新に失敗しました');
    }
  };

  const handleTitleEditStart = () => {
    const currentReport = historyData.find(item => item.id === selectedReportId);
    if (currentReport) {
      setEditingTitle(currentReport.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleEditCancel = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleReportListRatingSubmit = async () => {
    const rating = selectedRatingInDialog;
    const count = parseInt(humanIssueCountInDialog, 10);
    const issueCount = isNaN(count) ? 0 : count;

    if (!currentReportForRating) {
      alert("評価対象のレポートが選択されていません。");
      return;
    }

    const targetReport = historyData.find(item => item.id === currentReportForRating);
    if (!targetReport) {
      alert("評価対象のレポートが見つかりません。");
      return;
    }

    try {
      const requestBody = {
        id: targetReport.id,
        user_rating: rating,
        human_issue_count: issueCount,
      };

      const response = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`評価の保存に失敗しました (${response.status}): ${errorText}`);
      }

      // 履歴データの更新
      setHistoryData(prev => prev.map(item =>
        item.id === currentReportForRating
          ? { ...item, user_rating: rating, human_issue_count: issueCount }
          : item
      ));

      alert('評価を保存しました。');
    } catch (error) {
      console.error("評価の保存エラー:", error);
      alert('評価の保存中にエラーが発生しました。');
    } finally {
      setIsReportListRatingDialogOpen(false);
      setCurrentReportForRating(null);
      setSelectedRatingInDialog('A');
      setHumanIssueCountInDialog('');
    }
  };

  const handleRatingSubmit = async () => {
    const rating = selectedRatingInDialog;
    const count = parseInt(humanIssueCountInDialog, 10);
    const issueCount = isNaN(count) ? 0 : count;

    // 最新の履歴項目を取得
    if (historyData.length === 0) {
      alert("評価対象の履歴がありません。");
      return;
    }

    const latestHistory = historyData[0];
    console.log("評価対象の履歴:", latestHistory);

    try {
      const requestBody = {
        id: latestHistory.id,
        user_rating: rating,
        human_issue_count: issueCount,
      };

      console.log("送信するデータ:", requestBody);

      // APIに更新リクエストを送信
      const response = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log("レスポンスステータス:", response.status);
      console.log("レスポンスOK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("APIエラーレスポンス:", errorText);
        throw new Error(`評価の保存に失敗しました (${response.status}): ${errorText}`);
      }

      const responseText = await response.text();
      console.log("レスポンステキスト:", responseText);

      let updatedHistoryItem;
      try {
        updatedHistoryItem = JSON.parse(responseText);
        console.log("パースされたレスポンス:", updatedHistoryItem);
      } catch (parseError) {
        console.error("JSONパースエラー:", parseError);
        throw new Error("サーバーからの応答が正しくありません");
      }

      // フロントエンドの表示を更新
      setUserRating(rating);
      setHumanIssueCount(issueCount);

      // 履歴データの更新 - より安全な方法
      setHistoryData(prev => {
        const updatedList = [...prev];
        if (updatedList.length > 0) {
          updatedList[0] = {
            ...updatedList[0],
            user_rating: rating,
            human_issue_count: issueCount,
            ...updatedHistoryItem
          };
        }
        return updatedList;
      });

      alert('評価を保存しました。');
    } catch (error) {
      console.error("評価の保存エラー:", error);

      // より詳細なエラーメッセージ
      let errorMessage = '評価の保存中にエラーが発生しました。';
      if (error instanceof Error) {
        errorMessage += `\n詳細: ${error.message}`;
      }

      // フォールバック: ローカルでのみ更新
      console.log("フォールバック: ローカルでのみ評価を更新します");
      setUserRating(rating);
      setHumanIssueCount(issueCount);

      alert(errorMessage + '\n\n評価はローカルでのみ保存されました。');
    } finally {
      setIsRatingDialogOpen(false);
    }
  };

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
          {/* 広告審査アニメーション */}
          <div className="relative mb-12 flex h-64 w-64 items-center justify-center">
            {/* 書類の背景 */}
            <div className="absolute inset-8 bg-white rounded-lg shadow-2xl border border-slate-200 animate-document-float">
              {/* 書類の線 */}
              <div className="p-6 space-y-3">
                <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                <div className="h-2 bg-slate-200 rounded w-full"></div>
                <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
              </div>

              {/* スキャンライン */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
              </div>
            </div>

            {/* レーダースキャン */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30">
              <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-cyan-400 to-transparent origin-bottom animate-radar"></div>
            </div>

            {/* チェックマーク（順番に表示） */}
            <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-checkmark" style={{ animationDelay: '1s' }}>
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-12 right-8 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-checkmark" style={{ animationDelay: '2s' }}>
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-8 right-6 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-checkmark" style={{ animationDelay: '3s' }}>
              <CheckCircle className="w-4 h-4 text-white" />
            </div>

            {/* 中央のシールドアイコン */}
            <div className="relative z-10 bg-slate-900 rounded-full p-4 animate-glow-pulse">
              <Shield className="h-12 w-12 text-cyan-400" />
            </div>
          </div>

          {/* メインテキスト */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">広告審査中</span>
            </h1>
            <p className="text-xl text-slate-600 mb-2">
              {currentStep || "薬機法・景表法に基づく厳正な審査を実行中..."}
            </p>
            <p className="text-slate-500">
              {estimatedTime || "コンプライアンスチェックには時間がかかります"}
            </p>
            <div className="mt-4 text-sm text-slate-600">
              審査進捗: {progress}%
            </div>
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
      {/* ログイン履歴トラッカー */}
      <LoginTracker />

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
              {session?.user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm text-slate-300">{session.user.name}</p>
                    <p className="text-xs text-slate-400">{session.user.email}</p>
                  </div>
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 評価用ダイアログ */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 審査が完了しました！</DialogTitle>
            <DialogDescription>
              AIの審査精度向上のため、今回の結果について評価をお聞かせください。
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
            <Button
              onClick={handleRatingSubmit}
              className="bg-slate-900 hover:bg-slate-800"
            >
              評価を送信
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsRatingDialogOpen(false)}
            >
              後で評価する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* レポート一覧用評価ダイアログ */}
      <Dialog open={isReportListRatingDialogOpen} onOpenChange={setIsReportListRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 審査が完了しました！</DialogTitle>
            <DialogDescription>
              AIの審査精度向上のため、今回の結果について評価をお聞かせください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="report-list-human-issue-count">人間による指摘数</Label>
              <Input
                id="report-list-human-issue-count"
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
                    <RadioGroupItem value={rating} id={`report-list-rating-${rating}`} className="sr-only" />
                    <Label
                      htmlFor={`report-list-rating-${rating}`}
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
            <Button
              onClick={handleReportListRatingSubmit}
              className="bg-slate-900 hover:bg-slate-800"
            >
              評価を送信
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsReportListRatingDialogOpen(false);
                setCurrentReportForRating(null);
                setSelectedRatingInDialog('A');
                setHumanIssueCountInDialog('');
              }}
            >
              後で評価する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} bg-white border border-slate-200`}>
            <TabsTrigger value="reports" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              レポート一覧
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                アナリティクス
              </TabsTrigger>
            )}
            <TabsTrigger value="analyze" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              審査する
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* レポート一覧 - 左右分割レイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* 左側: レポート一覧 */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-slate-200 h-full">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      分析レポート
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {historyData.length}件のレポート
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-80px)] overflow-y-auto">


                    {/* レポートリスト */}
                    <div className="space-y-1">
                      {historyData.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                          <p>レポートがありません</p>
                          <p className="text-sm">審査を実行してレポートを作成してください</p>
                        </div>
                      ) : (
                        historyData.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
                              selectedReportId === item.id && "bg-blue-50 border-blue-200"
                            )}
                            onClick={() => setSelectedReportId(item.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  {item.user_image ? (
                                    <img
                                      src={item.user_image}
                                      alt={item.user_name || 'User'}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="text-sm font-medium text-slate-900 truncate">
                                        {item.title}
                                      </h3>
                                      {item.user_name && (
                                        <span className="text-xs text-slate-400">
                                          by {item.user_name}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      {new Date(item.created_at).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  <div className="flex items-center space-x-1">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      item.user_rating === 'A' ? "bg-green-500" :
                                        item.user_rating === 'B' ? "bg-blue-500" :
                                          item.user_rating === 'C' ? "bg-yellow-500" :
                                            item.user_rating === 'D' ? "bg-orange-500" :
                                              item.user_rating === 'E' ? "bg-red-500" : "bg-slate-400"
                                    )}></div>
                                    <span>審査精度: {item.user_rating || '未評価'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>{Array.isArray(item.issues) ? item.issues.length : 0}件</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右側: レポート詳細 */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 h-full">
                  <CardHeader className="bg-slate-800 text-white">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                        {selectedReportId ? (
                          isEditingTitle ? (
                            <div className="flex items-center flex-1 space-x-2">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 text-white bg-slate-700 border-slate-600"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleTitleUpdate();
                                  } else if (e.key === 'Escape') {
                                    handleTitleEditCancel();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleTitleUpdate}
                                className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleTitleEditCancel}
                                className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center flex-1 min-w-0">
                              <span className="truncate">
                                {historyData.find(item => item.id === selectedReportId)?.title || "レポート詳細"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleTitleEditStart}
                                className="ml-2 text-slate-400 hover:text-white hover:bg-slate-700 flex-shrink-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        ) : (
                          "レポート詳細"
                        )}
                      </div>
                    </CardTitle>
                    {selectedReportId && (
                      <CardDescription className="text-slate-300">
                        作成日: {new Date(historyData.find(item => item.id === selectedReportId)?.created_at || '').toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 h-[calc(100%-80px)] overflow-y-auto">
                    {selectedReportId ? (
                      <div className="space-y-6">
                        {(() => {
                          const selectedReport = historyData.find(item => item.id === selectedReportId);
                          if (!selectedReport) return <div>レポートが見つかりません</div>;

                          return (
                            <>
                              {/* 審査統計カード */}
                              <Card className="border-slate-200">
                                <CardHeader className="bg-slate-900 text-white">
                                  <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    審査統計
                                  </CardTitle>
                                  <CardDescription className="text-slate-300">
                                    AI指摘数と人間による評価の比較
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* AI指摘数 */}
                                    <div className="text-center">
                                      <div className="bg-blue-50 rounded-lg p-4 mb-3">
                                        <Bot className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-blue-600">
                                          {getAiIssueCountFromReport(selectedReport.raw_output)}
                                        </div>
                                        <div className="text-sm text-blue-600 font-medium">AI指摘数</div>
                                      </div>
                                      <p className="text-xs text-slate-500">AIが検出した問題点の数</p>
                                    </div>

                                    {/* 人間による指摘数 */}
                                    <div className="text-center">
                                      <div className="bg-green-50 rounded-lg p-4 mb-3">
                                        <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-green-600">
                                          {selectedReport.human_issue_count !== null ? selectedReport.human_issue_count : '-'}
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">人間による指摘数</div>
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        {selectedReport.human_issue_count !== null ? '人間が実際に指摘した問題点の数' : '評価待ち'}
                                      </p>
                                    </div>

                                    {/* 審査精度 */}
                                    <div className="text-center">
                                      <div className="bg-purple-50 rounded-lg p-4 mb-3">
                                        <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <div className={cn(
                                          "text-2xl font-bold",
                                          selectedReport.user_rating === 'A' ? "text-green-600" :
                                            selectedReport.user_rating === 'B' ? "text-blue-600" :
                                              selectedReport.user_rating === 'C' ? "text-yellow-600" :
                                                selectedReport.user_rating === 'D' ? "text-orange-600" :
                                                  selectedReport.user_rating === 'E' ? "text-red-600" : "text-purple-600"
                                        )}>
                                          {selectedReport.user_rating || '-'}
                                        </div>
                                        <div className="text-sm text-purple-600 font-medium">審査精度</div>
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        {selectedReport.user_rating ? 'A(最高) - E(最低)' : '評価待ち'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* 評価ボタン */}
                                  {(!selectedReport.user_rating || selectedReport.human_issue_count === null) && (
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                      <div className="text-center">
                                        <p className="text-sm text-slate-600 mb-4">
                                          AIの精度向上のため、審査結果の評価をお願いします
                                        </p>
                                        <Button
                                          onClick={() => {
                                            setCurrentReportForRating(selectedReport.id);
                                            setIsReportListRatingDialogOpen(true);
                                          }}
                                          className="bg-slate-900 hover:bg-slate-800"
                                        >
                                          <Star className="h-4 w-4 mr-2" />
                                          審査結果を評価する
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* サマリー */}
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">サマリー</h3>
                                <p className="text-slate-700 leading-relaxed">
                                  {selectedReport.summary}
                                </p>
                              </div>

                              {/* 詳細レポート */}
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">詳細レポート</h3>
                                <div className="bg-white border border-slate-200 rounded-lg">
                                  <AnalysisReport
                                    content={selectedReport.raw_output}
                                    onCheckCompleted={() => {
                                      setCurrentReportForRating(selectedReport.id);
                                      setIsReportListRatingDialogOpen(true);
                                    }}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex justify-center pt-16 h-full text-slate-500">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p className="text-lg font-medium">レポートを選択するとここに表示されます</p>
                          <p className="text-sm">左側のリストからレポートを選択すると詳細が表示されます</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </TabsContent>
          )}



          <TabsContent value="analyze" className="space-y-6">
            {/* 審査結果がある場合は結果を表示、ない場合は入力フォームを表示 */}
            {analysisResult ? (
              <>
                {/* 審査統計カード */}
                <Card className="border-slate-200">
                  <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      審査統計
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      AI指摘数と人間による評価の比較
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* AI指摘数 */}
                      <div className="text-center">
                        <div className="bg-blue-50 rounded-lg p-4 mb-3">
                          <Bot className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">
                            {aiIssueCount}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">AI指摘数</div>
                        </div>
                        <p className="text-xs text-slate-500">AIが検出した問題点の数</p>
                      </div>

                      {/* 人間による指摘数 */}
                      <div className="text-center">
                        <div className="bg-green-50 rounded-lg p-4 mb-3">
                          <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">
                            {humanIssueCount !== null ? humanIssueCount : '-'}
                          </div>
                          <div className="text-sm text-green-600 font-medium">人間による指摘数</div>
                        </div>
                        <p className="text-xs text-slate-500">
                          {humanIssueCount !== null ? '人間が実際に指摘した問題点の数' : '評価待ち'}
                        </p>
                      </div>

                      {/* 審査精度 */}
                      <div className="text-center">
                        <div className="bg-purple-50 rounded-lg p-4 mb-3">
                          <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">
                            {userRating || '-'}
                          </div>
                          <div className="text-sm text-purple-600 font-medium">審査精度</div>
                        </div>
                        <p className="text-xs text-slate-500">
                          {userRating ? 'A(最高) - E(最低)' : '評価待ち'}
                        </p>
                      </div>
                    </div>

                    {/* 評価ボタン */}
                    {(!userRating || humanIssueCount === null) && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-4">
                            AIの精度向上のため、審査結果の評価をお願いします
                          </p>
                          <Button
                            onClick={() => setIsRatingDialogOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            審査結果を評価する
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 審査結果表示 - レポートのみ */}
                <div className="space-y-6">
                  <AnalysisReport
                    content={analysisResult.rawOutput || ""}
                    onCheckCompleted={() => setIsRatingDialogOpen(true)}
                  />

                  {/* 新しい審査を開始ボタン - 最下部に配置 */}
                  <Card className="border-slate-200">
                    <CardHeader className="bg-slate-900 text-white">
                      <CardTitle className="text-center text-xl">新しい審査を開始</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button
                        onClick={() => {
                          setAnalysisResult(null);
                          setUserRating(null);
                          setHumanIssueCount(null);
                          setFormData({
                            documents: "",
                            officialUrl1: "",
                            officialUrl2: "",
                            officialUrl3: "",
                            officialUrl4: "",
                            officialUrl5: "",
                            referenceFile1: null,
                            referenceFile2: null,
                            referenceFile3: null,
                          });
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg"
                        size="lg"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        新しい審査を開始
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              /* 入力フォーム */
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
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        審査開始
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        入力内容を確認して審査を開始してください
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">告知文</span>
                          <span className={formData.documents ? "text-green-600" : "text-slate-400"}>
                            {formData.documents ? "✓ 入力済み" : "未入力"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">公式URL</span>
                          <span className={
                            [formData.officialUrl1, formData.officialUrl2, formData.officialUrl3, formData.officialUrl4, formData.officialUrl5]
                              .filter(url => url.trim()).length > 0 ? "text-green-600" : "text-slate-400"
                          }>
                            {[formData.officialUrl1, formData.officialUrl2, formData.officialUrl3, formData.officialUrl4, formData.officialUrl5]
                              .filter(url => url.trim()).length}件
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleAnalyze}
                        disabled={!formData.documents.trim() || isAnalyzing}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            審査中...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            審査を開始
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          </TabsContent>


        </Tabs>
      </div>
    </div>
  )
}
