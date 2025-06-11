import { cn } from "@/lib/utils"

interface CircularScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  className?: string
  loading?: boolean
}

export function CircularScore({ score, size = "md", className, loading = false }: CircularScoreProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 border-green-600"
    if (score >= 60) return "text-yellow-600 border-yellow-600"
    if (score >= 40) return "text-orange-600 border-orange-600"
    return "text-red-600 border-red-600"
  }

  const getBackgroundColor = (score: number) => {
    if (score >= 80) return "bg-green-50"
    if (score >= 60) return "bg-yellow-50"
    if (score >= 40) return "bg-orange-50"
    return "bg-red-50"
  }

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center animate-pulse",
          sizeClasses[size],
          className,
        )}
      >
        <span className="text-gray-400 font-medium">...</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center font-medium",
        sizeClasses[size],
        getScoreColor(score),
        getBackgroundColor(score),
        className,
      )}
    >
      {score}
    </div>
  )
}
