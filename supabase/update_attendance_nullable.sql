-- Update attendance field to allow NULL values
-- This allows attendance entries to default to NULL (not marked yet)

-- Drop the existing constraint
ALTER TABLE grade_entries 
DROP CONSTRAINT IF EXISTS grade_entries_attendance_check;

-- Add new constraint that allows NULL or specific values
ALTER TABLE grade_entries
ADD CONSTRAINT grade_entries_attendance_check 
CHECK (
  attendance IS NULL OR 
  attendance IN ('present', 'absent', 'late')
);

-- Optional: Update existing entries if needed
-- Uncomment the following line if you want to set existing 'present' entries to NULL
-- UPDATE grade_entries SET attendance = NULL WHERE attendance = 'present' AND score = 0;

