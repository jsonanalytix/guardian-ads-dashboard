// ============================================================
// Reusable DataTable component built on TanStack Table v8
// Supports sorting, filtering, pagination, and column visibility
// ============================================================

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 20,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: { pageSize },
    },
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center gap-2">
          <input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} results
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 align-middle whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          {' '}({table.getFilteredRowModel().rows.length} total rows)
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Reusable metric cell components ---

export function MetricCell({ value, format = 'number' }: { value: number; format?: 'currency' | 'percent' | 'multiplier' | 'number' }) {
  let formatted: string
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
      break
    case 'percent':
      formatted = `${value.toFixed(1)}%`
      break
    case 'multiplier':
      formatted = `${value.toFixed(2)}x`
      break
    default:
      formatted = new Intl.NumberFormat('en-US').format(value)
  }
  return <span className="tabular-nums">{formatted}</span>
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'Enabled' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        status === 'Paused' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        status === 'Removed' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      )}
    >
      {status}
    </span>
  )
}

export function LabelBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        label === 'Winner' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        label === 'Loser' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
        label === 'New' && 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        label === 'Neutral' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      )}
    >
      {label}
    </span>
  )
}

export function QualityScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
        score >= 8 && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        score >= 5 && score < 8 && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        score < 5 && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      )}
    >
      {score}
    </span>
  )
}

export function AdStrengthBadge({ strength }: { strength: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        strength === 'Excellent' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        strength === 'Good' && 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        strength === 'Average' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        strength === 'Poor' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      )}
    >
      {strength}
    </span>
  )
}
