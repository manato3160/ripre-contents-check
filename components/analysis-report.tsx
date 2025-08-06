// components/analysis-report.tsx
"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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
import { toast } from "sonner"

// --- コンポーネント間で状態を共有するためのContext ---
const ReportContext = React.createContext<{
  registerTable: (tableId: string, rowCount: number) => void;
  onCheckChange: (key: string, checked: boolean) => void;
  checkedState: { [key: string]: boolean };
  validationActive: boolean;
} | null>(null);

/**
 * react-markdownから呼び出される、インタラクティブなテーブルを描画するコンポーネント
 */
const InteractiveTable = ({ children }: { children?: React.ReactNode }) => {
  const context = React.useContext(ReportContext);
  const tableId = React.useId();

  if (!context) return <table />;

  const { registerTable, onCheckChange, checkedState, validationActive } = context;

  const tableBody = React.Children.toArray(children || []).find((child: any) => child?.type === 'tbody') as React.ReactElement;
  const rowCount = tableBody && (tableBody.props as any)?.children 
    ? React.Children.count((tableBody.props as any).children) 
    : 0;

  React.useEffect(() => {
    if (rowCount > 0) {
      registerTable(tableId, rowCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, rowCount]);

  return (
    <Table className="my-6">
      {React.Children.map(children, (child: any) => {
        if (child.type === 'thead') {
          return React.cloneElement(child, {
            children: React.Children.map(child.props.children, (tr: any) =>
              React.cloneElement(tr, {
                children: [
                  ...tr.props.children,
                  <TableHead key="check-header" className="w-[100px] text-center">
                    チェック
                  </TableHead>
                ]
              })
            )
          });
        }

        if (child.type === 'tbody') {
          return React.cloneElement(child, {
            children: React.Children.map(child.props.children, (tr: any, rowIndex: number) => {
              const checkKey = `${tableId}-${rowIndex}`;
              const isChecked = !!checkedState[checkKey];
              const isInvalid = validationActive && !isChecked;

              return React.cloneElement(tr, {
                // 【最重要修正点】cnユーティリティでクラスを動的に変更
                className: cn(
                  "transition-colors", // スムーズな色の変化
                  isChecked && "bg-slate-100 text-slate-500", // チェック済みの場合
                  isInvalid && "bg-destructive/10 text-destructive" // 未チェックで検証が走った場合
                ),
                children: [
                  ...tr.props.children,
                  <TableCell key={`check-cell-${checkKey}`} className="text-center">
                    <Checkbox
                      id={`check-${checkKey}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => onCheckChange(checkKey, !!checked)}
                    />
                  </TableCell>
                ]
              });
            })
          });
        }

        return child;
      })}
    </Table>
  );
};

/**
 * レポート全体を描画し、全てのチェック状態を管理するメインコンポーネント
 */
export function AnalysisReport({ content }: { content: string }) {
  const [checkedState, setCheckedState] = React.useState<{ [key: string]: boolean }>({});
  const [validationActive, setValidationActive] = React.useState(false);
  const [tableInfo, setTableInfo] = React.useState<Record<string, number>>({});

  const registerTable = React.useCallback((tableId: string, rowCount: number) => {
    setTableInfo(prev => ({ ...prev, [tableId]: rowCount }));
  }, []);

  const totalChecklistItems = Object.values(tableInfo).reduce((sum, count) => sum + count, 0);

  const handleCheckChange = (key: string, checked: boolean) => {
    setCheckedState(prev => ({ ...prev, [key]: checked }));
  };

  const handleCheckComplete = () => {
    if (totalChecklistItems === 0) {
      toast.info('チェック対象の項目がありません。');
      return;
    }

    const checkedCount = Object.values(checkedState).filter(Boolean).length;

    if (checkedCount === totalChecklistItems) {
      toast.success('チェック完了', {
        description: '全ての項目が確認されました。',
      });
      setValidationActive(false);
    } else {
      toast.warning('チェック漏れがあります！', {
        description: '赤くハイライトされた未チェックの項目を確認してください。',
      });
      setValidationActive(true);
    }
  };

  const contextValue = {
    registerTable,
    onCheckChange: handleCheckChange,
    checkedState,
    validationActive
  };

  return (
    <>
      <ReportContext.Provider value={contextValue}>
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: InteractiveTable,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </ReportContext.Provider>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleCheckComplete}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold px-8 py-4"
        >
          チェック完了
        </Button>
      </div>
    </>
  );
}