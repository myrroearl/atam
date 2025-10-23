# Gradebook Sorting Feature Implementation

## 📋 Overview

This document describes the sorting functionality added to the gradebook system, allowing professors to sort students and their grades in multiple ways.

## ✨ Features Implemented

### **1. Student Name Sorting**

**Default Behavior:**
- Students are now displayed with their names in the format: **"Surname, First Name Middle"**
- **Default sorting is by surname in ascending order (A-Z)** when the page first loads
- Sorting is toggleable between ascending ↑ and descending ↓

**Display Format:**
```
Before: "Juan Carlos Dela Cruz"
After:  "Dela Cruz, Juan Carlos"
```

**How it Works:**
- The `formatStudentName()` helper function formats names as "Surname, First Middle"
- The `getSurname()` helper extracts the surname for sorting purposes
- Default sort order: Ascending (A-Z)

### **2. Grade Entry Sorting**

**Functionality:**
- Each grade entry column header is now clickable for sorting
- Students can be sorted by their scores on any specific assignment, quiz, or attendance
- Supports both score-based and attendance-based entries

**Score Calculation:**
- **Score entries**: Converted to percentages (score/total × 100)
- **Attendance entries**: 
  - Present = 100%
  - Late = 50%
  - Absent = 0%
  - Not marked = 0%

**Default Sort Direction:**
- **Scores**: Descending (highest to lowest) - to quickly identify top performers
- **Names**: Ascending (A to Z) - alphabetical order

### **3. Visual Indicators**

Each sortable column header displays an icon:

| Icon | Meaning |
|------|---------|
| ↕ (Gray) | Column is not currently sorted |
| ↑ (Blue/Primary) | Sorted in ascending order |
| ↓ (Blue/Primary) | Sorted in descending order |

### **4. Toggle Behavior**

- **First Click**: Sorts by that column (default direction)
  - Name: Ascending (A-Z)
  - Scores: Descending (High to Low)
- **Second Click**: Reverses the sort direction
- **Click Another Column**: Switches to sorting by that column

## 🎨 UI Changes

### **Clickable Headers**

All table headers in the following views are now interactive:

1. **Grid View** (Individual component cards)
   - Student Name header
   - Each grade entry header

2. **List View** (All components in one table)
   - Student Name header
   - Each grade entry header across all components

3. **Overall Grades Table**
   - Student Name header

### **Header Appearance**

```tsx
// Student Name Header
<Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
  Student Name
  {getSortIcon('name')}
</Button>

// Grade Entry Header
<Button 
  variant="ghost" 
  size="sm" 
  onClick={() => handleSort('Quiz 1-2024-01-15', componentId)}
>
  Quiz 1
  {getSortIcon('Quiz 1-2024-01-15', componentId)}
</Button>
```

## 🔧 Technical Implementation

### **1. Helper Functions**

```typescript
// Format name as "Surname, First Name Middle"
const formatStudentName = (
  firstName: string, 
  middleName: string | null, 
  lastName: string
): string => {
  const middle = middleName ? ` ${middleName}` : ''
  return `${lastName}, ${firstName}${middle}`
}

// Extract surname for sorting
const getSurname = (fullName: string): string => {
  const parts = fullName.split(',')
  return parts[0].trim()
}
```

### **2. Sort State**

```typescript
const [sortConfig, setSortConfig] = useState<{
  key: 'name' | string        // 'name' or 'entryName-date'
  direction: 'asc' | 'desc'
  componentId?: number         // Used for grade entry sorting
}>({
  key: 'name',
  direction: 'asc'             // Default: surname A-Z
})
```

### **3. Sorting Logic**

```typescript
const filteredStudents = React.useMemo(() => {
  // Filter students by search term
  let filtered = currentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort filtered students
  const sorted = [...filtered].sort((a, b) => {
    if (sortConfig.key === 'name') {
      // Sort by surname
      const surnameA = getSurname(a.name)
      const surnameB = getSurname(b.name)
      const comparison = surnameA.localeCompare(surnameB)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    } else {
      // Sort by grade entry score
      // ... score calculation and comparison
    }
  })

  return sorted
}, [currentStudents, searchTerm, sortConfig])
```

### **4. Sort Handler**

```typescript
const handleSort = (key: 'name' | string, componentId?: number) => {
  setSortConfig(prevConfig => {
    // Toggle direction if same column clicked
    if (prevConfig.key === key && prevConfig.componentId === componentId) {
      return {
        ...prevConfig,
        direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
      }
    }
    // New column: apply default direction
    return {
      key,
      direction: key === 'name' ? 'asc' : 'desc',
      componentId
    }
  })
}
```

### **5. Icon Display**

```typescript
const getSortIcon = (key: 'name' | string, componentId?: number) => {
  if (sortConfig.key !== key || sortConfig.componentId !== componentId) {
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
  }
  return sortConfig.direction === 'asc' 
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />
}
```

## 📊 Use Cases

### **Example 1: Sort by Surname**
```
Default view (sorted A-Z):
1. Anderson, Sarah Jane
2. Cruz, Maria Santos
3. Dela Cruz, Juan Carlos
4. Smith, John Paul

Click name header (sorted Z-A):
1. Smith, John Paul
2. Dela Cruz, Juan Carlos
3. Cruz, Maria Santos
4. Anderson, Sarah Jane
```

### **Example 2: Sort by Quiz Score**
```
Click "Quiz 1" header (sorted High to Low):
1. Smith, John Paul      - 95%
2. Cruz, Maria Santos    - 88%
3. Anderson, Sarah Jane  - 82%
4. Dela Cruz, Juan      - 75%

Click "Quiz 1" again (sorted Low to High):
1. Dela Cruz, Juan      - 75%
2. Anderson, Sarah Jane  - 82%
3. Cruz, Maria Santos    - 88%
4. Smith, John Paul      - 95%
```

### **Example 3: Sort by Attendance**
```
Click attendance column (sorted High to Low):
1. Anderson, Sarah Jane  - Present (100%)
2. Cruz, Maria Santos    - Present (100%)
3. Smith, John Paul      - Late (50%)
4. Dela Cruz, Juan      - Absent (0%)
```

## 🎯 Benefits

1. **Quick Identification**: Easily find top/bottom performers
2. **Alphabetical Navigation**: Quickly locate students by surname
3. **Performance Analysis**: Compare student performance across assessments
4. **Attendance Tracking**: Identify attendance patterns
5. **Flexible Viewing**: Switch between different sorting criteria as needed
6. **Consistent Format**: Standardized "Surname, First Name" format
7. **Cultural Sensitivity**: Surname-first format common in many Asian cultures

## 📝 Code Files Modified

### **Main File**
- `components/professor/gradebook-content.tsx`

### **Changes Made**

1. **Imports**: Added `ArrowUpDown`, `ArrowUp`, `ArrowDown` icons
2. **Helper Functions**: Added `formatStudentName()` and `getSurname()`
3. **State**: Added `sortConfig` state
4. **Data Transformation**: Updated `transformClassDataToStudents()` to use new name format
5. **Filtering & Sorting**: Replaced `filteredStudents` with sorted memo
6. **Handlers**: Added `handleSort()` and `getSortIcon()`
7. **UI Updates**: Made all student name headers and grade entry headers clickable

## ✅ Testing Checklist

- [x] Student names display as "Surname, First Middle"
- [x] Default sort is by surname ascending
- [x] Clicking name header toggles A-Z ↔ Z-A
- [x] Clicking grade entry sorts by score/attendance
- [x] Sort icons display correctly
- [x] Active sort column shows colored arrow
- [x] Inactive columns show gray bidirectional arrow
- [x] Sorting works in Grid View
- [x] Sorting works in List View
- [x] Sorting works in Overall Grades table
- [x] Sorting persists across tabs (Midterm/Final/Overall)
- [x] Sorting works with filtered search results
- [x] No linter errors

## 🚀 Future Enhancements

Potential improvements for future versions:

1. **Multi-column sorting**: Sort by name, then by grade
2. **Save sort preferences**: Remember user's last sort choice
3. **Sort by component average**: Sort by overall component performance
4. **Sort by final grade**: Sort students by their final grade in Overall view
5. **Export sorted data**: Download data in current sort order
6. **Sort indicators in headers**: More prominent visual feedback
7. **Keyboard shortcuts**: Press keys to quickly change sorting

## 📌 Notes

- Sorting is **client-side** for instant feedback
- Uses **React.useMemo** for performance optimization
- **Does not affect** database order
- **Preserves** search filtering when sorting
- **Compatible** with existing drag-and-drop component ordering
- **Works seamlessly** with unsaved grade changes tracking

## 🎓 Summary

The gradebook now provides a **professional, flexible, and intuitive** sorting system that allows professors to:

✅ View students in surname-first format (cultural preference)
✅ Sort alphabetically by surname (default behavior)
✅ Sort by any grade entry to identify top/bottom performers
✅ Toggle between ascending and descending order
✅ Get instant visual feedback on current sort state
✅ Maintain sorting across different views and tabs

This enhancement significantly improves the usability of the gradebook for professors managing large class rosters.

