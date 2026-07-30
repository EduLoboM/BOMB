import { supabase } from "../supabase.js";
import type { Sprint } from "../types.js";

export const sprintService = {
    async getSprints(projectId: string): Promise<Sprint[]> {
        const { data, error } = await supabase
            .from("sprints")
            .select("*")
            .eq("project_id", projectId)
            .order("number", { ascending: false })
            .returns<Sprint[]>();

        if (error) throw error;
        return data || [];
    },

    async getLatestSprintNumber(projectId: string): Promise<number> {
        const { data, error } = await supabase
            .from("sprints")
            .select("number")
            .eq("project_id", projectId)
            .order("number", { ascending: false })
            .limit(1)
            .returns<Pick<Sprint, "number">[]>()
            .maybeSingle();

        if (error) throw error;
        return data ? data.number : 0;
    },

    async createSprint(projectId: string, number: number, startDate: string, endDate: string): Promise<Sprint> {
        const { data, error } = await supabase
            .from("sprints")
            .insert({
                project_id: projectId,
                number: number,
                start_date: startDate,
                end_date: endDate,
            })
            .select()
            .returns<Sprint[]>()
            .single();

        if (error) throw error;
        return data;
    },

    async getActiveSprint(projectId: string): Promise<Sprint | null> {
        const sprints = await this.getSprints(projectId);
        return sprints[0] || null;
    }
};

