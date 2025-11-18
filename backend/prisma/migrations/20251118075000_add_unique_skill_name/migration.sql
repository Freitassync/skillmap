-- Migration: Add Unique Constraint to Skills Name
-- Description: Adds unique constraint to skill name to prevent duplicates

-- Add unique constraint to skills.name
ALTER TABLE skills ADD CONSTRAINT skills_name_key UNIQUE (name);
