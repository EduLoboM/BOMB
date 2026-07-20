import { supabase } from "../supabase.js";

export const userService = {
    async getMember(discordId: string, projectId: string) {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("discord_id", discordId)
            .eq("project_id", projectId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getProjectMembers(projectId: string) {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("project_id", projectId);

        if (error) throw error;
        return data || [];
    },

    async addMember(discordId: string, projectId: string, displayName: string) {
        const { data, error } = await supabase
            .from("users")
            .insert({
                discord_id: discordId,
                project_id: projectId,
                display_name: displayName,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
