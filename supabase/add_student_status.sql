-- Add status column to students table
-- This allows archiving students by changing their status to 'inactive'
-- instead of modifying the account status

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active';

-- Update existing students to have 'active' status
UPDATE students SET status = 'active' WHERE status IS NULL;
