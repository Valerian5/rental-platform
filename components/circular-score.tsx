interface CircularScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
}

export function CircularScore({ score, size = "md" }: CircularScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981" // green
    if (score >= 60) return "#f59e0b" // yellow
    return "#ef4444" // red
  }

  const getSizeConfig = (size: string) => {
    switch (size) {
      case "sm":
        return { width: "40px", height: "40px", fontSize: "12px", strokeWidth: "3" }
      case "lg":
        return { width: "80px", height: "80px", fontSize: "20px", strokeWidth: "3" }
      case "md":
      default:
        return { width: "60px", height: "60px", fontSize: "16px", strokeWidth: "3" }
    }
  }

  const sizeConfig = getSizeConfig(size)
  const color = getScoreColor(score)

  return (
    <div className="relative" style={{ width: sizeConfig.width, height: sizeConfig.height }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={sizeConfig.strokeWidth}
        />
        <path
          d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeWidth={sizeConfig.strokeWidth}
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold" style={{ color: color, fontSize: sizeConfig.fontSize }}>
          {score}%
        </span>
      </div>
    </div>
  )
}
