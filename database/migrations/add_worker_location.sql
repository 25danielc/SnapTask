-- Add location field to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS location TEXT;

