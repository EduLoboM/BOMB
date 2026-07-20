import { supabase } from "../supabase.js";

export const projectService = {
    async getProjectByGuild(guildId: string) {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("guild_id", guildId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getProjectByAccessCode(accessCode: string) {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("access_code", accessCode)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async createProject(name: string, guildId: string, accessCode: string) {
        const { data, error } = await supabase
            .from("projects")
            .insert({
                guild_id: guildId,
                name: name,
                access_code: accessCode,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProjectChannel(projectId: string, channelId: string) {
        const { error } = await supabase
            .from("projects")
            .update({ channel_id: channelId })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateProjectSchedule(projectId: string, dailyTime: string, weekdays: string) {
        const { error } = await supabase
            .from("projects")
            .update({
                daily_time: dailyTime,
                weekdays: weekdays,
            })
            .eq("id", projectId);

        if (error) throw error;
    },

    async getAllScheduledProjects() {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .not("daily_time", "is", null)
            .not("weekdays", "is", null);

        if (error) throw error;
        return data;
    }
};
