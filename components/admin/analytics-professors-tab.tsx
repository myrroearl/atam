"use client";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useRef, useState } from "react";

const ProfessorPerformanceChart = dynamic(
  () => import("@/components/admin/professor-performance-chart"),
  { ssr: false }
);

export default function AnalyticsProfessorsTab() {
  // Filter state
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  // Mock data for professors
  const professors = [
    {
      name: "Dr. Maria Lopez",
      department: "Computer Studies",
      feedback: { effectiveness: 4.7, clarity: 4.6, engagement: 4.5 },
      workload: 18,
      subjects: ["Data Structures", "Algorithms"],
      sections: ["BSCS 3A", "BSCS 3B"],
    },
    {
      name: "Prof. John Cruz",
      department: "Engineering",
      feedback: { effectiveness: 4.2, clarity: 4.1, engagement: 4.0 },
      workload: 15,
      subjects: ["Circuits", "Electronics"],
      sections: ["BSECE 2A", "BSECE 2B"],
    },
    {
      name: "Dr. Anna Reyes",
      department: "Nursing",
      feedback: { effectiveness: 4.8, clarity: 4.7, engagement: 4.9 },
      workload: 20,
      subjects: ["Anatomy", "Physiology"],
      sections: ["BSN 1A", "BSN 1B"],
    },
  ];

  // Mock data for feedback insights
  const feedbackFilters = {
    semesters: ["All Semesters", "1st Semester", "2nd Semester"],
    subjects: [
      "All Subjects",
      "Data Structures",
      "Algorithms",
      "Circuits",
      "Electronics",
      "Anatomy",
      "Physiology",
    ],
    years: ["All Years", "1st Year", "2nd Year", "3rd Year", "4th Year"],
  };
  // State for filters (could use useState if making interactive)
  const selectedSemester = "All Semesters";
  const selectedSubject = "All Subjects";
  const selectedYear = "All Years";

  // Mock categorized comments per professor
  const feedbackComments = [
    {
      professor: "Dr. Maria Lopez",
      strengths: [
        "Explains concepts clearly.",
        "Very approachable and helpful.",
        "Engages students in discussions.",
      ],
      improvements: [
        "Could provide more real-world examples.",
        "Sometimes lectures feel rushed.",
      ],
    },
    {
      professor: "Prof. John Cruz",
      strengths: [
        "Makes difficult topics easier to understand.",
        "Gives constructive feedback on assignments.",
      ],
      improvements: [
        "Needs to improve class pacing.",
        "Should encourage more student participation.",
      ],
    },
    {
      professor: "Dr. Anna Reyes",
      strengths: [
        "Very patient and understanding.",
        "Uses effective teaching aids.",
      ],
      improvements: ["Could give more practice exercises."],
    },
  ];

  // Mock data for comparative analysis
  const departmentComparison = [
    { department: "Computer Studies", avgFeedback: 4.6 },
    { department: "Engineering", avgFeedback: 4.2 },
    { department: "Nursing", avgFeedback: 4.8 },
    { department: "Business & Accountancy", avgFeedback: 4.3 },
    { department: "Arts & Sciences", avgFeedback: 4.4 },
    { department: "Education", avgFeedback: 4.5 },
    { department: "Hospitality Management", avgFeedback: 4.1 },
  ];
  const feedbackTrends = [
    { year: "2020", "Computer Studies": 4.4, Engineering: 4.0, Nursing: 4.7, Business: 4.2, Arts: 4.3, Education: 4.5, Hospitality: 4.1 },
    { year: "2021", "Computer Studies": 3.9, Engineering: 4.1, Nursing: 4.8, Business: 4.3, Arts: 4.2, Education: 4.6, Hospitality: 4.0 },
    { year: "2022", "Computer Studies": 4.6, Engineering: 4.2, Nursing: 4.8, Business: 4.4, Arts: 4.5, Education: 4.7, Hospitality: 4.2 },
    { year: "2023", "Computer Studies": 4.7, Engineering: 4.2, Nursing: 3.9, Business: 4.5, Arts: 4.6, Education: 4.8, Hospitality: 4.3 },
  ];

  // Department mapping for filtering
  const departmentMap: { [key: string]: string } = {
    "Computer Studies": "Computer Studies",
    "Engineering": "Engineering", 
    "Nursing": "Nursing",
    "Business & Accountancy": "Business",
    "Arts & Sciences": "Arts",
    "Education": "Education",
    "Hospitality Management": "Hospitality"
  };

  // Filter feedback trends data based on selected department
  const filteredFeedbackTrends = selectedDepartment === "All Departments" 
    ? feedbackTrends 
    : feedbackTrends.map(row => ({
        year: row.year,
        [departmentMap[selectedDepartment] || selectedDepartment]: row[departmentMap[selectedDepartment] as keyof typeof row] || 0
      }));

  // Filter department comparison data based on selected department
  const filteredDepartmentComparison = selectedDepartment === "All Departments"
    ? departmentComparison
    : departmentComparison.filter(dept => dept.department === selectedDepartment);

  // Get departments for filter options
  const availableDepartments = [
    "All Departments",
    "Computer Studies", 
    "Engineering",
    "Nursing",
    "Business & Accountancy",
    "Arts & Sciences", 
    "Education",
    "Hospitality Management"
  ];

  // Export handlers
  const handleExportPDF = async () => {
    try {
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;
      
      const doc = new jsPDF();
      doc.text("Professor Performance Report", 14, 16);
      autoTable(doc, {
        startY: 24,
        head: [
          [
            "Professor",
            "Department",
            "Teaching Effectiveness",
            "Clarity",
            "Engagement",
            "Workload (units)",
            "Subjects Handled",
            "Sections Assigned",
          ],
        ],
        body: professors.map((prof) => [
          prof.name,
          prof.department,
          prof.feedback.effectiveness.toFixed(1),
          prof.feedback.clarity.toFixed(1),
          prof.feedback.engagement.toFixed(1),
          prof.workload,
          prof.subjects.join(", "),
          prof.sections.join(", "),
        ]),
      });
      doc.save("professor_performance_report.pdf");
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default;
      
      const ws = XLSX.utils.json_to_sheet(
        professors.map((prof) => ({
          Professor: prof.name,
          Department: prof.department,
          "Teaching Effectiveness": prof.feedback.effectiveness.toFixed(1),
          Clarity: prof.feedback.clarity.toFixed(1),
          Engagement: prof.feedback.engagement.toFixed(1),
          "Workload (units)": prof.workload,
          "Subjects Handled": prof.subjects.join(", "),
          "Sections Assigned": prof.sections.join(", "),
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Professors");
      XLSX.writeFile(wb, "professor_performance_report.xlsx");
    } catch (error) {
      console.error("Error exporting Excel:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Top Performing Professors
        </h1>
        <p className="text-md text-gray-600 font-light">
          Monitor professor performance based on student feedback and key metrics.
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        <div className="flex flex-wrap gap-4">
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            value={selectedDepartment} 
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <ProfessorPerformanceChart />
      </div>

      <Card className="bg-white border rounded-lg">
        <CardContent className="pt-6">
          {/* Comparative Analysis */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold mb-4">
                Performance Dashboard per Professor
              </h3>
              {/* Export Buttons */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={handleExportPDF}
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-medium shadow"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium shadow"
                >
                  Export Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full text-sm border rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Professor
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Department
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">
                      Teaching Effectiveness
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">
                      Clarity
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">
                      Engagement
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">
                      Workload (units)
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Subjects Handled
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Sections Assigned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {professors.map((prof, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                        {prof.name}
                      </td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {prof.department}
                      </td>
                      <td className="px-4 py-2 text-center text-green-700 font-semibold">
                        {prof.feedback.effectiveness.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-center text-blue-700 font-semibold">
                        {prof.feedback.clarity.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-center text-yellow-700 font-semibold">
                        {prof.feedback.engagement.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-center">{prof.workload}</td>
                      <td className="px-4 py-2">{prof.subjects.join(", ")}</td>
                      <td className="px-4 py-2">{prof.sections.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border rounded-lg mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Student Feedback Insights
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Explore categorized feedback and filter by semester, subject, or
            year level.
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select className="border rounded px-2 py-1 text-sm">
              {feedbackFilters.semesters.map((sem) => (
                <option key={sem}>{sem}</option>
              ))}
            </select>
            <select className="border rounded px-2 py-1 text-sm">
              {feedbackFilters.subjects.map((subj) => (
                <option key={subj}>{subj}</option>
              ))}
            </select>
            <select className="border rounded px-2 py-1 text-sm">
              {feedbackFilters.years.map((yr) => (
                <option key={yr}>{yr}</option>
              ))}
            </select>
          </div>
          {/* Categorized Comments */}
          <div className="space-y-6">
            {feedbackComments.map((fb, idx) => (
              <div key={idx} className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {fb.professor}
                </h4>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      Strengths
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                      {fb.strengths.map((comment, i) => (
                        <li key={i}>{comment}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700 mb-1">
                      Areas for Improvement
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                      {fb.improvements.map((comment, i) => (
                        <li key={i}>{comment}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Comparative Analysis */}
      <Card className="bg-white border rounded-lg mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            {selectedDepartment === "All Departments" 
              ? "Comparative Analysis" 
              : `Comparative Analysis - ${selectedDepartment}`}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Compare professors' performance across departments and over time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-10">
              Average Feedback Score by Department
            </h4>
            <div className="h-full bg-white p-4">
              <ChartContainer
                config={{
                  avgFeedback: { label: "Avg. Feedback", color: "#6366f1" },
                }} className="h-[50vh] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredDepartmentComparison}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barCategoryGap={32}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="department"
                      interval={0}
                      height={30}
                      tick={{ fontSize: 14, fill: "#374151" }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 14, fill: "#374151" }}
                      tickCount={6}
                    />
                    <ChartTooltip />
                    <ChartLegend wrapperStyle={{ fontSize: 14 }} />
                    <Bar
                      dataKey="avgFeedback"
                      fill="#6366f1"
                      name="Average Feedback"
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#111827",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
          <hr />
          <div className="mt-8">
            <h4 className="font-semibold text-gray-900 mb-2">
              {selectedDepartment === "All Departments" 
                ? "Feedback Trends Over Time" 
                : `Feedback Trends Over Time - ${selectedDepartment}`}
            </h4>
            <div className="h-full bg-white p-4 rounded-lg shadow-sm">
              <ChartContainer
                config={{
                  "Computer Studies": {
                    label: "Computer Studies",
                    color: "#3b82f6",
                  },
                  Engineering: { label: "Engineering", color: "#f59e42" },
                  Nursing: { label: "Nursing", color: "#10b981" },
                }}
                className="h-[50vh] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredFeedbackTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 14, fill: "#374151" }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 14, fill: "#374151" }}
                      tickCount={6}
                    />
                    <ChartTooltip />
                    <ChartLegend wrapperStyle={{ fontSize: 16 }} />
                    {selectedDepartment === "All Departments" ? (
                      // Show all department lines when no filter is applied
                      <>
                        <Line
                          type="monotone"
                          dataKey="Computer Studies"
                          stroke="#282828"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#282828",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Engineering"
                          stroke="#CB5F17"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#CB5F17",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Nursing"
                          stroke="#E5058E"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#E5058E",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Business"
                          stroke="#d5cb00ff"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#d5cb00ff",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Arts"
                          stroke="#442283"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#442283",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Education"
                          stroke="#012E71"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#012E71",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}  
                        />
                        <Line 
                          type="monotone"
                          dataKey="Hospitality"
                          stroke="#56121E"
                          strokeWidth={4}
                          dot={{
                            r: 6,
                            fill: "#56121E",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 8 }}  
                        />
                      </>
                    ) : (
                      // Show only the selected department line
                      <Line
                        type="monotone"
                        dataKey={departmentMap[selectedDepartment]}
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={{
                          r: 6,
                          fill: "#3b82f6",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                        activeDot={{ r: 8 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
