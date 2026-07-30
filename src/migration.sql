-- Migration SQL for BOMB Gamification Feature
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add gamification columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_roles BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'pt';

-- 2. Add gamification & RPG columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_submission_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS character_class VARCHAR(255) DEFAULT 'Gobbo';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hexad_profile VARCHAR(255);

-- 3. Create impediments table
CREATE TABLE IF NOT EXISTS impediments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    daily_id UUID REFERENCES dailies(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    helper_id UUID REFERENCES users(id) ON DELETE SET NULL,
    block_streak INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
-- 4. Create planning, review, retrospective & discreet help tables
CREATE TABLE IF NOT EXISTS planned_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INT DEFAULT 1,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'planned',
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS planned_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'meeting',
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'scheduled',
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retrospective_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retrospective_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES retrospective_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, user_id)
);

CREATE TABLE IF NOT EXISTS discreet_help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    helper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES planned_tasks(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'available',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
