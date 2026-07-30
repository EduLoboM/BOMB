-- Database Schema for BOMB

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    access_code VARCHAR(255) UNIQUE NOT NULL,
    daily_time TIME,
    weekdays VARCHAR(255),
    daily_period INT,
    sprint_repeat BOOLEAN DEFAULT FALSE,
    sprint_duration INT,
    timezone VARCHAR(255) DEFAULT 'UTC',
    gamification_enabled BOOLEAN DEFAULT TRUE,
    auto_roles BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'pt'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_submission_date DATE,
    character_class VARCHAR(255) DEFAULT 'Gobbo',
    class_chosen_at_level INT DEFAULT 1,
    hexad_profile VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS dailies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    done TEXT,
    todo TEXT,
    blockers TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) DEFAULT '🏆',
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS mascots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(255) DEFAULT 'Fusca Transformer',
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    current_mood VARCHAR(255) DEFAULT 'Feliz',
    active_aura VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS battle_buddies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
    user_1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    card_id VARCHAR(255) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    rarity VARCHAR(50) DEFAULT 'Common',
    is_shiny BOOLEAN DEFAULT FALSE,
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_id UUID REFERENCES dailies(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    kudo_type VARCHAR(50) DEFAULT 'kudos',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) for security.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE dailies ENABLE ROW LEVEL SECURITY;
ALTER TABLE impediments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascots ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE planned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrospective_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrospective_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discreet_help_requests ENABLE ROW LEVEL SECURITY;

-- V2 Schema Additions for Web Dashboard & Guild Table Persistence
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255);
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255);

ALTER TABLE planned_tasks ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE planned_tasks ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255);
ALTER TABLE planned_tasks ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255);

ALTER TABLE retrospective_items ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE retrospective_items ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255);
ALTER TABLE retrospective_items ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255);

ALTER TABLE impediments ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE impediments ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255);
ALTER TABLE impediments ADD COLUMN IF NOT EXISTS discord_guild_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS guild_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE guild_tables ENABLE ROW LEVEL SECURITY;



