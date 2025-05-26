"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  name: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: DataPoint[]
  title?: string
  height?: number
}

export function SimpleBarChart({ data, title, height = 200 }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3" style={{ height }}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-right">{item.name}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || "#3b82f6",
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface SimplePieChartProps {
  data: DataPoint[]
  title?: string
}

export function SimplePieChart({ data, title }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color || "#3b82f6" }} />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-sm font-medium">
                  {item.value} ({percentage}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface SimpleLineChartProps {
  data: Array<{ name: string; [key: string]: any }>
  lines: Array<{ key: string; color: string; name: string }>
  title?: string
  height?: number
}

export function SimpleLineChart({ data, lines, title, height = 200 }: SimpleLineChartProps) {
  const allValues = data.flatMap((d) => lines.map((line) => d[line.key])).filter((v) => typeof v === "number")
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {/* Légende */}
          <div className="flex gap-4">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: line.color }} />
                <span className="text-sm">{line.name}</span>
              </div>
            ))}
          </div>

          {/* Graphique simplifié */}
          <div className="relative" style={{ height }}>
            <div className="absolute inset-0 border border-gray-200 rounded">
              {/* Grille horizontale */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${percent}%` }}
                />
              ))}

              {/* Points de données */}
              <div className="relative h-full p-4">
                {data.map((point, index) => (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${(index / (data.length - 1)) * 100}%` }}
                  >
                    <div className="text-xs text-gray-500 mb-1">{point.name}</div>
                    {lines.map((line) => {
                      const value = point[line.key]
                      const yPosition = range > 0 ? ((maxValue - value) / range) * 100 : 50
                      return (
                        <div
                          key={line.key}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: line.color,
                            position: "absolute",
                            top: `${yPosition}%`,
                          }}
                          title={`${line.name}: ${value}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
