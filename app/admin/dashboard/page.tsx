"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PiStudentBold, PiCalendarDotsBold } from "react-icons/pi";
import React from "react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { InteractiveBarChart } from "@/components/admin/interactive-bar-chart"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  BarChart3, 
  UserCheck, 
  AlertCircle,
  ArrowRight,
  Trophy, AlertTriangle, TrendingDown, TriangleAlert,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { DashboardSkeleton } from "@/components/admin/page-skeletons"
import { Announcement } from "@/types/announcement"
import { formatDistanceToNow } from "date-fns"



export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const router = useRouter()
  const { data: dashboardData, loading, error, refreshData } = useDashboardData()
  const [notifications, setNotifications] = useState<Announcement[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const { theme } = useTheme()

  // Dynamic colors based on theme
  const getSegmentColors = () => {
    const isDark = theme === 'dark'
    return {
      high: {
        color: isDark ? "var(--darkmode-color-one)" : "var(--customized-color-one)",
        textColor: isDark ? "black" : "white"
      },
      low: {
        color: isDark ? "var(--darkmode-color-two)" : "var(--customized-color-three)", 
        textColor: isDark ? "black" : "white"
      },
      medium: {
        color: isDark ? "var(--darkmode-color-three)" : "var(--customized-color-two)",
        textColor: isDark ? "black" : "white"
      }
    }
  }

  const segmentColors = getSegmentColors()

  const donutSegments = [
    {
      key: "high",
      label: "High Risk",
      percent: 64,
      color: segmentColors.high.color,
      textColor: segmentColors.high.textColor,
      value: 734,
      change: "+10% from last month",
      cx: "120",
      cy: "120",
      r: 90,
      strokeWidth: 40,
      dasharray: `${2 * Math.PI * 90 * 0.64} ${2 * Math.PI * 90 * 0.36}`,
      dashoffset: "0",
      labelStyle: {
        right: "60%",
        bottom: "0%",
        transform: "translate(-50%, 0)",
        textAlign: "center" as const,
        width: "90px",
      },
      labelClass: "absolute",
    },
    {
      key: "low",
      label: "Low Risk",
      percent: 22,
      color: segmentColors.low.color,
      textColor: segmentColors.low.textColor,
      value: 900,
      change: "+10% from last month",
      dasharray: `${2 * Math.PI * 90 * 0.22} ${2 * Math.PI * 90 * 0.78}`,
      dashoffset: `-${2 * Math.PI * 90 * 0.64}`,
      labelStyle: {
        left: "50%",
        top: "-6%",
        transform: "translate(-50%, -50%)",
        textAlign: "center" as const,
        width: "140px",
      },
      labelClass: "absolute flex gap-1",
    },
    {
      key: "medium",
      label: "Medium Risk",
      percent: 18,
      color: segmentColors.medium.color,
      textColor: segmentColors.medium.textColor,
      value: 230,
      change: "-10% from last month",
      dasharray: `${2 * Math.PI * 90 * 0.18} ${2 * Math.PI * 90 * 0.90}`,
      dashoffset: `-${2 * Math.PI * 90 * 0.86}`,
      labelStyle: {
        left: "122%",
        top: "20%",
        transform: "translate(-50%, -50%)",
        textAlign: "center" as const,
        width: "130px",
      },
      labelClass: "absolute",
    },
  ];

  const dropoutData = [
    { year: "2019", predicted: 140, actual: 120 },
    { year: "2020", predicted: 180, actual: 160 },
    { year: "2021", predicted: 190, actual: 170 },
    { year: "2022", predicted: 200, actual: 180 },
    { year: "2023", predicted: 185, actual: 165 },
    { year: "2024", predicted: 140, actual: 125 },
  ]

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/")
      return
    }

    if (session.user.role !== "admin") {
      router.push("/")
      return
    }
  }, [session, status, router])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true)
        const response = await fetch("/api/admin/announcements")
        
        if (response.ok) {
          const data = await response.json()
          // Get only the 5 most recent notifications
          setNotifications(data.notifications?.slice(0, 5) || [])
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setNotificationsLoading(false)
      }
    }

    if (status === "authenticated" && session?.user.role === "admin") {
      fetchNotifications()
    }
  }, [status, session])

  if (status === "loading" || loading) {
    return <DashboardSkeleton />
  }

  if (!session || session.user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      <div className="space-y-4 p-5 w-full">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-black dark:text-white">Dashboard</h1>
            <p className="text-lg text-gray-700 dark:text-gray-400">Welcome back, {session.user.email}! Here's what's happening at PLP</p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md">
                {error}
              </div>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Active Students Card */}
          <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 group shadow-md dark:shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 tracking-wide">Active Students</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {dashboardData?.dashboard_stats.active_students.total.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(dashboardData?.dashboard_stats.active_students.growth_percentage ?? 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-600" />
                      )}
                      <span className={`text-xs font-light ${
                        (dashboardData?.dashboard_stats.active_students.growth_percentage ?? 0) >= 0 
                          ? 'text-green-500 dark:text-green-700' 
                          : 'text-red-500 dark:text-red-700'
                      }`}>
                        {(dashboardData?.dashboard_stats.active_students.growth_percentage ?? 0) >= 0 ? '+' : ''}
                        {dashboardData?.dashboard_stats.active_students.growth_percentage || 0}%
                      </span>
                    </div>
                    <span className={`text-xs font-light ${
                      (dashboardData?.dashboard_stats.active_students.growth_percentage ?? 0) >= 0 
                        ? 'text-green-500 dark:text-green-700' 
                        : 'text-red-500 dark:text-red-700'
                    }`}>
                      {dashboardData?.dashboard_stats.active_students.period || 'from last semester'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[var(--customized-color-two)] text-white rounded-full group-hover:scale-110 transition-all duration-500 flex items-center justify-center align-middle dark:bg-[var(--darkmode-color-two)] dark:text-black">
                  <PiStudentBold className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Professors Card */}
          <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 group shadow-md dark:shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 tracking-wide">Active Professors</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {dashboardData?.dashboard_stats.active_professors.total.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(dashboardData?.dashboard_stats.active_professors.growth_percentage ?? 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-600" />
                      )}
                      <span className={`text-xs font-light ${
                        (dashboardData?.dashboard_stats.active_professors.growth_percentage ?? 0) >= 0 
                          ? 'text-green-500 dark:text-green-700' 
                          : 'text-red-500 dark:text-red-800'
                      }`}>
                        {(dashboardData?.dashboard_stats.active_professors.growth_percentage ?? 0) >= 0 ? '+' : ''}
                        {dashboardData?.dashboard_stats.active_professors.growth_percentage || 0}%
                      </span>
                    </div>
                    <span className={`text-xs font-light ${
                      (dashboardData?.dashboard_stats.active_professors.growth_percentage ?? 0) >= 0 
                        ? 'text-green-500 dark:text-green-700' 
                        : 'text-red-500 dark:text-red-800'
                    }`}>
                      {dashboardData?.dashboard_stats.active_professors.period || 'from last school year'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[var(--customized-color-three)] text-white rounded-full group-hover:scale-110 transition-all duration-500 flex items-center justify-center align-middle dark:bg-[var(--darkmode-color-three)] dark:text-black">
                  <FaChalkboardTeacher className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Students Card */}
          <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 group shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 tracking-wide">Top Performing Students</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {dashboardData?.dashboard_stats.top_performers.total.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(dashboardData?.dashboard_stats.top_performers.growth_percentage ?? 0) >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-600" />
                      )}
                      <span className={`text-xs font-light ${
                        (dashboardData?.dashboard_stats.top_performers.growth_percentage ?? 0) >= 0 
                          ? 'text-green-500 dark:text-green-700' 
                          : 'text-red-500 dark:text-red-700'
                      }`}>
                        {(dashboardData?.dashboard_stats.top_performers.growth_percentage ?? 0) >= 0 ? '+' : ''}
                        {dashboardData?.dashboard_stats.top_performers.growth_percentage || 0}%
                      </span>
                    </div>
                    <span className={`text-xs font-light ${
                      (dashboardData?.dashboard_stats.top_performers.growth_percentage ?? 0) >= 0 
                        ? 'text-green-500 dark:text-green-700' 
                        : 'text-red-500 dark:text-red-700'
                    }`}>
                      {dashboardData?.dashboard_stats.top_performers.period || 'from last semester'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[var(--customized-color-two)] text-white rounded-full group-hover:scale-110 transition-all duration-500 flex items-center justify-center align-middle dark:bg-[var(--darkmode-color-two)] dark:text-black">
                  <PiStudentBold className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unauthorized Logs Card */}
          <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 group shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 tracking-wide">Unauthorized Logs</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {dashboardData?.dashboard_stats.unauthorized_logs.total.toLocaleString() || '0'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(dashboardData?.dashboard_stats.unauthorized_logs.growth_percentage ?? 0) >= 0 ? (
                        <TriangleAlert className="w-4 h-4 text-red-600 dark:text-red-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-600" />
                      )}
                      <span className={`text-xs font-light ${
                        (dashboardData?.dashboard_stats.unauthorized_logs.growth_percentage ?? 0) >= 0 
                          ? 'text-red-500 dark:text-red-700' 
                          : 'text-green-500 dark:text-green-700'
                      }`}>
                        {(dashboardData?.dashboard_stats.unauthorized_logs.growth_percentage ?? 0) >= 0 ? '+' : ''}
                        {dashboardData?.dashboard_stats.unauthorized_logs.growth_percentage || 0}%
                      </span>
                    </div>
                    <span className={`text-xs font-light ${
                      (dashboardData?.dashboard_stats.unauthorized_logs.growth_percentage ?? 0) >= 0 
                        ? 'text-red-500 dark:text-red-700' 
                        : 'text-green-500 dark:text-green-700'
                    }`}>
                      {dashboardData?.dashboard_stats.unauthorized_logs.period || 'from last 24 hours'}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[var(--customized-color-three)] text-white rounded-full group-hover:scale-110 transition-all duration-500 flex items-center justify-center align-middle dark:bg-[var(--darkmode-color-three)] dark:text-black">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - At-Risk Students */}
          <div className="lg:col-span-2 space-y-4">
            {/* At-Risk Students */}
            <Card className="bg-white dark:bg-black border-0 shadow-md transition-all duration-200 w-full">
              <CardHeader className="pb-10">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-black dark:text-white">At-Risk Students</CardTitle>
                  <p className="text-md text-gray-700 dark:text-gray-400 font-light">Monthly progression of student academic risk levels</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center justify-center gap-20 pb-6">
                {/* Donut Chart */}
                <div className="relative w-[200px] h-[200px]">
                  <svg width="200" height="200" viewBox="0 -10 250 260" className="block">
                    {donutSegments.map((seg, idx) => (
                      <circle
                        key={seg.key}
                        cx="120"
                        cy="120"
                        r="90"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="50"
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={seg.dashoffset}
                        style={{ transition: "transform 0.2s ease-in-out, filter 0.2s ease-in-out", filter: hoveredSegment === seg.key ? "brightness(0px)" : "none", transform: hoveredSegment === seg.key ? "scale(1.05)" : "scale(1)", transformOrigin: "center" }}
                        onMouseEnter={() => setHoveredSegment(seg.key)}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    ))}
                  </svg>
                  {/* Labels inside donut, only show on hover */}
                  <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                    {donutSegments.map((seg) =>
                      hoveredSegment === seg.key ? (
                        <div
                          key={seg.key}
                          className={seg.labelClass}
                          style={seg.labelStyle}
                        >
                          <span
                            className="text-sm font-bold px-2 py-1 rounded"
                            style={{
                              background: seg.color,
                              color: seg.textColor,
                            }}
                          >
                            {seg.percent}%
                          </span>
                          <div
                            className="text-base font-semibold justify-center items-center flex"
                            style={{ color: seg.color }}
                          >
                            {seg.label}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
                {/* Right Side Stats */}
                <div className="flex flex-col gap-8 pl-10">
                  {/* Low Risk */}
                  <div className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: segmentColors.low.color }}></span>
                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white text-center">900</div>
                      <div className="flex gap-1">
                        <TrendingUp className="w-4 h-4 text-red-500 dark:text-red-600 inline" />
                        <div className="text-xs text-red-500 dark:text-red-700 font-light">+10% from last month</div>
                      </div>
                    </div>
                  </div>
                  {/* Medium Risk */}
                  <div className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: segmentColors.medium.color }}></span>
                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white text-center">230</div>
                      <div className="flex gap-1">
                        <TrendingDown className="w-4 h-4 text-green-500 dark:text-green-600 inline" />
                        <div className="text-xs text-green-500 dark:text-green-700 font-light">-10% from last month</div>
                      </div>
                    </div>
                  </div>
                  {/* High Risk */}
                  <div className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: segmentColors.high.color }}></span>
                    <div>
                      <div className="text-2xl font-bold text-black dark:text-white text-center">734</div>
                      <div className="flex gap-1">
                        <TrendingUp className="w-4 h-4 text-red-500 dark:text-red-600 inline" />
                        <div className="text-xs text-red-500 dark:text-red-700 font-light">+10% from last month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dropout Prediction Trends */}
            <Card className="bg-white dark:bg-black border-0 shadow-md transition-all duration-200 w-full">
              <CardHeader className="pb-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-black dark:text-white">Dropout Prediction Trends</CardTitle>
                  <p className="text-md text-gray-700 dark:text-gray-400 font-light">Yearly comparison of predicted vs actual student dropouts</p>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <InteractiveBarChart data={dropoutData} title="Dropout Prediction Trends" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alerts */}
          <div className="lg:col-span-1 h-90">
            <Card className="bg-white dark:bg-black border-0 shadow-md transition-all duration-200 w-full">
              <CardHeader className="">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-black dark:text-white">Alerts</CardTitle>
                  <p className="text-md text-gray-700 dark:text-gray-400 font-light">Recent announcements and notifications</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first announcement to get started</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => {
                    const isUrgent = notification.type === 'urgent'
                    const isAnnouncement = notification.type === 'announcement'
                    const isGeneral = notification.type === 'general'
                    const isReminder = notification.type === 'reminder'
                    const isEvent = notification.type === 'event'
                    const isUnread = !notification.status || notification.status === 'unread'
                    
                    // Get icon color based on type
                    const getIconColor = () => {
                      if (isUrgent) return 'text-red-500 dark:text-red-600'
                      if (isAnnouncement) return 'text-blue-500 dark:text-blue-600'
                      if (isGeneral) return 'text-emerald-500 dark:text-emerald-600'
                      if (isReminder) return 'text-yellow-500 dark:text-yellow-600'
                      if (isEvent) return 'text-purple-500 dark:text-purple-600'
                      return 'text-[var(--customized-color-two)] dark:text-[var(--darkmode-color-two)]'
                    }

                    return (
                      <div 
                        key={notification.notification_id}
                        role="article" 
                        aria-label={`${notification.type || 'Notification'}: ${notification.message.substring(0, 50)}...`}
                        className={`flex items-start gap-4 transition-all duration-200 rounded-lg hover:bg-[var(--customized-color-five)] hover:border-none dark:hover:bg-[var(--darkmode-color-five)] dark:!border-[var(--darkmode-color-four)] p-3 border border-[var(--customized-color-four)]`}
                        title={notification.receiver}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs capitalize font-semibold ${getIconColor()}`}>
                                {notification.type || 'Notification'}
                              </span>
                              {isUnread && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-black dark:text-gray-300 leading-relaxed line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PiCalendarDotsBold className={`w-4 h-4 text-gray-400`} />
                              <p className="text-xs text-gray-400 dark:text-gray-400">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs capitalize text-black dark:text-white border border-gray-400 dark:border-gray-800">
                                {notification.receiver_role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
              <CardFooter className="w-full">
                <Link href="/admin/announcements" className="w-full">
                  <Button className="w-full text-white border-none hover:bg-[var(--customized-color-two)] hover:text-white hover:border-none bg-[var(--customized-color-one)] border-[var(--customized-color-four)] rounded-lg py-3 font-medium transition-colors duration-300 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black">
                    View All Alerts
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}