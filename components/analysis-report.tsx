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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn, getAiIssueCountFromReport } from "@/lib/utils"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

// --- コンポーネント間で状態を共有するためのContext ---
const ReportContext = React.createContext<{
  registerCheckKey: (key: string) => void;
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

  const { registerCheckKey, onCheckChange, checkedState, validationActive } = context;

  // テーブルヘッダーから指摘事項テーブルかどうかを判定
  const tableHeader = React.Children.toArray(children || []).find((child: any) => child?.type === 'thead') as React.ReactElement;
  const isTargetTable = React.useMemo(() => {
    if (!tableHeader) return false;
    
    const headerRow = React.Children.toArray(tableHeader.props?.children || [])[0] as React.ReactElement;
    if (!headerRow) return false;
    
    const headerCells = React.Children.toArray(headerRow.props?.children || []);
    const headerText = headerCells.map((cell: any) => 
      typeof cell?.props?.children === 'string' ? cell.props.children : ''
    ).join(' ');
    
    return headerText.includes('No.') && headerText.includes('指摘箇所');
  }, [tableHeader]);

  const tableBody = React.Children.toArray(children || []).find((child: any) => child?.type === 'tbody') as React.ReactElement;
  
  // 指摘事項テーブルの場合のみ、実際のデータ行をカウント
  const rowCount = React.useMemo(() => {
    if (!isTargetTable || !tableBody) return 0;
    
    const rows = React.Children.toArray((tableBody.props as any)?.children || []);
    let dataRowCount = 0;
    
    rows.forEach((row: any) => {
      const cells = React.Children.toArray(row.props?.children || []);
      if (cells.length > 0) {
        const firstCellContent = cells[0]?.props?.children;
        // 最初のセルが数字の場合、データ行とみなす
        if (typeof firstCellContent === 'string' && /^\d+$/.test(firstCellContent.trim())) {
          dataRowCount++;
        }
      }
    });
    
    return dataRowCount;
  }, [isTargetTable, tableBody]);

  // このuseEffectは不要になったので削除

  return (
    <Table className="my-6">
      {React.Children.map(children, (child: any) => {
        if (child.type === 'thead') {
          return React.cloneElement(child, {
            children: React.Children.map(child.props.children, (tr: any) =>
              React.cloneElement(tr, {
                children: [
                  ...tr.props.children,
                  // 指摘事項テーブルの場合のみチェック列を追加
                  ...(isTargetTable ? [
                    <TableHead key="check-header" className="w-[100px] text-center">
                      チェック
                    </TableHead>
                  ] : [])
                ]
              })
            )
          });
        }

        if (child.type === 'tbody') {
          return React.cloneElement(child, {
            children: React.Children.map(child.props.children, (tr: any, rowIndex: number) => {
              // 指摘事項テーブルの場合のみチェックボックスを追加
              if (isTargetTable) {
                const cells = React.Children.toArray(tr.props?.children || []);
                const firstCellContent = cells[0]?.props?.children;
                const isDataRow = typeof firstCellContent === 'string' && /^\d+$/.test(firstCellContent.trim());
                
                if (isDataRow) {
                  // テーブルIDと行番号を組み合わせてユニークなキーを生成
                  const checkKey = `${tableId}-row-${firstCellContent.trim()}`;
                  const isChecked = !!checkedState[checkKey];
                  const isInvalid = validationActive && !isChecked;

                  // 有効なチェックキーとして登録（レンダリング中に直接呼び出し）
                  registerCheckKey(checkKey);

                  return React.cloneElement(tr, {
                    className: cn(
                      "transition-colors",
                      isChecked && "bg-slate-100 text-slate-500",
                      isInvalid && "bg-destructive/10 text-destructive"
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
                }
              }
              
              // 指摘事項テーブルでない場合、またはデータ行でない場合はそのまま返す
              return tr;
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
export function AnalysisReport({ 
  content, 
  onCheckCompleted 
}: { 
  content: string;
  onCheckCompleted?: () => void;
}) {
  const [checkedState, setCheckedState] = React.useState<{ [key: string]: boolean }>({});
  const [validationActive, setValidationActive] = React.useState(false);
  const [validCheckKeys, setValidCheckKeys] = React.useState<Set<string>>(new Set());
  const [isCheckMissedDialogOpen, setIsCheckMissedDialogOpen] = React.useState(false);

  // 有効なチェックキーを登録する関数
  const registerCheckKey = React.useCallback((key: string) => {
    setValidCheckKeys(prev => {
      if (prev.has(key)) return prev; // 既に存在する場合は何もしない
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  }, []);

  // AI指摘数を正確に計算（utils関数を使用）
  const totalChecklistItems = React.useMemo(() => {
    return getAiIssueCountFromReport(content);
  }, [content]);

  // コンテンツが変更された時にチェック状態をリセット
  React.useEffect(() => {
    setCheckedState({});
    setValidCheckKeys(new Set());
    setValidationActive(false);
  }, [content]);

  const handleCheckChange = (key: string, checked: boolean) => {
    setCheckedState(prev => ({ ...prev, [key]: checked }));
  };

  const handleCheckComplete = () => {
    if (totalChecklistItems === 0) {
      toast.info('チェック対象の項目がありません。');
      return;
    }

    const checkedCount = Array.from(validCheckKeys).filter(key => checkedState[key]).length;
    
    // デバッグ用ログ
    console.log('チェック完了時の状態:', {
      totalChecklistItems,
      validCheckKeys: Array.from(validCheckKeys),
      checkedState,
      checkedCount
    });

    // チェック済み項目が0件の場合もチェック漏れとして扱う
    if (checkedCount === 0) {
      setValidationActive(true);
      setIsCheckMissedDialogOpen(true);
      return;
    }

    if (checkedCount === totalChecklistItems) {
      // すべてチェック完了時は評価ダイアログを表示
      setValidationActive(false);
      if (onCheckCompleted) {
        onCheckCompleted();
      } else {
        toast.success('チェック完了', {
          description: '全ての項目が確認されました。',
        });
      }
    } else {
      // チェック漏れがある場合はダイアログを表示
      setValidationActive(true);
      setIsCheckMissedDialogOpen(true);
    }
  };

  const contextValue = {
    registerCheckKey,
    onCheckChange: handleCheckChange,
    checkedState,
    validationActive
  };

  // 有効なチェックキーのみをカウント
  const checkedCount = React.useMemo(() => {
    return Array.from(validCheckKeys).filter(key => checkedState[key]).length;
  }, [validCheckKeys, checkedState]);

  const uncheckedCount = Math.max(0, totalChecklistItems - checkedCount);

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

      {/* チェック漏れ警告ダイアログ */}
      <Dialog open={isCheckMissedDialogOpen} onOpenChange={setIsCheckMissedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              チェック漏れがあります
            </DialogTitle>
            <DialogDescription>
              まだ確認されていない項目があります。すべての項目をチェックしてから完了してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-800">チェック済み項目:</span>
                <span className="font-bold text-orange-800">{checkedCount} / {totalChecklistItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-orange-800">未チェック項目:</span>
                <span className="font-bold text-red-600">{uncheckedCount}件</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              赤くハイライトされた未チェックの項目を確認してください。
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCheckMissedDialogOpen(false)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              確認しました
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}