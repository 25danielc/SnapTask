-- Add detailed matching fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS safety_features TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS transportation_provided BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_license BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_insurance BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_environment TEXT; -- e.g., 'indoor', 'outdoor', 'remote', 'hybrid'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS equipment_provided TEXT;

