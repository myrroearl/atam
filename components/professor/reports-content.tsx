"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Eye, Filter, BarChart3 } from "lucide-react"

export function ReportsContent() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [selectedType, setSelectedType] = useState("")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Generate Reports
        </h1>
        <p className="text-muted-foreground">Create comprehensive reports for your classes and student performance</p>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>Step-by-step report generation wizard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math101">Capstone 1</SelectItem>
                  <SelectItem value="physics201">Programming</SelectItem>
                  <SelectItem value="chem301">Networking</SelectItem>
                  <SelectItem value="all">All Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grading Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Semester</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="final">Final Grades</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grades">Grade Report</SelectItem>
                  <SelectItem value="performance">Performance Analysis</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="risk">At-Risk Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1" disabled={!selectedClass || !selectedPeriod || !selectedType}>
              <Eye className="mr-2 h-4 w-4" />
              Preview Report
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={!selectedClass || !selectedPeriod || !selectedType}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={!selectedClass || !selectedPeriod || !selectedType}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Pre-configured reports ready to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Class Performance Summary</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Overall performance metrics for all classes</p>
              <Badge variant="secondary">Ready to generate</Badge>
            </div>

            <div className="p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Grade Distribution</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Letter grade distribution across all students</p>
              <Badge variant="secondary">Ready to generate</Badge>
            </div>

            <div className="p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-red-500" />
                <h4 className="font-medium">At-Risk Students</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Students who may need additional support</p>
              <Badge variant="destructive">3 students</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
