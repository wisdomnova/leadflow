-- Add phone column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
