import { supabase } from "../supabase.js";
import type { User } from "../types.js";

export const userService = {
    async getMember(discordId: string, projectId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("discord_id", discordId)
            .eq("project_id", projectId)
            .returns<User[]>()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getProjectMembers(projectId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("project_id", projectId)
            .returns<User[]>();

        if (error) throw error;
        return data || [];
    },

    async addMember(discordId: string, projectId: string, displayName: string): Promise<User> {
        const { data, error } = await supabase
            .from("users")
            .insert({
                discord_id: discordId,
                project_id: projectId,
                display_name: displayName,
            })
            .select()
            .returns<User[]>()
            .single();

        if (error) throw error;
        return data;
    }
};
