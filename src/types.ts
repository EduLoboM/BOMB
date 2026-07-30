import type { Language } from "./i18n/types.js";

export type { Language };

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
    mascot_type?: MascotType;
    language?: Language;
}

export type MascotType =
    | 'Fusca Transformer'
    | 'Filhote de Esfinge'
    | 'Kaiju de Forma'
    | 'Pato Voodoo de Borracha'
    | 'Literalmente um Cacto'
    | 'Guaxinim Garimpeiro';

export interface Mascot {
    id: string;
    project_id: string;
    type: MascotType;
    level: number;
    xp: number;
    name: string;
    current_mood: string;
    active_aura: string;
    updated_at: string;
}

export interface BattleBuddy {
    id: string;
    project_id: string;
    sprint_id: string;
    user_1_id: string;
    user_2_id: string;
    created_at: string;
}

export interface UserCard {
    id: string;
    user_id: string;
    card_id: string;
    card_name: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny';
    is_shiny: boolean;
    obtained_at: string;
}

export interface MerchantSpawn {
    id: string;
    project_id: string;
    merchant_name: string;
    expires_at: string;
    inventory_json: string;
}

export interface KudosLog {
    id: string;
    daily_id: string;
    from_user_id: string;
    to_user_id: string;
    kudo_type: string;
    created_at: string;
}

export type HexadProfile =
    | 'Philanthropist'
    | 'Socialiser'
    | 'FreeSpirit'
    | 'Achiever'
    | 'Player'
    | 'Disruptor';

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
    hexad_profile?: HexadProfile | null;
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

export type ImpedimentStatus = 'active' | 'in_assistance' | 'resolved';

export interface Impediment {
    id: string;
    project_id: string;
    user_id: string;
    daily_id?: string | null;
    description: string;
    status: ImpedimentStatus;
    helper_id?: string | null;
    block_streak: number;
    created_at: string;
    resolved_at?: string | null;
}

export interface ImpedimentWithDetails extends Impediment {
    user: User;
    helper?: User | null;
}

export type TaskStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'carried_over';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type EventType = 'meeting' | 'review' | 'retrospective' | 'demo' | 'planning';
export type RetroCategory = 'went_well' | 'to_improve' | 'action_item';

export interface PlannedTask {
    id: string;
    project_id: string;
    sprint_id?: string | null;
    title: string;
    description?: string | null;
    points: number;
    assignee_id?: string | null;
    creator_id: string;
    status: TaskStatus;
    review_notes?: string | null;
    created_at: string;
    completed_at?: string | null;
}

export interface PlannedTaskWithDetails extends PlannedTask {
    assignee?: User | null;
    creator?: User | null;
}

export interface PlannedEvent {
    id: string;
    project_id: string;
    sprint_id?: string | null;
    title: string;
    description?: string | null;
    event_type: EventType;
    event_date: string;
    creator_id: string;
    status: EventStatus;
    review_notes?: string | null;
    created_at: string;
}

export interface PlannedEventWithDetails extends PlannedEvent {
    creator?: User | null;
}

export interface RetrospectiveItem {
    id: string;
    project_id: string;
    sprint_id?: string | null;
    author_id: string;
    category: RetroCategory;
    content: string;
    upvotes: number;
    status: 'open' | 'addressed' | 'resolved';
    created_at: string;
}

export interface RetrospectiveItemWithAuthor extends RetrospectiveItem {
    author?: User | null;
    has_voted?: boolean;
}

export interface RetrospectiveVote {
    id: string;
    item_id: string;
    user_id: string;
    created_at: string;
}

export interface DiscreetHelpRequest {
    id: string;
    project_id: string;
    helper_id: string;
    requester_id?: string | null;
    task_id?: string | null;
    status: 'available' | 'matched' | 'completed';
    note?: string | null;
    created_at: string;
}

export interface DiscreetHelpRequestWithDetails extends DiscreetHelpRequest {
    helper: User;
    requester?: User | null;
    task?: PlannedTask | null;
}


