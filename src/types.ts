// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BOMB — Central Type Definitions
//  Database row types matching schema.sql exactly.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Project {
    id: string;
    guild_id: string;
    channel_id: string | null;
    name: string;
    access_code: string;
    daily_time: string | null;
    weekdays: string | null;
    daily_period: number | null;
    sprint_repeat: boolean;
    sprint_duration: number | null;
    timezone: string;
}

export interface User {
    id: string;
    discord_id: string;
    project_id: string;
    display_name: string;
}

export interface Sprint {
    id: string;
    project_id: string;
    number: number;
    start_date: string;
    end_date: string;
}

export interface Daily {
    id: string;
    user_id: string;
    project_id: string;
    done: string | null;
    todo: string | null;
    blockers: string | null;
    submitted_at: string;
}

export interface DailyWithUser extends Daily {
    users: User;
}
