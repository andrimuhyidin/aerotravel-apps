/**
 * Data Table Component
 * Standardized table component untuk displaying data dengan consistent styling
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { cn } from '@/lib/utils';
import { LoadingState } from './loading-state';
import { EmptyState } from './empty-state';

export type DataTableColumn<T> = {
  key: string;
  header: string | (() => React.ReactNode);
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Tidak ada data',
  emptyDescription,
  className,
  rowClassName,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingState variant="table" lines={5} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        variant="subtle"
      />
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.headerClassName)}
              >
                {typeof column.header === 'function' ? column.header() : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const rowKey = keyExtractor
              ? keyExtractor(row, index)
              : (row.id as string) || `row-${index}`;
            const computedRowClassName =
              typeof rowClassName === 'function'
                ? rowClassName(row, index)
                : rowClassName;

            return (
              <TableRow
                key={rowKey}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  computedRowClassName
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.className)}
                  >
                    {column.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

