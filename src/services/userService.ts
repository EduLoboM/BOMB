import { supabase } from "../supabase.js";
import type { User, ProjectMemberWithUser, UserBadge } from "../types.js";

const userCacheByDiscordId = new Map<string, { user: User; expiresAt: number }>();
const projectMemberCache = new Map<string, { isMember: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 10_000;

export function invalidateUserCache(discordId?: string) {
    if (discordId) userCacheByDiscordId.delete(discordId);
    else userCacheByDiscordId.clear();
}

export const userService = {
    async getUserByDiscordId(discordId: string): Promise<User | null> {
        const cached = userCacheByDiscordId.get(discordId);
        if (cached && Date.now() < cached.expiresAt) return cached.user;

        const { data, error } = await supabase.from("users").select("*").eq("discord_id", discordId).returns<User[]>().maybeSingle();
        if (error) throw error;
        if (data) userCacheByDiscordId.set(discordId, { user: data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
    },
    async getMember(discordId: string, projectId: string): Promise<User | null> {
        const user = await this.getUserByDiscordId(discordId);
        return user && (await this.isMemberOfProject(user.id, projectId)) ? user : null;
    },
    async getOrCreateUser(discordId: string, displayName: string): Promise<{ user: User; isNew: boolean }> {
        const existing = await this.getUserByDiscordId(discordId);
        if (existing) {
            if (existing.display_name !== displayName) {
                existing.display_name = displayName;
                supabase.from("users").update({ display_name: displayName }).eq("id", existing.id).then();
            }
            return { user: existing, isNew: false };
        }

        const { data, error } = await supabase.from("users").insert({
            discord_id: discordId, display_name: displayName, character_class: "Gobbo", xp: 0, level: 1, streak: 0, max_streak: 0, class_chosen_at_level: 1
        }).select().returns<User[]>().single();
        if (error) throw error;
        userCacheByDiscordId.set(discordId, { user: data, expiresAt: Date.now() + CACHE_TTL_MS });
        return { user: data, isNew: true };
    },
    async isMemberOfProject(userId: string, projectId: string): Promise<boolean> {
        const cacheKey = `${userId}:${projectId}`;
        const cached = projectMemberCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) return cached.isMember;

        const { data, error } = await supabase.from("project_members").select("id").eq("user_id", userId).eq("project_id", projectId).returns<{ id: string }[]>().maybeSingle();
        if (error) throw error;
        const isMember = !!data;
        projectMemberCache.set(cacheKey, { isMember, expiresAt: Date.now() + CACHE_TTL_MS });
        return isMember;
    },
    async addMemberToProject(userId: string, projectId: string): Promise<void> {
        const { error } = await supabase.from("project_members").upsert({ user_id: userId, project_id: projectId }, { onConflict: "project_id,user_id" });
        if (error) throw error;
        projectMemberCache.set(`${userId}:${projectId}`, { isMember: true, expiresAt: Date.now() + CACHE_TTL_MS });
    },
    async addMember(discordId: string, projectId: string, displayName: string): Promise<User> {
        const { user } = await this.getOrCreateUser(discordId, displayName);
        await this.addMemberToProject(user.id, projectId);
        return user;
    },
    async getProjectMembers(projectId: string): Promise<User[]> {
        const { data, error } = await supabase.from("project_members").select("*, users(*)").eq("project_id", projectId).returns<ProjectMemberWithUser[]>();
        if (error) throw error;
        return (data || []).map(pm => pm.users).filter(Boolean);
    },
    async getLeaderboard(projectId?: string, limitCount: number = 10): Promise<User[]> {
        if (projectId) {
            return (await this.getProjectMembers(projectId)).sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, limitCount);
        }
        const { data, error } = await supabase.from("users").select("*").order("xp", { ascending: false }).limit(limitCount).returns<User[]>();
        if (error) throw error;
        return data || [];
    },
    async awardBadge(userId: string, projectName: string, description: string, icon: string = "🏆"): Promise<void> {
        const { error } = await supabase.from("user_badges").insert({ user_id: userId, project_name: projectName, description, icon });
        if (error) throw error;
    },
    async getUserBadges(userId: string): Promise<UserBadge[]> {
        const { data, error } = await supabase.from("user_badges").select("*").eq("user_id", userId).order("awarded_at", { ascending: false }).returns<UserBadge[]>();
        if (error) throw error;
        return data || [];
    }
};
