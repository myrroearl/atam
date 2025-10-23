-- Fix the grade_entries sequence to avoid duplicate key errors
-- Run this in Supabase SQL Editor

-- Reset the sequence to the max existing grade_id + 1
SELECT setval(
  'grade_entries_grade_id_seq', 
  COALESCE((SELECT MAX(grade_id) FROM grade_entries), 0) + 1,
  false
);

-- Verify the sequence is correct
SELECT currval('grade_entries_grade_id_seq') as current_sequence_value;
SELECT MAX(grade_id) as max_grade_id FROM grade_entries;

