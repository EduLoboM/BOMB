import { supabase } from "../supabase.js";

export const sprintService = {
    async getSprints(projectId: string) {
        const { data, error } = await supabase
            .from("sprints")
            .select("*")
            .eq("project_id", projectId)
            .order("number", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getLatestSprintNumber(projectId: string) {
        const { data, error } = await supabase
            .from("sprints")
            .select("number")
            .eq("project_id", projectId)
            .order("number", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data ? data.number : 0;
    },

    async createSprint(projectId: string, number: number, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from("sprints")
            .insert({
                project_id: projectId,
                number: number,
                start_date: startDate,
                end_date: endDate,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
