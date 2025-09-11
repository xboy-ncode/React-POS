
import React from 'react'

export interface Column<T> {
  key: keyof T | string
  title: string
  render?: (row: T) => React.ReactNode
}

export default function DataTable<T extends { id: string | number }>({ data, columns }: { data: T[]; columns: Column<T>[] }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            {columns.map((c) => <th key={String(c.key)} className="px-3 py-2">{c.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t border-neutral-200 dark:border-neutral-800">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">
                  {c.render ? c.render(row) : String((row as any)[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
