"use client";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
  { department: "Arts & Sciences", feedback: 4.5 },
  { department: "Business & Accountancy", feedback: 4.2 },
  { department: "Computer Studies", feedback: 4.7 },
  { department: "Engineering", feedback: 4.1 },
  { department: "Nursing", feedback: 4.6 },
  { department: "Education", feedback: 4.3 },
  { department: "Hospitality Mgmt", feedback: 4.4 },
];

export default function ProfessorPerformanceChart() {
  return (
    <ChartContainer config={{ feedback: { label: "Avg. Feedback Score", color: "#3b82f6" } }} className="h-[50vh] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "#6b7280" }} tickCount={6} />
          <ChartTooltip />
          <ChartLegend />
          <Bar dataKey="feedback" name="Feedback" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
