// Unified grade calculation utilities to ensure consistency across all components

export interface GradeEntry {
  student_id: number
  score: number | null
  max_score: number | null
  attendance: string | null
  component_id: number
  name?: string | null
  date_recorded: string
  grade_period?: string | null
}

export interface GradeComponent {
  component_id: number
  component_name: string
  weight_percentage: number
  is_attendance?: boolean
}

export interface StudentGradeData {
  student_id: number
  name: string
  email: string
  components: Record<number, any[]>
}

/**
 * Calculate component average for a specific component
 */
export function calculateComponentAverage(
  component: GradeComponent, 
  entries: GradeEntry[]
): number {
  if (entries.length === 0) return 0

  // Check if this component is attendance-based by looking at the entries
  const hasAttendanceEntries = entries.some(e => e.attendance !== null)
  const hasScoreEntries = entries.some(e => e.score !== null && e.max_score && e.max_score > 0)

  if (hasAttendanceEntries && !hasScoreEntries) {
    // Handle attendance: present=100%, late=50%, absent=0%
    const attendanceEntries = entries.filter(e => e.attendance !== null)
    if (attendanceEntries.length === 0) return 0
    
    const presentCount = attendanceEntries.filter(e => e.attendance === 'present').length
    const lateCount = attendanceEntries.filter(e => e.attendance === 'late').length
    
    return Math.round(((presentCount + (lateCount * 0.5)) / attendanceEntries.length) * 10000) / 100
  } else {
    // Handle score-based components
    const scoreEntries = entries.filter(e => e.score !== null && e.max_score && e.max_score > 0)
    if (scoreEntries.length === 0) return 0
    
    const totalEarned = scoreEntries.reduce((sum, entry) => sum + (entry.score || 0), 0)
    const totalPossible = scoreEntries.reduce((sum, entry) => sum + (entry.max_score || 0), 0)
    
    if (totalPossible === 0) return 0
    return Math.round((totalEarned / totalPossible) * 10000) / 100
  }
}

/**
 * Calculate final weighted grade for a student
 */
export function calculateFinalGrade(
  student: StudentGradeData,
  components: GradeComponent[]
): number {
  let totalWeightedScore = 0
  let totalWeightUsed = 0

  components.forEach((component) => {
    const items = student.components[component.component_id] || []
    
    // Only include components that have at least one item
    if (items.length > 0) {
      const average = calculateComponentAverage(component, items)
      const weight = component.weight_percentage / 100
      totalWeightedScore += average * weight
      totalWeightUsed += weight
    }
  })

  // If no components have grades, return 0
  if (totalWeightUsed === 0) return 0

  // Normalize the grade based on the actual weights used
  return Math.round((totalWeightedScore / totalWeightUsed) * 100) / 100
}

/**
 * Calculate class average from student final grades
 */
export function calculateClassAverage(
  students: StudentGradeData[],
  components: GradeComponent[]
): number {
  const validGrades = students
    .map(student => calculateFinalGrade(student, components))
    .filter(grade => grade > 0)

  if (validGrades.length === 0) return 0

  return Math.round(
    (validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length) * 100
  ) / 100
}

/**
 * Count unique assignments per class
 */
export function countUniqueAssignments(entries: GradeEntry[]): number {
  const uniqueAssignments = new Set<string>()
  
  entries
    .filter(entry => entry.score !== null)
    .forEach(entry => {
      const assignmentKey = `${entry.component_id}-${entry.date_recorded}`
      uniqueAssignments.add(assignmentKey)
    })

  return uniqueAssignments.size
}

/**
 * Calculate simple average (for backward compatibility with leaderboard)
 * This should be replaced with weighted average in the future
 */
export function calculateSimpleAverage(entries: GradeEntry[]): number {
  const validScores = entries.filter(e => e.max_score && e.max_score > 0 && e.score !== null)
  
  if (validScores.length === 0) return 0
  
  const totalPercentage = validScores.reduce((sum, entry) => {
    return sum + ((entry.score || 0) / (entry.max_score || 1)) * 100
  }, 0)
  
  return Math.round((totalPercentage / validScores.length) * 100) / 100
}

/**
 * Normalize grade entries from database format
 */
export function normalizeGradeEntries(entries: any[]): GradeEntry[] {
  return entries.map(entry => ({
    student_id: entry.student_id,
    score: entry.score,
    max_score: entry.max_score,
    attendance: entry.attendance,
    component_id: entry.component_id,
    name: entry.name || null,
    date_recorded: entry.date_recorded,
    grade_period: entry.grade_period
  }))
}

/**
 * Normalize grade components from database format
 */
export function normalizeGradeComponents(components: any[]): GradeComponent[] {
  return components.map(comp => ({
    component_id: comp.component_id,
    component_name: comp.component_name,
    weight_percentage: comp.weight_percentage,
    is_attendance: comp.is_attendance || false // Default to false, will be determined dynamically
  }))
}

/**
 * Calculate class average from grade entries (for classes page)
 */
export function calculateClassAverageFromEntries(
  entries: GradeEntry[],
  components: GradeComponent[]
): number {
  // Group entries by student
  const studentGroups = new Map<number, GradeEntry[]>()
  entries.forEach(entry => {
    if (!studentGroups.has(entry.student_id)) {
      studentGroups.set(entry.student_id, [])
    }
    studentGroups.get(entry.student_id)!.push(entry)
  })

  // Calculate average for each student
  const studentAverages: number[] = []
  
  studentGroups.forEach((studentEntries, studentId) => {
    // Group entries by component
    const componentGroups = new Map<number, GradeEntry[]>()
    studentEntries.forEach(entry => {
      if (!componentGroups.has(entry.component_id)) {
        componentGroups.set(entry.component_id, [])
      }
      componentGroups.get(entry.component_id)!.push(entry)
    })

    // Calculate weighted average for this student
    let totalWeightedScore = 0
    let totalWeightUsed = 0

    components.forEach(component => {
      const componentEntries = componentGroups.get(component.component_id) || []
      if (componentEntries.length > 0) {
        const average = calculateComponentAverage(component, componentEntries)
        const weight = component.weight_percentage / 100
        totalWeightedScore += average * weight
        totalWeightUsed += weight
      }
    })

    if (totalWeightUsed > 0) {
      studentAverages.push(totalWeightedScore / totalWeightUsed)
    }
  })

  if (studentAverages.length === 0) return 0

  return Math.round(
    (studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length) * 100
  ) / 100
}
