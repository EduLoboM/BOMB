import { supabase } from "../supabase.js";
import type { Sprint } from "../types.js";

const activeSprintCache = new Map<string, { sprint: Sprint | null; expiresAt: number }>();
const CACHE_TTL_MS = 10_000;

export function clearSprintCache(projectId?: string) {
    if (projectId) activeSprintCache.delete(projectId);
    else activeSprintCache.clear();
}

export const sprintService = {
    async getSprints(projectId: string): Promise<Sprint[]> {
        const { data, error } = await supabase.from("sprints").select("*").eq("project_id", projectId).order("number", { ascending: false }).returns<Sprint[]>();
        if (error) throw error;
        return data || [];
    },

    async getLatestSprintNumber(projectId: string): Promise<number> {
        const { data, error } = await supabase.from("sprints").select("number").eq("project_id", projectId).order("number", { ascending: false }).limit(1).returns<Pick<Sprint, "number">[]>().maybeSingle();
        if (error) throw error;
        return data?.number ?? 0;
    },

    async createSprint(projectId: string, number: number, startDate: string, endDate: string): Promise<Sprint> {
        const { data, error } = await supabase.from("sprints").insert({ project_id: projectId, number, start_date: startDate, end_date: endDate }).select().returns<Sprint[]>().single();
        if (error) throw error;
        clearSprintCache(projectId);
        return data;
    },

    async getActiveSprint(projectId: string): Promise<Sprint | null> {
        const cached = activeSprintCache.get(projectId);
        if (cached && Date.now() < cached.expiresAt) return cached.sprint;

        const sprint = (await this.getSprints(projectId))[0] || null;
        activeSprintCache.set(projectId, { sprint, expiresAt: Date.now() + CACHE_TTL_MS });
        return sprint;
    }
};
