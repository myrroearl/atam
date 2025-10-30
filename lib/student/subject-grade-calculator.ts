// Individual Subject Grade Calculation Library
// This library provides consistent grade calculation for individual subjects
// Used by both grades-view.tsx and leaderboard API
// Updated to match the exact logic used in grades-view.tsx

import { 
    normalizeGradeEntries, 
    normalizeGradeComponents, 
    calculateFinalGrade,
    convertPercentageToPreciseGPA,
    GradeEntry,
    GradeComponent,
    StudentGradeData
  } from "@/lib/student/grade-calculations"
  
  export interface SubjectGradeData {
    student_id: number
    subject_id: number
    grade_entries: any[]
    grade_components: any[]
  }
  
  export interface CalculatedSubjectGrade {
    student_id: number
    subject_id: number
    percentage: number
    gpa: number
    rank?: number
  }
  
  /**
   * Calculates a student's grade for a single subject
   * Matches the calculation logic used in grades-view.tsx for consistency
   */
  export function calculateIndividualSubjectGrade(
    studentId: number,
    subjectId: number,
    gradeEntries: any[],
    gradeComponents: any[]
  ): CalculatedSubjectGrade {
    // Get all grade entries for this student in this subject
    const studentSubjectEntries = gradeEntries.filter(entry => 
      entry.student_id === studentId && 
      entry.classes?.subject_id === subjectId
    )
  
    // Return default failing grade if no entries exist
    if (studentSubjectEntries.length === 0) {
      return {
        student_id: studentId,
        subject_id: subjectId,
        percentage: 0,
        gpa: 5.0
      }
    }
  
    // Extract unique grade components for this subject
    const subjectComponents = studentSubjectEntries
      .map(entry => entry.grade_components)
      .filter(component => component != null)
      .reduce((unique, component) => {
        if (!unique.find((c: any) => c.component_id === component.component_id)) {
          unique.push(component)
        }
        return unique
      }, [] as any[])
  
    if (subjectComponents.length === 0) {
      return {
        student_id: studentId,
        subject_id: subjectId,
        percentage: 0,
        gpa: 5.0 // Default to 5.0 when no components
      }
    }
  
    // Normalize entries and components for grade calculation - same as grades-view.tsx
    const normalizedEntries = normalizeGradeEntries(studentSubjectEntries)
    const normalizedComponents = normalizeGradeComponents(subjectComponents)
  
    // Create student data structure for grade calculation - match grades-view.tsx
    const studentData: StudentGradeData = {
      student_id: studentId,
      name: 'Student',
      email: '',
      components: {} as Record<number, any[]>
    }
  
    // Group entries by component - same logic as grades-view.tsx
    normalizedEntries.forEach(entry => {
      if (!studentData.components[entry.component_id]) {
        studentData.components[entry.component_id] = []
      }
      studentData.components[entry.component_id].push(entry)
    })
  
    // Calculate final grade using the unified grade calculation - same as grades-view.tsx
    const computedPercent = calculateFinalGrade(studentData, normalizedComponents)
  
    // Convert percentage to precise GPA using the same function as grades-view.tsx
    const gpa = convertPercentageToPreciseGPA(computedPercent)
  
    return {
      student_id: studentId,
      subject_id: subjectId,
      percentage: Number.isFinite(computedPercent) ? computedPercent : 0,
      gpa: Number.isFinite(gpa) ? gpa : 5.0
    }
  }
  
  /**
   * Calculate grades for all students in a specific subject
   */
  export function calculateSubjectRankings(
    subjectId: number,
    studentIds: number[],
    gradeEntries: any[],
    gradeComponents: any[]
  ): CalculatedSubjectGrade[] {
    const rankings: CalculatedSubjectGrade[] = []
  
    for (const studentId of studentIds) {
      const grade = calculateIndividualSubjectGrade(
        studentId,
        subjectId,
        gradeEntries,
        gradeComponents
      )
      
      // Only include students who have grades (percentage > 0)
      if (grade.percentage > 0) {
        rankings.push(grade)
      }
    }
  
    // Sort by GPA (ascending - lower GPA is better)
    rankings.sort((a, b) => a.gpa - b.gpa)
  
    // Assign ranks
    return rankings.map((grade, index) => ({
      ...grade,
      rank: index + 1
    }))
  }
  
  /**
   * Calculate grades for all subjects for all students
   */
  export function calculateAllSubjectGrades(
    studentIds: number[],
    subjectIds: number[],
    gradeEntries: any[],
    gradeComponents: any[]
  ): Record<number, CalculatedSubjectGrade[]> {
    const allSubjectGrades: Record<number, CalculatedSubjectGrade[]> = {}
  
    for (const subjectId of subjectIds) {
      const subjectRankings = calculateSubjectRankings(
        subjectId,
        studentIds,
        gradeEntries,
        gradeComponents
      )
      
      if (subjectRankings.length > 0) {
        allSubjectGrades[subjectId] = subjectRankings
      }
    }
  
    return allSubjectGrades
  }
  
  /**
   * Convert percentage to GPA scale (1.0-5.0)
   * This function is now deprecated - use convertPercentageToPreciseGPA from grade-calculations.ts
   * Kept for backward compatibility but should not be used in new code
   * @deprecated Use convertPercentageToPreciseGPA from grade-calculations.ts instead
   */
  function convertPercentageToGPA(percentage: number): number {
    // Delegate to the precise conversion function for consistency
    return convertPercentageToPreciseGPA(percentage)
  }