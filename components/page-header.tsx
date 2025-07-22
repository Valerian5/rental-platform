import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{title}</h1>
        {description && <p className="mt-1 text-sm sm:text-base text-gray-600 break-words">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0 w-full sm:w-auto">{children}</div>}
    </div>
  )
}
