"use client"

import React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  showPagination?: boolean
  pageSize?: number
  containerClassName?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string
  rowHoverClassName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  loadingMessage = "Loading data...",
  emptyMessage = "No data found",
  emptyIcon,
  showPagination = true,
  pageSize = 10,
  containerClassName = "rounded-md border",
  tableClassName = "",
  headerClassName = "bg-gray-50",
  rowClassName = "",
  rowHoverClassName = "",
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(showPagination && { getPaginationRowModel: getPaginationRowModel() }),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className={containerClassName}>
      <div className="overflow-x-auto">
        <Table className={tableClassName}>
          <TableHeader className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-6">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="loader mb-2"></div>
                    <span className="animate-pulse">
                      {loadingMessage}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${rowClassName} ${rowHoverClassName}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon && React.createElement(emptyIcon, { className: "w-12 h-12 text-gray-300" })}
                    <span>
                      {emptyMessage}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && !loading && data.length > 0 && (
        <div className="py-4">
          <DataTablePagination table={table} />
        </div>
      )}

      {/* Loader spinner style */}
      <style>{`
        .loader {
          border: 4px solid #e0e7ef;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}