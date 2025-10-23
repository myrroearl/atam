"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  DollarSign,
  Calendar,
  Users,
  Award,
  ExternalLink,
  Filter,
  BookOpen,
  GraduationCap,
  Heart,
} from "lucide-react"

type ScholarshipRow = {
  scholarship_id: number
  scholarship_name: string
  description: string | null
  requirements: string | null
  application_link: string | null
  eligibility_criteria: string | null
  created_at: string
}

const categories = ["All", "STEM", "Academic", "Leadership", "Diversity", "Service", "Research"]
const amounts = [
  "All",
  "₱100,000-₱149,999",
  "₱150,000-₱199,999",
  "₱200,000+",
]

export function ScholarshipFinder() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedAmount, setSelectedAmount] = useState("All")
  const [rows, setRows] = useState<ScholarshipRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/student/scholarships", { cache: "no-store" })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b.error || `Failed: ${res.status}`)
        }
        const b = await res.json()
        if (active) setRows(b.scholarships || [])
      } catch (e: any) {
        if (active) setError(e.message || "Failed to load scholarships")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const scholarships = useMemo(() => {
    // Map DB rows to UI model with placeholders for fields not in DB
    return rows.map((r) => ({
      id: r.scholarship_id,
      title: r.scholarship_name,
      organization: "", // not in schema
      amount: 0, // not in schema
      deadline: new Date(r.created_at).toISOString(), // placeholder
      category: "Academic", // placeholder category
      gpaRequirement: 0, // placeholder
      match: 80, // placeholder
      description: r.description || "",
      requirements: (r.requirements || "").split("; ").filter(Boolean),
      renewable: false,
      applicants: 0,
      awards: 0,
      application_link: r.application_link || null,
    }))
  }, [rows])

  const [filteredScholarships, setFilteredScholarships] = useState(scholarships)

  useEffect(() => {
    setFilteredScholarships(scholarships)
  }, [scholarships])

  const handleSearch = () => {
    let filtered = scholarships

    if (searchTerm) {
      filtered = filtered.filter(
        (scholarship) =>
          scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scholarship.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scholarship.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((scholarship) => scholarship.category === selectedCategory)
    }

    if (selectedAmount !== "All") {
      filtered = filtered.filter((scholarship) => {
        switch (selectedAmount) {
          case "₱100,000-₱149,999":
            return scholarship.amount >= 100000 && scholarship.amount <= 149999
          case "₱150,000-₱199,999":
            return scholarship.amount >= 150000 && scholarship.amount <= 199999
          case "₱200,000+":
            return scholarship.amount >= 200000
          default:
            return true
        }
      })
    }

    setFilteredScholarships(filtered)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "STEM":
        return <BookOpen className="w-4 h-4" />
      case "Academic":
        return <GraduationCap className="w-4 h-4" />
      case "Leadership":
        return <Users className="w-4 h-4" />
      case "Diversity":
        return <Heart className="w-4 h-4" />
      case "Service":
        return <Heart className="w-4 h-4" />
      case "Research":
        return <Search className="w-4 h-4" />
      default:
        return <Award className="w-4 h-4" />
    }
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (match >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (match >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return (
    <div className="space-y-6">
      {loading && <p className="text-sm text-muted-foreground">Loading scholarships...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Scholarship Finder
        </h1>
        <p className="text-muted-foreground">
          Discover scholarship opportunities tailored to your profile and interests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">$85K</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">High Match</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search scholarships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAmount} onValueChange={setSelectedAmount}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Amount" />
              </SelectTrigger>
              <SelectContent>
                {amounts.map((amount) => (
                  <SelectItem key={amount} value={amount}>
                    {amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Scholarships</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredScholarships.map((scholarship) => (
              <Card key={scholarship.id} className="glass-card shadow-card hover:shadow-card-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{scholarship.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <span>{scholarship.organization}</span>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getCategoryIcon(scholarship.category)}
                          <span>{scholarship.category}</span>
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className={getMatchColor(scholarship.match)}>{scholarship.match}% match</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{scholarship.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">₱{scholarship.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{new Date(scholarship.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{scholarship.applicants} applicants</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>{scholarship.awards} awards</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Requirements:</h4>
                    <div className="flex flex-wrap gap-1">
                      {scholarship.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      {scholarship.renewable && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                          Renewable
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">GPA: {scholarship.gpaRequirement}+</span>
                    </div>
                    <Button size="sm" className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>Apply</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredScholarships
              .filter((s) => s.match >= 85)
              .map((scholarship) => (
                <Card key={scholarship.id} className="glass-card border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{scholarship.title}</span>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Recommended
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <span>{scholarship.organization}</span>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getCategoryIcon(scholarship.category)}
                            <span>{scholarship.category}</span>
                          </Badge>
                        </CardDescription>
                      </div>
                      <Badge className={getMatchColor(scholarship.match)}>{scholarship.match}% match</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{scholarship.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">₱{scholarship.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{new Date(scholarship.deadline).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <Button className="w-full gradient-purple text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          <Card className="glass-card shadow-card">
            <CardHeader className="text-center">
              <CardTitle>No Applications Yet</CardTitle>
              <CardDescription>
                You haven't applied to any scholarships yet. Start by exploring the recommended scholarships!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
              <Button className="gradient-purple text-white">Browse Scholarships</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      <Card className="glass-card border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Award className="w-3 h-3 text-white" />
            </div>
            <span>AI Scholarship Insights</span>
          </CardTitle>
          <CardDescription>Personalized recommendations based on your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Strong STEM Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Your excellent grades in mathematics and sciences make you a strong candidate for STEM scholarships.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Application Deadlines</p>
                  <p className="text-sm text-muted-foreground">
                    3 high-match scholarships have deadlines within the next month. Apply soon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}