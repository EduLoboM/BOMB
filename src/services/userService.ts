import { supabase } from "../supabase.js";
import type { User, ProjectMemberWithUser, UserBadge } from "../types.js";

export const userService = {
    /**
     * Gets a global user by Discord ID.
     */
    async getUserByDiscordId(discordId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("discord_id", discordId)
            .returns<User[]>()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Legacy helper method for compatibility.
     */
    async getMember(discordId: string, projectId: string): Promise<User | null> {
        const user = await this.getUserByDiscordId(discordId);
        if (!user) return null;

        const isMember = await this.isMemberOfProject(user.id, projectId);
        return isMember ? user : null;
    },

    /**
     * Gets or creates a global RPG user profile.
     */
    async getOrCreateUser(discordId: string, displayName: string): Promise<{ user: User; isNew: boolean }> {
        const existing = await this.getUserByDiscordId(discordId);
        if (existing) {
            // Update display name if changed
            if (existing.display_name !== displayName) {
                await supabase
                    .from("users")
                    .update({ display_name: displayName })
                    .eq("id", existing.id);
                existing.display_name = displayName;
            }
            return { user: existing, isNew: false };
        }

        const { data, error } = await supabase
            .from("users")
            .insert({
                discord_id: discordId,
                display_name: displayName,
                character_class: "Gobbo",
                xp: 0,
                level: 1,
                streak: 0,
                max_streak: 0,
                class_chosen_at_level: 1
            })
            .select()
            .returns<User[]>()
            .single();

        if (error) throw error;
        return { user: data, isNew: true };
    },

    /**
     * Checks if a user is linked to a project.
     */
    async isMemberOfProject(userId: string, projectId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from("project_members")
            .select("id")
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .returns<{ id: string }[]>()
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    /**
     * Links a global user to a project.
     */
    async addMemberToProject(userId: string, projectId: string): Promise<void> {
        const { error } = await supabase
            .from("project_members")
            .upsert({
                user_id: userId,
                project_id: projectId
            }, { onConflict: "project_id,user_id" });

        if (error) throw error;
    },

    /**
     * Helper for joining project: gets/creates global user and links to project.
     */
    async addMember(discordId: string, projectId: string, displayName: string): Promise<User> {
        const { user } = await this.getOrCreateUser(discordId, displayName);
        await this.addMemberToProject(user.id, projectId);
        return user;
    },

    /**
     * Gets all global users belonging to a project.
     */
    async getProjectMembers(projectId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from("project_members")
            .select("*, users(*)")
            .eq("project_id", projectId)
            .returns<ProjectMemberWithUser[]>();

        if (error) throw error;
        return (data || []).map(pm => pm.users).filter(Boolean);
    },

    /**
     * Gets leaderboard users ordered by XP descending.
     */
    async getLeaderboard(projectId?: string, limitCount: number = 10): Promise<User[]> {
        if (projectId) {
            const members = await this.getProjectMembers(projectId);
            return members.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, limitCount);
        }

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("xp", { ascending: false })
            .limit(limitCount)
            .returns<User[]>();

        if (error) throw error;
        return data || [];
    },

    /**
     * Awards a project completion badge to a user.
     */
    async awardBadge(userId: string, projectName: string, description: string, icon: string = "🏆"): Promise<void> {
        const { error } = await supabase
            .from("user_badges")
            .insert({
                user_id: userId,
                project_name: projectName,
                description,
                icon
            });

        if (error) throw error;
    },

    /**
     * Gets all project completion badges awarded to a user.
     */
    async getUserBadges(userId: string): Promise<UserBadge[]> {
        const { data, error } = await supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", userId)
            .order("awarded_at", { ascending: false })
            .returns<UserBadge[]>();

        if (error) throw error;
        return data || [];
    }
};
