"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"

interface HistoryFilterProps {
  onFilterChange: (filters: {
    search: string
    category: string
    scoreRange: string
    dateRange: string
  }) => void
}

export function HistoryFilter({ onFilterChange }: HistoryFilterProps) {
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    scoreRange: "all",
    dateRange: "all",
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "all",
      scoreRange: "all",
      dateRange: "all",
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <Card className="border-slate-200 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Filter className="h-5 w-5 mr-2" />
          フィルター・検索
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search" className="text-slate-700">
              キーワード検索
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="製品名、ID等で検索..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 border-slate-300 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-700">カテゴリ</Label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger className="border-slate-300 focus:border-slate-900">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="機能性表示食品">機能性表示食品</SelectItem>
                <SelectItem value="化粧品">化粧品</SelectItem>
                <SelectItem value="栄養補助食品">栄養補助食品</SelectItem>
                <SelectItem value="医薬部外品">医薬部外品</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700">スコア範囲</Label>
            <Select value={filters.scoreRange} onValueChange={(value) => handleFilterChange("scoreRange", value)}>
              <SelectTrigger className="border-slate-300 focus:border-slate-900">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="80-100">優良 (80-100点)</SelectItem>
                <SelectItem value="60-79">要改善 (60-79点)</SelectItem>
                <SelectItem value="0-59">要注意 (0-59点)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700">期間</Label>
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
              <SelectTrigger className="border-slate-300 focus:border-slate-900">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">過去1週間</SelectItem>
                <SelectItem value="month">過去1ヶ月</SelectItem>
                <SelectItem value="quarter">過去3ヶ月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={clearFilters} className="flex items-center bg-transparent">
            <X className="h-4 w-4 mr-2" />
            フィルターをクリア
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
