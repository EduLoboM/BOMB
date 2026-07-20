-- Database Schema for BOMB

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id VARCHAR(255) NOT NULL UNIQUE,
    channel_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    access_code VARCHAR(255) UNIQUE NOT NULL,
    daily_time TIME,
    weekdays VARCHAR(255),
    daily_period INT,
    sprint_repeat BOOLEAN DEFAULT FALSE,
    sprint_duration INT,
    timezone VARCHAR(255) DEFAULT 'UTC'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    UNIQUE (discord_id, project_id)
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

-- Enable Row Level Security (RLS) for security.
-- The bot should be configured with the Supabase service_role key to bypass RLS safely on the server.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE dailies ENABLE ROW LEVEL SECURITY;
