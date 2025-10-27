/**
 * Utility functions for deduplicating subjects from classes data
 */

export interface ClassData {
  class_id: number
  subjects?: {
    subject_id: number
    subject_code: string
    subject_name: string
    units: number
  } | {
    subject_id: number
    subject_code: string
    subject_name: string
    units: number
  }[]
  professors?: {
    prof_id: number
    first_name: string
    last_name: string
  } | {
    prof_id: number
    first_name: string
    last_name: string
  }[]
  schedule_start?: string
  schedule_end?: string
}

export interface DeduplicatedSubject {
  class_id: number
  subjects: {
    subject_id: number
    subject_code: string
    subject_name: string
    units: number
  }
  professors?: {
    prof_id: number
    first_name: string
    last_name: string
  }
  schedule_start?: string
  schedule_end?: string
}

/**
 * Removes duplicate subjects from classes data by subject_id
 * Prevents showing the same subject multiple times when it exists across multiple classes
 */
export function deduplicateSubjects(classes: ClassData[]): DeduplicatedSubject[] {
  const subjectsMap = new Map<number, DeduplicatedSubject>()
  const duplicates: string[] = []

  classes?.forEach((cls) => {
    const subjects = Array.isArray(cls.subjects) ? cls.subjects[0] : cls.subjects
    if (subjects?.subject_id) {
      const subjectId = subjects.subject_id
      const subjectName = subjects.subject_name
      
      // Keep only the first occurrence of each subject
      if (!subjectsMap.has(subjectId)) {
        const professors = Array.isArray(cls.professors) ? cls.professors[0] : cls.professors
        subjectsMap.set(subjectId, {
          class_id: cls.class_id,
          subjects: subjects,
          professors: professors,
          schedule_start: cls.schedule_start,
          schedule_end: cls.schedule_end
        })
      } else {
        duplicates.push(`${subjectName} (ID: ${subjectId})`)
      }
    }
  })

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate subjects:`, duplicates.join(', '))
  }

  const result = Array.from(subjectsMap.values())
  console.log(`Deduplicated ${classes?.length || 0} classes to ${result.length} unique subjects`)
  
  return result
}

/**
 * Get unique subject IDs from classes data
 */
export function getUniqueSubjectIds(classes: ClassData[]): number[] {
  const subjectIds = new Set<number>()
  
  classes?.forEach((cls) => {
    const subjects = Array.isArray(cls.subjects) ? cls.subjects[0] : cls.subjects
    if (subjects?.subject_id) {
      subjectIds.add(subjects.subject_id)
    }
  })    
  
  return Array.from(subjectIds)
}

/**
 * Group classes by subject ID
 */
export function groupClassesBySubject(classes: ClassData[]): Map<number, ClassData[]> {
  const grouped = new Map<number, ClassData[]>()
  
  classes?.forEach((cls) => {
    const subjects = Array.isArray(cls.subjects) ? cls.subjects[0] : cls.subjects
    if (subjects?.subject_id) {
      const subjectId = subjects.subject_id
      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, [])
      }
      grouped.get(subjectId)!.push(cls)
    }
  })
  
  return grouped
}
