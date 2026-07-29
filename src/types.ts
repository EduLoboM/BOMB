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
    gamification_enabled?: boolean;
    auto_roles?: boolean;
}

export interface User {
    id: string;
    discord_id: string;
    display_name: string;
    xp?: number;
    level?: number;
    streak?: number;
    max_streak?: number;
    last_submission_date?: string | null;
    character_class?: string;
    class_chosen_at_level?: number;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    joined_at: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
    users: User;
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

export interface UserBadge {
    id: string;
    user_id: string;
    project_name: string;
    description: string;
    icon: string;
    awarded_at: string;
}
