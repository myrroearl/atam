"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, Moon, Sun, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useThemeToggle } from "@/hooks/use-theme-toggle"
import { RiMenu3Fill } from "react-icons/ri";
import { useSidebar } from "@/components/ui/sidebar"
import { generateAcronym } from "@/lib/utils"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { NavigationSkeleton } from "./navigation-skeleton"

const breadcrumbMap: Record<string, string[]> = {
  "/admin/dashboard": ["Dashboard"],
  "/admin/users/professors": ["Professors"],
  "/admin/users/students": ["Students"],
  "/admin/curriculum": ["Curriculum"],
  "/admin/sections": ["Sections"],
  "/admin/classes": ["Classes"],
  "/admin/settings": ["System Settings"],
  "/admin/analytics": ["Analytics"],
  "/admin/audit-logs": ["Activity Logs"],
  "/admin/announcements": ["Announcements"],
  "/admin/ml-settings": ["ML Settings"],
  "/admin/archive": ["Archive"],
}

export function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isDark, toggleTheme, mounted } = useThemeToggle()
  const { isMobile, setOpen, setOpenMobile, open, openMobile } = useSidebar()
  const [dynamicBreadcrumbs, setDynamicBreadcrumbs] = useState<string[]>([])
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const { data: session, status } = useSession()

  // NEW: scrolled state to toggle blur background
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // threshold in px when blur should appear
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Handle dynamic breadcrumbs for curriculum and student pages
  useEffect(() => {
    const handleDynamicBreadcrumbs = async () => {
      // Check if we're on any student detail page (including performance)
      const studentDetailMatch = pathname.match(/^\/admin\/users\/students\/(\d+)(?:\/performance)?$/)
      if (studentDetailMatch) {
        try {
          const studId = studentDetailMatch[1]
          setStudentId(studId)
          const response = await fetch(`/api/admin/students/${studId}`)
          if (response.ok) {
            const data = await response.json()
            const student = data.student
            if (student) {
              // Format: Last Name, First Name Middle Name
              const studentName = student.middle_name 
                ? `${student.last_name}, ${student.first_name} ${student.middle_name}`
                : `${student.last_name}, ${student.first_name}`
              setDynamicBreadcrumbs(["Students", studentName])
            } else {
              setDynamicBreadcrumbs(["Students", "Student Name"])
            }
          } else {
            setDynamicBreadcrumbs(["Students", "Student Name"])
          }
        } catch (error) {
          console.error('Error fetching student for breadcrumbs:', error)
          setDynamicBreadcrumbs(["Students", "Student Name"])
        }
      }
      // Check if we're on a department courses page
      else if (pathname.match(/^\/admin\/curriculum\/(\d+)\/courses$/)) {
        try {
          const matches = pathname.match(/^\/admin\/curriculum\/(\d+)\/courses$/)
          if (matches) {
            const deptId = matches[1]
            setDepartmentId(deptId)
            const response = await fetch(`/api/admin/department/${deptId}`)
            if (response.ok) {
              const data = await response.json()
              const department = data.department
              if (department) {
                const acronym = generateAcronym(department.department_name)
                setDynamicBreadcrumbs(["Curriculum", acronym])
              } else {
                setDynamicBreadcrumbs(["Curriculum", "Courses"])
              }
            } else {
              setDynamicBreadcrumbs(["Curriculum", "Courses"])
            }
          }
        } catch (error) {
          console.error('Error fetching department for breadcrumbs:', error)
          setDynamicBreadcrumbs(["Curriculum", "Courses"])
        }
      } 
      // Check if we're on a subjects page
      else if (pathname.match(/^\/admin\/curriculum\/(\d+)\/courses\/(\d+)\/subjects$/)) {
        try {
          const matches = pathname.match(/^\/admin\/curriculum\/(\d+)\/courses\/(\d+)\/subjects$/)
          if (matches) {
            const deptId = matches[1]
            const courseId = matches[2]
            setDepartmentId(deptId)
            
            // Fetch department and course data
            const [deptResponse, courseResponse] = await Promise.all([
              fetch(`/api/admin/department/${deptId}`),
              fetch(`/api/admin/course/${courseId}`)
            ])
            
            if (deptResponse.ok && courseResponse.ok) {
              const [deptData, courseData] = await Promise.all([
                deptResponse.json(),
                courseResponse.json()
              ])
              
              const department = deptData.department
              const course = courseData.course
              
              if (department && course) {
                const acronym = generateAcronym(department.department_name)
                setDynamicBreadcrumbs(["Curriculum", acronym, course.course_code])
              } else {
                setDynamicBreadcrumbs(["Curriculum", "Courses", "Subjects"])
              }
            } else {
              setDynamicBreadcrumbs(["Curriculum", "Courses", "Subjects"])
            }
          }
        } catch (error) {
          console.error('Error fetching data for subjects breadcrumbs:', error)
          setDynamicBreadcrumbs(["Curriculum", "Courses", "Subjects"])
        }
      } else {
        setDynamicBreadcrumbs([])
        setDepartmentId(null)
        setStudentId(null)
      }
    }

    handleDynamicBreadcrumbs()
  }, [pathname])

  const breadcrumbs = dynamicBreadcrumbs.length > 0 ? dynamicBreadcrumbs : (breadcrumbMap[pathname] || [""])

  // Show skeleton while session is loading
  if (status === "loading") {
    return <NavigationSkeleton />
  }

  return (
    <header className="px-5 py-1 transition-colors bg-white dark:bg-black sticky top-0 z-50 border-l border-transparent dark:border-[var(--darkmode-color-five)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            className="pl-0 bg-transparent group hover:text-[var(--customized-color-one)] hover:bg-transparent text-black dark:text-white transition-transform rounded-lg"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(!openMobile)
              } else {
                setOpen(!open)
              }
            }}
          >
            <RiMenu3Fill className="w-[20px] h-[20px]" strokeWidth={3} />
          </Button>

          <div className="flex items-center gap-4">
            <span className="font-black text-xl text-black dark:text-white">Academic Management System</span>
            {breadcrumbs.length > 0 && breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-400 font-medium"><ChevronRight className="w-4 h-4" /></span>
                {index === breadcrumbs.length - 1 ? (
                  // Last breadcrumb - not clickable
                  <span className="text-black dark:text-white font-medium text-md">{crumb}</span>
                ) : (
                  // Clickable breadcrumb
                  <Link 
                    href={
                      crumb === "Students"
                        ? "/admin/users/students"
                        : crumb === "Curriculum"
                          ? "/admin/curriculum"
                          : index === 1 && departmentId 
                            ? `/admin/curriculum/${departmentId}/courses`
                            : index === 2 && departmentId
                              ? `/admin/curriculum/${departmentId}/courses`
                              : "#"
                    }
                    className="text-black dark:text-white font-medium text-md hover:text-[var(--customized-color-one)] dark:hover:text-[var(--customized-color-one)] transition-colors"
                  >
                    {crumb}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme} 
              className="text-black dark:text-white hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] transition-colors rounded-lg dark:hover:text-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-five)]"
            >
              {isDark ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span className="text-md">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span className="text-md">Dark</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
