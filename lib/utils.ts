import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// AI指摘数をレポート内容から正確に計算する関数
export function getAiIssueCountFromReport(content: string | null | undefined): number {
  if (!content) return 0;

  const lines = content.split('\n');
  let totalDataRowCount = 0;
  let isInsideTargetTable = false; // 「指摘事項」テーブルの中を読んでいるかどうかのフラグ

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 目的のテーブルのヘッダー行を検出して、カウントモードに入る
    if (trimmedLine.includes('| No.') && trimmedLine.includes('| 指摘箇所')) {
      isInsideTargetTable = true;
      continue; // ヘッダー行自体はカウントしない
    }

    // カウントモード中で、テーブルの区切り行を見つけたらスキップ
    if (isInsideTargetTable && trimmedLine.includes('|--')) {
      continue;
    }

    // カウントモード中で、かつ有効なテーブル行であればカウント
    if (isInsideTargetTable && trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // 最初の列が数字であることを確認して、データ行であることを保証する
      const cells = trimmedLine.split('|').map(cell => cell.trim());
      if (cells.length > 2 && /^\d+$/.test(cells[1])) {
        totalDataRowCount++;
      }
    }

    // カウントモード中にテーブルではない行（空行など）が来たら、カウントモードを終了
    if (isInsideTargetTable && !trimmedLine.startsWith('|')) {
      isInsideTargetTable = false;
    }
  }

  return totalDataRowCount;
}