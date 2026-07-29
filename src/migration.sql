-- Migration SQL for BOMB Gamification Feature
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add gamification columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_roles BOOLEAN DEFAULT FALSE;

-- 2. Add gamification & RPG columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS character_class VARCHAR(255) DEFAULT 'Gobbo';
