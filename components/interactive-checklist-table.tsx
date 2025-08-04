// components/interactive-checklist-table.tsx
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReportItem {
  no: string
  location: string
  content: string
}

function parseMarkdownTable(tableString: string): ReportItem[] {
  if (!tableString || typeof tableString !== 'string') return []
  
  const rows = tableString.trim().split("\n")
  if (rows.length < 2) return []
  
  const dataRows = rows.slice(2)
  
  return dataRows.map(row => {
    const columns = row.split("|").map(cell => cell.trim())
    const cleanColumns = columns.slice(1, -1)
    
    return {
      no: cleanColumns[0] || "",
      location: cleanColumns[1] || "",
      content: cleanColumns[2] || "",
    }
  }).filter(item => item.no || item.location || item.content)
}

export function InteractiveChecklistTable({ tableContent }: { tableContent: string }) {
  const reportItems = useMemo(() => parseMarkdownTable(tableContent), [tableContent]);
  const [checkedState, setCheckedState] = useState<{ [key: string]: boolean }>({})
  const [validationActive, setValidationActive] = useState(false)
  
  const handleCheckChange = (no: string, checked: boolean) => {
    setCheckedState(prev => ({ ...prev, [no]: checked }))
  }
  
  const handleCheckComplete = () => {
    const allChecked = reportItems.every(item => checkedState[item.no]);
    if (allChecked) {
      alert('全ての項目がチェックされました。');
      setValidationActive(false);
    } else {
      setValidationActive(true);
    }
  };
  
  if (reportItems.length === 0) {
    // テーブルデータがない場合は何も表示しない
    return null;
  }
  
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">No.</TableHead>
            <TableHead>指摘箇所</TableHead>
            <TableHead>指摘内容</TableHead>
            <TableHead className="w-[100px] text-center">チェック</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportItems.map((item, index) => (
            <TableRow
              key={index}
              className={cn(
                validationActive && !checkedState[item.no] ? "bg-destructive/10" : ""
              )}
            >
              <TableCell>{item.no}</TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell>{item.content}</TableCell>
              <TableCell className="text-center">
                <Checkbox
                  id={`check-${item.no}-${index}`}
                  checked={checkedState[item.no] || false}
                  onCheckedChange={(checked) => handleCheckChange(item.no, !!checked)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleCheckComplete}>チェック完了</Button>
      </div>
    </>
  )
}