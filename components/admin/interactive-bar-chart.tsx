"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface BarChartData {
  year: string
  predicted: number
  actual: number
}

interface InteractiveBarChartProps {
  data: BarChartData[]
  title: string
  showLegend?: boolean
}

export function InteractiveBarChart({ data, title, showLegend = true }: InteractiveBarChartProps) {
  const [activeBar, setActiveBar] = useState<string | null>(null)
  const { theme } = useTheme()
  
  const isDark = theme === "dark"

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`px-3 py-2 rounded-lg shadow-lg ${
            isDark ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === "predicted" ? "Predicted" : "Actual"}: {entry.value} students
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#363636" : "#E0E0E0"}
          />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px", color: isDark ? "#fff" : "#000" }}
              iconType="rect"
            />
          )}
          <Bar
            dataKey="predicted"
            fill={isDark ? "#CC3B3B" : "#A13030"}
            name="Predicted Dropouts"
            radius={[4, 4, 0, 0]}
            onMouseEnter={(data: any) => setActiveBar(data.year)}
            onMouseLeave={() => setActiveBar(null)}
          />
          <Bar
            dataKey="actual"
            fill={isDark ? "var(--darkmode-color-two)" : "var(--customized-color-one)"}
            name="Actual Dropouts"
            radius={[4, 4, 0, 0]}
            onMouseEnter={(data: any) => setActiveBar(data.year)}
            onMouseLeave={() => setActiveBar(null)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
