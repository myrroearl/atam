-- Add privacy_settings column to students table
-- This migration adds the privacy_settings column to store user privacy preferences

ALTER TABLE students 
ADD COLUMN privacy_settings JSONB DEFAULT '{"profileVisibility": "public"}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN students.privacy_settings IS 'JSON object storing user privacy preferences including profileVisibility (public/private)';

-- Create an index for better query performance on privacy settings
CREATE INDEX idx_students_privacy_settings ON students USING GIN (privacy_settings);

-- Update existing students to have default privacy settings if they don't have any
UPDATE students 
SET privacy_settings = '{"profileVisibility": "public"}'::jsonb 
WHERE privacy_settings IS NULL;
