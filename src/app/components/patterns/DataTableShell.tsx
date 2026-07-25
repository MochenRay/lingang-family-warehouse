import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { TableBody, TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';

export { DATA_TABLE_ALIGNMENT_CLASS } from './dataTableAlignment';

/**
 * DataTableShell：表格一致化组合件（非万能表格）。
 * - DataTableBody：loading 骨架行 / empty 空态行（自动 colSpan）/ 正常内容
 * - TablePagination：上一页/下一页分页条（从 PopulationManagement 抽出）
 * 表头排序继续用 statistics/SortableHeader。
 */

interface DataTableBodyProps {
  loading?: boolean;
  loadingText?: string;
  empty?: boolean;
  emptyText?: string;
  /** 列数，用于空态/加载行 colSpan */
  columnCount: number;
  /** loading 时渲染的骨架行数 */
  skeletonRows?: number;
  children: ReactNode;
  className?: string;
}

export function DataTableBody({
  loading = false,
  loadingText = '正在加载数据…',
  empty = false,
  emptyText = '暂无数据',
  columnCount,
  skeletonRows = 3,
  children,
  className,
}: DataTableBodyProps) {
  if (loading) {
    return (
      <TableBody className={className}>
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell colSpan={columnCount} className="py-3">
              <Skeleton className="h-5 w-full" aria-label={index === 0 ? loadingText : undefined} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (empty) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell colSpan={columnCount} className="py-8 text-center text-[var(--color-neutral-08)]">
            {emptyText}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return <TableBody className={className}>{children}</TableBody>;
}

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  /** 总数（条） */
  totalItems: number;
  /** 当前页第一条的序号（0 基）；与 pageEnd 一起展示「x-y 条」 */
  pageStart: number;
  pageEnd: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageStart,
  pageEnd,
  onPageChange,
  className,
}: TablePaginationProps) {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-[var(--color-neutral-03)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="text-sm text-[var(--color-neutral-08)]">
        共 {totalItems} 条，当前显示 {totalItems === 0 ? 0 : pageStart + 1}-{pageEnd} 条
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          上一页
        </Button>
        <div className="min-w-[92px] text-center text-sm text-[var(--color-neutral-08)]">
          第 {safePage} / {Math.max(1, totalPages)} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

/** 表格容器卡：统一表格外层面板的写法 */
export function DataTableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]', className)}>
      {children}
    </div>
  );
}

/** 加载中内联指示（非表格场景的小块加载） */
export function InlineLoading({ text = '正在加载…', className }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-neutral-08)]', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}
