# Grade Entries API Documentation

## Overview
This API handles the insertion and updating of grade entries in the Academic Management System with automatic attendance tracking based on scores.

---

## 📍 Endpoint
```
POST /api/professor/grade-entries
PUT  /api/professor/grade-entries
```

---

## 🔐 Authentication
- **Required Role**: `professor`
- Uses NextAuth session authentication
- Returns `403 Forbidden` if unauthorized

---

## 📥 POST Request - Create Grade Entries

### Purpose
Creates grade entries for multiple students in a single request with automatic attendance logic.

### Request Body
```typescript
{
  class_id: number          // Required - The class ID
  component_id: number      // Required - The grading component ID
  students: number[]        // Required - Array of student IDs
  name: string              // Required - Name of the assessment (e.g., "Quiz 1")
  date_recorded: string     // Required - Date in ISO format (YYYY-MM-DD)
  max_score: number         // Required for non-attendance, ignored for attendance
  grade_period: string      // Required - Either "midterm" or "final"
  is_attendance: boolean    // Required - Whether this is an attendance component
}
```

### Business Logic

#### 🧾 **Attendance Components** (`is_attendance: true`)
When creating attendance entries:
- **Default Status**: All students marked as `'present'`
- **Score Assignment**: 
  - Present → `10/10` points
  - Absent → `0/10` points (can be updated later)
- **max_score**: Automatically set to `10` (ignored in request)

#### 🧮 **Other Grading Components** (`is_attendance: false`)
When creating score entries:
- **Default Score**: All students start with `0` points
- **Attendance Tracking**: 
  - Score > 0 → Automatically marked as `'present'`
  - Score = 0 → Automatically marked as `'absent'`
- **max_score**: Uses the value from request

### Response
```typescript
{
  success: true,
  message: "Successfully created grade entries for X student(s)",
  data: [
    {
      grade_id: number,
      class_id: number,
      component_id: number,
      student_id: number,
      score: number,
      attendance: string,
      max_score: number,
      name: string,
      date_recorded: string,
      grade_period: string,
      entry_type: "manual entry",
      created_at: string
    }
  ]
}
```

### Example Request - Attendance
```javascript
const response = await fetch('/api/professor/grade-entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    class_id: 1,
    component_id: 5,  // Attendance component
    students: [101, 102, 103],
    name: "Week 1 Attendance",
    date_recorded: "2024-01-15",
    grade_period: "midterm",
    is_attendance: true
  })
})
```
**Result**: Creates 3 attendance entries, all marked "present" with 10/10 score.

### Example Request - Quiz
```javascript
const response = await fetch('/api/professor/grade-entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    class_id: 1,
    component_id: 2,  // Quiz component
    students: [101, 102, 103],
    name: "Quiz 1",
    date_recorded: "2024-01-15",
    max_score: 50,
    grade_period: "midterm",
    is_attendance: false
  })
})
```
**Result**: Creates 3 quiz entries with 0/50 score, all marked "absent".

---

## 📝 PUT Request - Update Grade Entry

### Purpose
Updates a single grade entry's score with automatic attendance tracking.

### Request Body
```typescript
{
  grade_id: number       // Required - The grade entry ID to update
  score: number          // Required - The new score
  is_attendance: boolean // Required - Whether this is an attendance entry
}
```

### Business Logic

#### 🧾 **Attendance Components**
- Score is updated directly
- Attendance status remains unchanged (controlled separately)

#### 🧮 **Other Grading Components**
- Score is updated
- **Automatic Attendance Update**:
  - If `score > 0` → Set `attendance = 'present'`
  - If `score = 0` → Set `attendance = 'absent'`

### Response
```typescript
{
  success: true,
  message: "Grade entry updated successfully",
  data: [
    {
      grade_id: number,
      score: number,
      attendance: string,
      // ... other fields
    }
  ]
}
```

### Example Request
```javascript
const response = await fetch('/api/professor/grade-entries', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grade_id: 456,
    score: 45,
    is_attendance: false
  })
})
```
**Result**: Updates score to 45 and automatically sets attendance to "present".

---

## 🗄️ Database Schema

### Table: `grade_entries`
```sql
CREATE TABLE grade_entries (
  grade_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT REFERENCES classes(class_id),
  component_id BIGINT REFERENCES grade_components(component_id),
  student_id BIGINT REFERENCES students(student_id),
  score NUMERIC,
  attendance TEXT,  -- 'present', 'absent', 'late'
  max_score NUMERIC,
  name TEXT,
  entry_type TEXT,  -- 'manual entry', 'imported from gclass'
  date_recorded TIMESTAMPTZ,
  grade_period TEXT,  -- 'midterm', 'final'
  topics TEXT[],  -- Array of topics (not used yet)
  outcome_id BIGINT,  -- Not used yet
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: class_id, component_id, students, name, date_recorded, grade_period"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to insert grade entries",
  "details": "Specific error message"
}
```

---

## 🔄 Integration with Gradebook

### Client-Side Flow
1. Professor opens "Add Entry" modal
2. Fills in: Name, Date, Total Score (if not attendance)
3. Clicks "Save Entry"
4. `handleManualEntry()` function:
   - Collects form data
   - Calls POST endpoint with all student IDs
   - Updates local state with returned data
   - Refreshes UI to show new entries

### State Management
- Creates entries for ALL students in the class simultaneously
- Updates three state variables:
  - `midtermStudents` (if midterm period)
  - `finalStudents` (if final period)
  - `allStudents` (always updated)

---

## 📊 Future Enhancements

### Planned Features (Not Yet Implemented)
- [ ] `outcome_id` - Link to learning outcomes
- [ ] `topics` - Tag entries with topics covered
- [ ] Batch updates for multiple students
- [ ] Grade entry deletion
- [ ] Import validation from Google Classroom

---

## 🧪 Testing Checklist

- [ ] Create attendance entry - all students marked present
- [ ] Create quiz entry - all students start at 0/absent
- [ ] Update quiz score to > 0 - student marked present
- [ ] Update quiz score to 0 - student marked absent
- [ ] Verify grade_period filtering works
- [ ] Test with midterm and final periods
- [ ] Verify unauthorized access returns 403
- [ ] Test missing required fields return 400

---

## 📞 Support
For issues or questions, contact the development team.

