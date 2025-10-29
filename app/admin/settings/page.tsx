"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, Edit, Trash2, Plus, Download, Upload } from "lucide-react"
import { useState } from "react"
import { SettingsPageSkeleton } from "@/components/admin/page-skeletons"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)

  if (loading) {
    return <SettingsPageSkeleton />
  }

  return (
    <div className="flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] px-5 py-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-black dark:text-white">System Settings</h1>
              <p className="text-lg text-gray-700 dark:text-gray-400 font-light">Configure system-wide settings, preferences and policies</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
          <Tabs defaultValue="school-year" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-[var(--darkmode-color-one)] border rounded-full p-0 h-full">
              <TabsTrigger
                value="school-year"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-l-full px-3 py-3 hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                School Year / Semester Setup
              </TabsTrigger>
              <TabsTrigger
                value="grading"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white px-3 py-3 rounded-none hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                Grading System Configuration
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-r-full px-3 py-3 hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                System
              </TabsTrigger>
            </TabsList>

            {/* School Year / Semester Setup */}
            <TabsContent value="school-year" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">School Year Settings</h2>
                <div className="flex items-center gap-4">
                  <Select defaultValue="all-years">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All School Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-years">All School Year</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-periods">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-periods">All Period</SelectItem>
                      <SelectItem value="1st-semester">1st Semester</SelectItem>
                      <SelectItem value="2nd-semester">2nd Semester</SelectItem>
                      <SelectItem value="summer">Summer Term</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-green-700 hover:bg-green-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Set School Year
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {/* Final Period 1 */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Final Period</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Done</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">School Year:</span>
                        <span>2023-2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Semester:</span>
                        <span>2nd Semester</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>February 12, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>June 15, 2024</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Midterm Period Done!</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent flex-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Period 2 */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Final Period</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Done</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">School Year:</span>
                        <span>2024-2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Semester:</span>
                        <span>1st Semester</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>January 27, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>May 31, 2025</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Final Period Done!</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent flex-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Midterm Period */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Midterm Period</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Done</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">School Year:</span>
                        <span>2024-2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Semester:</span>
                        <span>2nd Semester</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>August 19, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>December 16, 2024</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Midterm Period Done!</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent flex-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Summer Term */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Summer Term</CardTitle>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">School Year:</span>
                        <span>2024-2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Semester:</span>
                        <span>Mid Year Term</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>June 23, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>August 2, 2025</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="w-3/4 bg-green-500 h-2 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-600">10 days left</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent flex-1">
                        <Trash2 className="w-20 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Midterm Period */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">Midterm Period</CardTitle>
                      <Badge className="bg-yellow-100 text-yellow-800">Upcoming</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">School Year:</span>
                        <span>2025-2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Semester:</span>
                        <span>1st Semester</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>August 19, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>December 15, 2025</span>
                      </div>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full"></div>
                    <p className="text-xs text-gray-600">Starts in 30 days</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="bg-transparent flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent flex-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Grading System Configuration */}
            <TabsContent value="grading" className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Grading System Configuration</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grading System */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Grading System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Attendance Weight (%)</Label>
                        <Input type="number" defaultValue="10" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Performance Weight (%)</Label>
                        <Input type="number" defaultValue="40" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Quizzes Weight (%)</Label>
                        <Input type="number" defaultValue="20" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Midterm / Final Exams Weight (%)</Label>
                        <Input type="number" defaultValue="30" className="mt-1" />
                      </div>
                    </div>
                    <Button className="w-full bg-green-700 hover:bg-green-800">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>

                {/* Grading Scale */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold">Grading Scale</CardTitle>
                    <Button size="sm" className="bg-green-700 hover:bg-green-800">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Row
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-3 text-sm font-medium text-gray-700 pb-2 border-b">
                        <span>Grade</span>
                        <span>GPA</span>
                        <span>Action</span>
                        <span></span>
                      </div>

                      {[
                        { range: "100 to 97.50", gpa: "1.00", color: "bg-green-100 text-green-800" },
                        { range: "97.49 to 94.50", gpa: "1.25", color: "bg-green-100 text-green-800" },
                        { range: "94.49 to 91.50", gpa: "1.50", color: "bg-green-100 text-green-800" },
                        { range: "91.49 to 88.50", gpa: "1.75", color: "bg-green-100 text-green-800" },
                        { range: "88.49 to 85.50", gpa: "2.00", color: "bg-yellow-100 text-yellow-800" },
                        { range: "85.49 to 82.50", gpa: "2.25", color: "bg-yellow-100 text-yellow-800" },
                        { range: "82.49 to 79.50", gpa: "2.50", color: "bg-yellow-100 text-yellow-800" },
                        { range: "79.49 to 76.50", gpa: "2.75", color: "bg-yellow-100 text-yellow-800" },
                        { range: "76.49 to 74.50", gpa: "3.00", color: "bg-yellow-100 text-yellow-800" },
                        { range: "74.49 to 0.00", gpa: "5.00", color: "bg-red-100 text-red-800" },
                      ].map((grade, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3 items-center text-sm">
                          <span className="text-gray-700">{grade.range}</span>
                          <Badge className={grade.color}>{grade.gpa}</Badge>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <span></span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-6 bg-green-700 hover:bg-green-800">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System */}
            <TabsContent value="system" className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">System</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Backup */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Backup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Create Backup</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a complete backup of all system data including users, courses, and grades.
                      </p>
                      <Button className="w-full bg-green-700 hover:bg-green-800">
                        <Download className="w-4 h-4 mr-2" />
                        Create Full Backup
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Restore from Backup</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload and restore system data from a previous backup file.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Backup file
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Automatic Backup Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Enable Automatic Backups</p>
                            <p className="text-sm text-gray-600">Automatically create system backups</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Backup Frequency</Label>
                          <Select defaultValue="daily">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Backup Retention (Days)</Label>
                          <Select defaultValue="30">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30</SelectItem>
                              <SelectItem value="60">60</SelectItem>
                              <SelectItem value="90">90</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-green-700 hover:bg-green-800">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>

                {/* Notification */}
                <Card className="bg-white border rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Notification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Student Registration</p>
                            <p className="text-sm text-gray-600">Notify when students register for courses</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Grade Submissions</p>
                            <p className="text-sm text-gray-600">Alert when professors submit grades</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">System Maintenance</p>
                            <p className="text-sm text-gray-600">Send maintenance notifications</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">SMTP Server</Label>
                        <Input defaultValue="registrar@plpasig.edu.ph" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">SMTP Port</Label>
                        <Input defaultValue="587" className="mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">From Email Address</Label>
                        <Input defaultValue="registrar@plpasig.edu.ph" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">From Name</Label>
                        <Input defaultValue="Academic Management System" className="mt-1" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Test Email Configuration
                      </Button>
                      <Button className="bg-green-700 hover:bg-green-800 flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}