-- Fix Privacy Settings - Add missing column to students table
-- Run this SQL in your Supabase SQL Editor

-- Add the privacy_settings column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'privacy_settings'
    ) THEN
        ALTER TABLE students 
        ADD COLUMN privacy_settings JSONB DEFAULT '{"profileVisibility": "public"}'::jsonb;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN students.privacy_settings IS 'JSON object storing user privacy preferences including profileVisibility (public/private)';
        
        -- Create an index for better query performance on privacy settings
        CREATE INDEX IF NOT EXISTS idx_students_privacy_settings ON students USING GIN (privacy_settings);
        
        -- Update existing students to have default privacy settings
        UPDATE students 
        SET privacy_settings = '{"profileVisibility": "public"}'::jsonb 
        WHERE privacy_settings IS NULL;
        
        RAISE NOTICE 'privacy_settings column added successfully';
    ELSE
        RAISE NOTICE 'privacy_settings column already exists';
    END IF;
END $$;
