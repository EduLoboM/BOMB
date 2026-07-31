import { supabase } from "../supabase.js";
import type { DailyWithUser } from "../types.js";

export const dailyService = {
    async getDailyForUserToday(userId: string, projectId: string, startOfDay: string, endOfDay: string): Promise<{ id: string } | null> {
        const { data, error } = await supabase.from("dailies").select("id").eq("user_id", userId).eq("project_id", projectId).gte("submitted_at", startOfDay).lte("submitted_at", endOfDay).returns<{ id: string }[]>().maybeSingle();
        if (error) throw error;
        return data;
    },

    async getDailiesForProjectToday(projectId: string, startOfDay: string, endOfDay: string): Promise<DailyWithUser[]> {
        const { data, error } = await supabase.from("dailies").select("*, users(*)").eq("project_id", projectId).gte("submitted_at", startOfDay).lte("submitted_at", endOfDay).returns<DailyWithUser[]>();
        if (error) throw error;
        return data || [];
    },

    async updateDaily(dailyId: string, done: string, todo: string, blockers: string): Promise<void> {
        const { error } = await supabase.from("dailies").update({ done, todo, blockers, submitted_at: new Date().toISOString() }).eq("id", dailyId);
        if (error) throw error;
    },

    async createDaily(userId: string, projectId: string, done: string, todo: string, blockers: string): Promise<void> {
        const { error } = await supabase.from("dailies").insert({ user_id: userId, project_id: projectId, done, todo, blockers, submitted_at: new Date().toISOString() });
        if (error) throw error;
    }
};
