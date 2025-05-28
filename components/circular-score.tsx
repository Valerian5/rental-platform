interface CircularScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CircularScore({ score, size = "md", className = "" }: CircularScoreProps) {
  const getSize = () => {
    switch (size) {
      case "sm":
        return { width: 40, height: 40, strokeWidth: 3, fontSize: "text-xs" }
      case "lg":
        return { width: 80, height: 80, strokeWidth: 4, fontSize: "text-lg" }
      default:
        return { width: 60, height: 60, strokeWidth: 4, fontSize: "text-sm" }
    }
  }

  const { width, height, strokeWidth, fontSize } = getSize()
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return "#10b981" // green-500
    if (score >= 60) return "#f59e0b" // amber-500
    return "#ef4444" // red-500
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${fontSize}`} style={{ color: getColor(score) }}>
          {score}%
        </span>
      </div>
    </div>
  )
}
