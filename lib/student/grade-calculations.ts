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
 * Calculates average for a grade component (assignments, exams, etc.)
 * Handles both score-based and attendance-based entries
 */
export function calculateComponentAverage(
  component: GradeComponent, 
  entries: GradeEntry[]
): number {
  if (entries.length === 0) return 0

  // Determine if entries are attendance or score-based
  const hasAttendanceEntries = entries.some(e => e.attendance !== null)
  const hasScoreEntries = entries.some(e => e.score !== null && e.max_score && e.max_score > 0)

  if (hasAttendanceEntries && !hasScoreEntries) {
    // Calculate attendance: present=100%, late=50%, absent=0%
    const attendanceEntries = entries.filter(e => e.attendance !== null)
    if (attendanceEntries.length === 0) return 0
    
    const presentCount = attendanceEntries.filter(e => e.attendance === 'present').length
    const lateCount = attendanceEntries.filter(e => e.attendance === 'late').length
    
    return Math.round(((presentCount + (lateCount * 0.5)) / attendanceEntries.length) * 10000) / 100
  } else {
    // Calculate score-based average: total earned / total possible
    const scoreEntries = entries.filter(e => e.score !== null && e.max_score && e.max_score > 0)
    if (scoreEntries.length === 0) return 0
    
    const totalEarned = scoreEntries.reduce((sum, entry) => sum + (entry.score || 0), 0)
    const totalPossible = scoreEntries.reduce((sum, entry) => sum + (entry.max_score || 0), 0)
    
    if (totalPossible === 0) return 0
    return Math.round((totalEarned / totalPossible) * 10000) / 100
  }
}


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
      totalWeightedScore += average * weight  // Component Score × Weight
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
 * Convert percentage grade to GPA (Philippine 1.0-5.0 scale)
 */
export function convertPercentageToGPA(percentage: number): number {
  if (percentage >= 97.5) return 1.0
  if (percentage >= 94.5) return 1.25
  if (percentage >= 91.5) return 1.5
  if (percentage >= 88.5) return 1.75
  if (percentage >= 85.5) return 2.0
  if (percentage >= 82.5) return 2.25
  if (percentage >= 79.5) return 2.5
  if (percentage >= 76.5) return 2.75
  if (percentage >= 74.5) return 3.0
  if (percentage >= 69.5) return 3.5
  if (percentage >= 64.5) return 4.0
  if (percentage >= 59.5) return 4.5
  return 5.0
}

/**
 * Convert percentage grade to precise GPA (Philippine 1.0-5.0 scale with decimal precision)
 */
export function convertPercentageToPreciseGPA(percentage: number): number {
  if (percentage >= 100) return 1.0
  if (percentage >= 97.5) {
    // Linear interpolation between 100% (1.0) and 97.5% (1.0)
    return 1.0
  }
  if (percentage >= 94.5) {
    // Linear interpolation between 97.5% (1.0) and 94.5% (1.25)
    return 1.0 + ((97.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 91.5) {
    // Linear interpolation between 94.5% (1.25) and 91.5% (1.5)
    return 1.25 + ((94.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 88.5) {
    // Linear interpolation between 91.5% (1.5) and 88.5% (1.75)
    return 1.5 + ((91.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 85.5) {
    // Linear interpolation between 88.5% (1.75) and 85.5% (2.0)
    return 1.75 + ((88.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 82.5) {
    // Linear interpolation between 85.5% (2.0) and 82.5% (2.25)
    return 2.0 + ((85.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 79.5) {
    // Linear interpolation between 82.5% (2.25) and 79.5% (2.5)
    return 2.25 + ((82.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 76.5) {
    // Linear interpolation between 79.5% (2.5) and 76.5% (2.75)
    return 2.5 + ((79.5 - percentage) / 3.0) * 0.25
  }
  if (percentage >= 74.5) {
    // Linear interpolation between 76.5% (2.75) and 74.5% (3.0)
    return 2.75 + ((76.5 - percentage) / 2.0) * 0.25
  }
  if (percentage >= 69.5) {
    // Linear interpolation between 74.5% (3.0) and 69.5% (3.5)
    return 3.0 + ((74.5 - percentage) / 5.0) * 0.5
  }
  if (percentage >= 64.5) {
    // Linear interpolation between 69.5% (3.5) and 64.5% (4.0)
    return 3.5 + ((69.5 - percentage) / 5.0) * 0.5
  }
  if (percentage >= 59.5) {
    // Linear interpolation between 64.5% (4.0) and 59.5% (4.5)
    return 4.0 + ((64.5 - percentage) / 5.0) * 0.5
  }
  if (percentage >= 50) {
    // Linear interpolation between 59.5% (4.5) and 50% (5.0)
    return 4.5 + ((59.5 - percentage) / 9.5) * 0.5
  }
  return 5.0
}

/**
 * Calculate GPA from percentage grades with credit hours
 */
export function calculateGPA(subjectGrades: Array<{ percentage: number; units: number }>): number {
  if (subjectGrades.length === 0) return 0
  
  let totalGradePoints = 0
  let totalUnits = 0
  
  subjectGrades.forEach(({ percentage, units }) => {
    const gpa = convertPercentageToGPA(percentage)
    totalGradePoints += gpa * units
    totalUnits += units
  })
  
  return totalUnits > 0 ? Math.round((totalGradePoints / totalUnits) * 100) / 100 : 0
}

/**
 * Calculate weighted average from percentage grades with credit hours
 */
export function calculateWeightedAverage(subjectGrades: Array<{ percentage: number; units: number }>): number {
  if (subjectGrades.length === 0) return 0
  
  let totalWeightedScore = 0
  let totalUnits = 0
  
  subjectGrades.forEach(({ percentage, units }) => {
    totalWeightedScore += percentage * units
    totalUnits += units
  })
  
  return totalUnits > 0 ? Math.round((totalWeightedScore / totalUnits) * 100) / 100 : 0
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
