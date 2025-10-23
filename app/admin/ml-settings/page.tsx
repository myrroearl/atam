import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Database,
  Play,
  Pause,
  RefreshCw,
  Upload,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Trash2,
  Eye,
  Plus,
} from "lucide-react"

const modelMetrics = [
  {
    name: "Dropout Prediction Model",
    version: "v2.1.3",
    accuracy: 87.4,
    precision: 89.2,
    recall: 85.6,
    f1Score: 87.3,
    status: "Active",
    lastTrained: "2024-07-15 14:30:00",
    trainingTime: "2h 45m",
    datasetSize: "45,892 records",
  },
  {
    name: "Grade Prediction Model",
    version: "v1.8.2",
    accuracy: 82.1,
    precision: 84.5,
    recall: 79.8,
    f1Score: 82.1,
    status: "Active",
    lastTrained: "2024-07-12 09:15:00",
    trainingTime: "1h 32m",
    datasetSize: "67,234 records",
  },
  {
    name: "At-Risk Student Identification",
    version: "v3.0.1",
    accuracy: 91.7,
    precision: 93.2,
    recall: 90.1,
    f1Score: 91.6,
    status: "Training",
    lastTrained: "2024-07-18 10:00:00",
    trainingTime: "In Progress",
    datasetSize: "52,156 records",
  },
  {
    name: "Course Recommendation Engine",
    version: "v1.5.4",
    accuracy: 76.8,
    precision: 78.9,
    recall: 74.2,
    f1Score: 76.4,
    status: "Inactive",
    lastTrained: "2024-07-08 16:45:00",
    trainingTime: "3h 12m",
    datasetSize: "38,947 records",
  },
]

const datasets = [
  {
    id: "DS-001",
    name: "Student Academic Records",
    description: "Historical academic performance data including grades, attendance, and course completion",
    size: "2.4 GB",
    records: "125,847",
    lastUpdated: "2024-07-18 08:00:00",
    status: "Active",
    quality: 94,
    usedBy: ["Dropout Prediction", "Grade Prediction", "At-Risk Identification"],
  },
  {
    id: "DS-002",
    name: "Enrollment History",
    description: "Student enrollment patterns, course selections, and registration data",
    size: "1.8 GB",
    records: "89,234",
    lastUpdated: "2024-07-17 12:30:00",
    status: "Active",
    quality: 91,
    usedBy: ["Course Recommendation", "Dropout Prediction"],
  },
  {
    id: "DS-003",
    name: "Faculty Performance Data",
    description: "Teaching effectiveness metrics, student feedback, and course outcomes",
    size: "856 MB",
    records: "34,567",
    lastUpdated: "2024-07-16 15:45:00",
    status: "Processing",
    quality: 88,
    usedBy: ["Grade Prediction"],
  },
  {
    id: "DS-004",
    name: "Demographic Information",
    description: "Student demographic data including age, location, socioeconomic factors",
    size: "1.2 GB",
    records: "67,891",
    lastUpdated: "2024-07-15 09:20:00",
    status: "Active",
    quality: 96,
    usedBy: ["At-Risk Identification", "Dropout Prediction"],
  },
  {
    id: "DS-005",
    name: "Behavioral Analytics",
    description: "Learning management system usage patterns and engagement metrics",
    size: "3.1 GB",
    records: "234,567",
    lastUpdated: "2024-07-14 11:15:00",
    status: "Inactive",
    quality: 82,
    usedBy: ["At-Risk Identification"],
  },
]

const trainingJobs = [
  {
    id: "TJ-2024-001",
    modelName: "At-Risk Student Identification",
    status: "Running",
    progress: 67,
    startTime: "2024-07-18 10:00:00",
    estimatedCompletion: "2024-07-18 16:30:00",
    currentEpoch: "134/200",
    currentLoss: 0.0847,
  },
  {
    id: "TJ-2024-002",
    modelName: "Dropout Prediction Model",
    status: "Completed",
    progress: 100,
    startTime: "2024-07-15 12:00:00",
    estimatedCompletion: "2024-07-15 14:45:00",
    currentEpoch: "200/200",
    currentLoss: 0.0623,
  },
  {
    id: "TJ-2024-003",
    modelName: "Grade Prediction Model",
    status: "Queued",
    progress: 0,
    startTime: "Pending",
    estimatedCompletion: "Pending",
    currentEpoch: "0/150",
    currentLoss: null,
  },
]

export default function MLSettingsPage() {
  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">ML Settings</h1>
          <p className="text-gray-700 dark:text-gray-400">Manage AI models, datasets, and machine learning configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-white border-none text-[var(--customized-color-one)] hover:bg-green-50 dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]">
            <Settings className="w-4 h-4" />
            ML Configuration
          </Button>
          <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Trigger Re-training
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Models</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">87.1%</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Datasets</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Training Jobs</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="datasets" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Datasets
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Training Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Model Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {modelMetrics.map((model) => (
                  <Card key={model.name} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{model.name}</h3>
                          <p className="text-sm text-gray-600">{model.version}</p>
                        </div>
                        <Badge
                          variant={
                            model.status === "Active"
                              ? "default"
                              : model.status === "Training"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            model.status === "Active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : model.status === "Training"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {model.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Accuracy</p>
                          <div className="flex items-center gap-2">
                            <Progress value={model.accuracy} className="flex-1" />
                            <span className="text-sm font-medium">{model.accuracy}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Precision</p>
                          <div className="flex items-center gap-2">
                            <Progress value={model.precision} className="flex-1" />
                            <span className="text-sm font-medium">{model.precision}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Recall</p>
                          <div className="flex items-center gap-2">
                            <Progress value={model.recall} className="flex-1" />
                            <span className="text-sm font-medium">{model.recall}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">F1-Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={model.f1Score} className="flex-1" />
                            <span className="text-sm font-medium">{model.f1Score}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Trained:</span>
                          <span className="text-gray-900">{model.lastTrained}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Training Time:</span>
                          <span className="text-gray-900">{model.trainingTime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dataset Size:</span>
                          <span className="text-gray-900">{model.datasetSize}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retrain
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={
                            model.status === "Active"
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }
                        >
                          {model.status === "Active" ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datasets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Dataset Management
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dataset
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <Card key={dataset.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                            <Badge
                              variant={
                                dataset.status === "Active"
                                  ? "default"
                                  : dataset.status === "Processing"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                dataset.status === "Active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : dataset.status === "Processing"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {dataset.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{dataset.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Size</p>
                              <p className="text-sm font-medium">{dataset.size}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Records</p>
                              <p className="text-sm font-medium">{dataset.records}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Quality Score</p>
                              <div className="flex items-center gap-2">
                                <Progress value={dataset.quality} className="flex-1 h-2" />
                                <span className="text-sm font-medium">{dataset.quality}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Last Updated</p>
                              <p className="text-sm font-medium">{dataset.lastUpdated}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Used by Models:</p>
                            <div className="flex flex-wrap gap-1">
                              {dataset.usedBy.map((model) => (
                                <Badge key={model} variant="outline" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Training Jobs
                </CardTitle>
                <Button className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  New Training Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingJobs.map((job) => (
                  <Card key={job.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.modelName}</h3>
                          <p className="text-sm text-gray-600">Job ID: {job.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              job.status === "Running"
                                ? "default"
                                : job.status === "Completed"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              job.status === "Running"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : job.status === "Completed"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {job.status === "Running" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                            {job.status === "Completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {job.status === "Queued" && <Clock className="w-3 h-3 mr-1" />}
                            {job.status}
                          </Badge>
                          {job.status === "Running" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Stop
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Start Time</p>
                            <p className="font-medium">{job.startTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Est. Completion</p>
                            <p className="font-medium">{job.estimatedCompletion}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Epoch</p>
                            <p className="font-medium">{job.currentEpoch}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Loss</p>
                            <p className="font-medium">{job.currentLoss || "N/A"}</p>
                          </div>
                        </div>

                        {job.status === "Running" && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span className="text-sm font-medium">Training in progress...</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              Estimated time remaining: {Math.round((100 - job.progress) * 0.5)} minutes
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Training Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Select Model</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a model to train" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropout">Dropout Prediction Model</SelectItem>
                      <SelectItem value="grade">Grade Prediction Model</SelectItem>
                      <SelectItem value="at-risk">At-Risk Student Identification</SelectItem>
                      <SelectItem value="recommendation">Course Recommendation Engine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataset-select">Training Dataset</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose training dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Student Academic Records</SelectItem>
                      <SelectItem value="enrollment">Enrollment History</SelectItem>
                      <SelectItem value="faculty">Faculty Performance Data</SelectItem>
                      <SelectItem value="demographic">Demographic Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="epochs">Number of Epochs</Label>
                  <Input type="number" defaultValue="200" min="50" max="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input type="number" defaultValue="32" min="16" max="128" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learning-rate">Learning Rate</Label>
                  <Input type="number" step="0.001" defaultValue="0.001" min="0.0001" max="0.1" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-stop" defaultChecked />
                  <Label htmlFor="auto-stop">Enable early stopping</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="validation" defaultChecked />
                  <Label htmlFor="validation">Use validation split (20%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" defaultChecked />
                  <Label htmlFor="notifications">Send completion notifications</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Save Configuration</Button>
                <Button className="bg-green-700 hover:bg-green-800">
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
