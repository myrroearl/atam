import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

interface ScheduleClass {
  classId: number
  className: string
  subjectCode: string
  subjectName: string
  sectionName: string
  units: number
  startTime: Date
  endTime: Date
  dayOfWeek: number
  timeSlot: string
  startTimeFormatted: string
  endTimeFormatted: string
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get professor details
    console.log("Looking up professor for account_id:", session.user.account_id)
    const { data: professor, error: profError } = await supabaseServer
      .from("professors")
      .select("prof_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (profError || !professor) {
      console.error("Professor lookup error:", profError)
      return NextResponse.json({ error: "Failed to resolve professor" }, { status: 500 })
    }

    console.log("Found professor with prof_id:", professor.prof_id)

    // Fetch professor's classes with schedule information
    const { data: classes, error: classesError } = await supabaseServer
      .from("classes")
      .select(`
        class_id,
        class_name,
        schedule_start,
        schedule_end,
        subjects:subject_id (
          subject_id,
          subject_code,
          subject_name,
          units
        ),
        sections:section_id (
          section_id,
          section_name
        )
      `)
      .eq("professor_id", professor.prof_id)
      .not("schedule_start", "is", null)
      .not("schedule_end", "is", null)
      .order("schedule_start")

    if (classesError) {
      console.error("Classes fetch error:", classesError)
      return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
    }

    console.log("Fetched classes:", classes?.length || 0, "classes")
    console.log("Professor ID:", professor.prof_id)

    // Process schedule data
    const scheduleData = (classes || []).map(classItem => {
      const startTime = new Date(classItem.schedule_start)
      const endTime = new Date(classItem.schedule_end)
      
      return {
        classId: classItem.class_id,
        className: classItem.class_name,
        subjectCode: (classItem.subjects as any)?.subject_code || 'N/A',
        subjectName: (classItem.subjects as any)?.subject_name || 'N/A',
        sectionName: (classItem.sections as any)?.section_name || 'N/A',
        units: (classItem.subjects as any)?.units || 0,
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: startTime.getDay(), // 0 = Sunday, 1 = Monday, etc.
        timeSlot: formatTimeSlot(startTime, endTime),
        startTimeFormatted: formatTime(startTime),
        endTimeFormatted: formatTime(endTime)
      }
    })

    // Group by day of week for easier processing
    const scheduleByDay: {
      0: ScheduleClass[]
      1: ScheduleClass[]
      2: ScheduleClass[]
      3: ScheduleClass[]
      4: ScheduleClass[]
      5: ScheduleClass[]
      6: ScheduleClass[]
    } = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: []  // Saturday
    }

    scheduleData.forEach(classItem => {
      if (classItem.dayOfWeek >= 1 && classItem.dayOfWeek <= 6) { // Monday to Saturday
        scheduleByDay[classItem.dayOfWeek as keyof typeof scheduleByDay].push(classItem)
      }
    })

    // Generate time slots based on actual class schedules
    const timeSlots = generateTimeSlotsFromSchedule(scheduleData)

    console.log("Processed schedule data:", scheduleData.length, "classes")
    console.log("Time slots:", timeSlots)
    console.log("Schedule by day:", Object.keys(scheduleByDay).map(day => `${day}: ${scheduleByDay[parseInt(day) as keyof typeof scheduleByDay].length}`))

    return NextResponse.json({
      schedule: scheduleByDay,
      timeSlots,
      totalClasses: scheduleData.length,
      professorId: professor.prof_id
    })

  } catch (err) {
    console.error("Schedule API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatTimeSlot(startTime: Date, endTime: Date): string {
  const start = formatTime(startTime)
  const end = formatTime(endTime)
  return `${start} - ${end}`
}

function generateTimeSlotsFromSchedule(scheduleData: ScheduleClass[]): string[] {
  // Extract all unique time slots from actual class schedules
  const timeSlotSet = new Set<string>()
  
  scheduleData.forEach(classItem => {
    timeSlotSet.add(classItem.timeSlot)
  })
  
  // Convert to array and sort by time
  const timeSlots = Array.from(timeSlotSet).sort((a, b) => {
    // Extract start time from time slot string for sorting
    const getStartTime = (timeSlot: string) => {
      const startTimeStr = timeSlot.split(' - ')[0]
      const [time, period] = startTimeStr.split(' ')
      const [hours, minutes] = time.split(':').map(Number)
      let hour24 = hours
      if (period === 'PM' && hours !== 12) hour24 += 12
      if (period === 'AM' && hours === 12) hour24 = 0
      return hour24 * 60 + minutes
    }
    
    return getStartTime(a) - getStartTime(b)
  })
  
  return timeSlots
}
