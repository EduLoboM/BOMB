import { supabase } from "../supabase.js";
import type { Project } from "../types.js";

export const projectService = {

    async getProjectsByGuild(guildId: string): Promise<Project[]> {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("guild_id", guildId)
            .returns<Project[]>();

        if (error) throw error;
        return data || [];
    },
    async getProjectByGuild(guildId: string, projectName?: string): Promise<Project | null> {
        const projects = await this.getProjectsByGuild(guildId);
        if (projects.length === 0) return null;

        if (projectName) {
            const found = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
            return found || null;
        }
        return projects[0] || null;
    },

    async getProjectByAccessCode(accessCode: string): Promise<Project | null> {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("access_code", accessCode)
            .returns<Project[]>()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async createProject(name: string, guildId: string, accessCode: string): Promise<Project> {
        const { data, error } = await supabase
            .from("projects")
            .insert({
                guild_id: guildId,
                name: name,
                access_code: accessCode,
            })
            .select()
            .returns<Project[]>()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProjectChannel(projectId: string, channelId: string): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({ channel_id: channelId })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateProjectSchedule(projectId: string, dailyTime: string, weekdays: string, dailyPeriod: number, timezone: string): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({
                daily_time: dailyTime,
                weekdays: weekdays,
                daily_period: dailyPeriod,
                timezone: timezone,
            })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateProjectSprintSettings(projectId: string, sprintRepeat: boolean, sprintDuration: number): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({
                sprint_repeat: sprintRepeat,
                sprint_duration: sprintDuration,
            })
            .eq("id", projectId);

        if (error) throw error;
    },

    async getProjectsWithSprintRepeat(): Promise<Project[]> {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("sprint_repeat", true)
            .returns<Project[]>();

        if (error) throw error;
        return data || [];
    },

    async getAllScheduledProjects(): Promise<Project[]> {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .not("daily_time", "is", null)
            .not("weekdays", "is", null)
            .returns<Project[]>();

        if (error) throw error;
        return data || [];
    },

    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateAutoRoles(projectId: string, enabled: boolean): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({ auto_roles: enabled })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateGamification(projectId: string, enabled: boolean): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({ gamification_enabled: enabled })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateLanguage(projectId: string, language: string): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({ language })
            .eq("id", projectId);

        if (error) throw error;
    },

    async updateProjectAccessCode(projectId: string, accessCode: string): Promise<void> {
        const { error } = await supabase
            .from("projects")
            .update({ access_code: accessCode })
            .eq("id", projectId);

        if (error) throw error;
    }
};
