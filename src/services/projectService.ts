import { supabase } from "../supabase.js";
import type { Project } from "../types.js";

const guildProjectCache = new Map<string, { projects: Project[]; expiresAt: number }>();
const accessCodeProjectCache = new Map<string, { project: Project | null; expiresAt: number }>();
const CACHE_TTL_MS = 15_000;

export function clearProjectCache(guildId?: string, accessCode?: string) {
    if (guildId) guildProjectCache.delete(guildId);
    if (accessCode) accessCodeProjectCache.delete(accessCode.toUpperCase());
    if (!guildId && !accessCode) {
        guildProjectCache.clear();
        accessCodeProjectCache.clear();
    }
}

export const projectService = {
    async getProjectsByGuild(guildId: string): Promise<Project[]> {
        const cached = guildProjectCache.get(guildId);
        if (cached && Date.now() < cached.expiresAt) return cached.projects;

        const { data, error } = await supabase.from("projects").select("*").eq("guild_id", guildId).returns<Project[]>();
        if (error) throw error;
        const projects = data || [];
        guildProjectCache.set(guildId, { projects, expiresAt: Date.now() + CACHE_TTL_MS });
        return projects;
    },
    async getProjectByGuild(guildId: string, projectName?: string): Promise<Project | null> {
        const projects = await this.getProjectsByGuild(guildId);
        if (projects.length === 0) return null;
        return projectName ? projects.find(p => p.name.toLowerCase() === projectName.toLowerCase()) || null : projects[0] || null;
    },
    async getProjectByAccessCode(accessCode: string): Promise<Project | null> {
        const codeKey = accessCode.trim().toUpperCase();
        const cached = accessCodeProjectCache.get(codeKey);
        if (cached && Date.now() < cached.expiresAt) return cached.project;

        const { data, error } = await supabase.from("projects").select("*").eq("access_code", codeKey).returns<Project[]>().maybeSingle();
        if (error) throw error;
        accessCodeProjectCache.set(codeKey, { project: data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
    },
    async createProject(name: string, guildId: string, accessCode: string): Promise<Project> {
        const { data, error } = await supabase.from("projects").insert({ guild_id: guildId, name, access_code: accessCode }).select().returns<Project[]>().single();
        if (error) throw error;
        clearProjectCache(guildId, accessCode);
        return data;
    },
    async updateProjectChannel(projectId: string, channelId: string): Promise<void> {
        const { error } = await supabase.from("projects").update({ channel_id: channelId }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateProjectSchedule(projectId: string, dailyTime: string, weekdays: string, dailyPeriod: number, timezone: string): Promise<void> {
        const { error } = await supabase.from("projects").update({ daily_time: dailyTime, weekdays, daily_period: dailyPeriod, timezone }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateProjectSprintSettings(projectId: string, sprintRepeat: boolean, sprintDuration: number): Promise<void> {
        const { error } = await supabase.from("projects").update({ sprint_repeat: sprintRepeat, sprint_duration: sprintDuration }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async getProjectsWithSprintRepeat(): Promise<Project[]> {
        const { data, error } = await supabase.from("projects").select("*").eq("sprint_repeat", true).returns<Project[]>();
        if (error) throw error;
        return data || [];
    },
    async getAllScheduledProjects(): Promise<Project[]> {
        const { data, error } = await supabase.from("projects").select("*").not("daily_time", "is", null).not("weekdays", "is", null).returns<Project[]>();
        if (error) throw error;
        return data || [];
    },
    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase.from("projects").delete().eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateAutoRoles(projectId: string, enabled: boolean): Promise<void> {
        const { error } = await supabase.from("projects").update({ auto_roles: enabled }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateGamification(projectId: string, enabled: boolean): Promise<void> {
        const { error } = await supabase.from("projects").update({ gamification_enabled: enabled }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateLanguage(projectId: string, language: string): Promise<void> {
        const { error } = await supabase.from("projects").update({ language }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    },
    async updateProjectAccessCode(projectId: string, accessCode: string): Promise<void> {
        const { error } = await supabase.from("projects").update({ access_code: accessCode }).eq("id", projectId);
        if (error) throw error;
        clearProjectCache();
    }
};
