// components/analysis-report.tsx
"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InteractiveChecklistTable } from "./interactive-checklist-table"

interface ReportSection {
  title: string
  content: string
}

// レポートをセクションに分割する関数
function parseReportIntoSections(content: string): ReportSection[] {
  if (!content) return [];
  
  // H2見出し (##) でレポートを分割
  const sections = content.split(/(?=^##\s)/gm).filter(Boolean);
  
  return sections.map(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].replace(/^##\s*/, '').trim();
    const sectionContent = lines.slice(1).join('\n').trim();
    
    return { title, content: sectionContent };
  });
}

export function AnalysisReport({ content }: { content: string }) {
  const sections = parseReportIntoSections(content);
  
  if (sections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分析結果</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">
            {content}
          </ReactMarkdown>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.content.includes('|--') ? (
              <InteractiveChecklistTable tableContent={section.content} />
            ) : (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}