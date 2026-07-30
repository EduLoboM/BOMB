import { supabase } from "../supabase.js";
import { Logger } from "../logger.js";
import type { Impediment, ImpedimentWithDetails, ImpedimentStatus } from "../types.js";

export function isNoBlockerText(text: string | null | undefined): boolean {
    if (!text) return true;
    const trimmed = text.trim().toLowerCase();
    return (
        trimmed === "" ||
        trimmed === "none" ||
        trimmed === "nenhum" ||
        trimmed === "n/a" ||
        trimmed === "na" ||
        trimmed === "sem obstáculos" ||
        trimmed === "sem obstaculos" ||
        trimmed === "sem bloqueios" ||
        trimmed === "-" ||
        trimmed === "--"
    );
}

export const impedimentService = {
    async recordStandupBlocker(
        userId: string,
        projectId: string,
        dailyId: string | null,
        blockerText: string
    ): Promise<{ impediment: Impediment | null; isStreakAlert: boolean; blockStreak: number }> {
        if (isNoBlockerText(blockerText)) {
            await this.autoResolveActiveImpediments(userId, projectId);
            return { impediment: null, isStreakAlert: false, blockStreak: 0 };
        }

        const active = await this.getUserActiveImpediment(userId, projectId);

        let newStreak = 1;
        if (active) {
            newStreak = (active.block_streak ?? 1) + 1;
            const { data, error } = await supabase
                .from("impediments")
                .update({
                    description: blockerText.trim(),
                    block_streak: newStreak,
                    daily_id: dailyId ?? active.daily_id,
                })
                .eq("id", active.id)
                .select("*")
                .single();

            if (error) {
                Logger.error(`Failed to update impediment ${active.id}:`, error);
                throw error;
            }

            return {
                impediment: data as Impediment,
                isStreakAlert: newStreak >= 2,
                blockStreak: newStreak,
            };
        } else {
            const { data, error } = await supabase
                .from("impediments")
                .insert({
                    project_id: projectId,
                    user_id: userId,
                    daily_id: dailyId,
                    description: blockerText.trim(),
                    status: "active",
                    block_streak: 1,
                })
                .select("*")
                .single();

            if (error) {
                Logger.error("Failed to insert new impediment:", error);
                throw error;
            }

            return {
                impediment: data as Impediment,
                isStreakAlert: false,
                blockStreak: 1,
            };
        }
    },

    async getUserActiveImpediment(userId: string, projectId: string): Promise<Impediment | null> {
        const { data, error } = await supabase
            .from("impediments")
            .select("*")
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .in("status", ["active", "in_assistance"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            Logger.error(`Failed to get active impediment for user ${userId}:`, error);
            return null;
        }

        return data as Impediment | null;
    },

    async autoResolveActiveImpediments(userId: string, projectId: string): Promise<void> {
        const { error } = await supabase
            .from("impediments")
            .update({
                status: "resolved",
                resolved_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("project_id", projectId)
            .in("status", ["active", "in_assistance"]);

        if (error) {
            Logger.error(`Failed to auto-resolve impediments for user ${userId}:`, error);
        }
    },

    async getActiveImpediments(projectId: string): Promise<ImpedimentWithDetails[]> {
        const { data, error } = await supabase
            .from("impediments")
            .select("*, user:users!impediments_user_id_fkey(*), helper:users!impediments_helper_id_fkey(*)")
            .eq("project_id", projectId)
            .in("status", ["active", "in_assistance"])
            .order("block_streak", { ascending: false });

        if (error) {
            const fallback = await supabase
                .from("impediments")
                .select("*")
                .eq("project_id", projectId)
                .in("status", ["active", "in_assistance"])
                .order("block_streak", { ascending: false });

            if (fallback.error) {
                Logger.error(`Failed to fetch active impediments for project ${projectId}:`, fallback.error);
                return [];
            }

            const impediments = fallback.data || [];
            const result: ImpedimentWithDetails[] = [];
            for (const imp of impediments) {
                const [uRes, hRes] = await Promise.all([
                    supabase.from("users").select("*").eq("id", imp.user_id).single(),
                    imp.helper_id ? supabase.from("users").select("*").eq("id", imp.helper_id).single() : Promise.resolve({ data: null })
                ]);
                result.push({
                    ...imp,
                    user: uRes.data,
                    helper: hRes.data,
                } as ImpedimentWithDetails);
            }
            return result;
        }

        return (data || []) as ImpedimentWithDetails[];
    },

    async getImpedimentById(impedimentId: string): Promise<ImpedimentWithDetails | null> {
        const { data, error } = await supabase
            .from("impediments")
            .select("*")
            .eq("id", impedimentId)
            .maybeSingle();

        if (error || !data) return null;

        const [uRes, hRes] = await Promise.all([
            supabase.from("users").select("*").eq("id", data.user_id).single(),
            data.helper_id ? supabase.from("users").select("*").eq("id", data.helper_id).single() : Promise.resolve({ data: null })
        ]);

        return {
            ...data,
            user: uRes.data,
            helper: hRes.data,
        } as ImpedimentWithDetails;
    },

    async assignHelper(impedimentId: string, helperUserId: string): Promise<ImpedimentWithDetails | null> {
        const { error } = await supabase
            .from("impediments")
            .update({
                helper_id: helperUserId,
                status: "in_assistance",
            })
            .eq("id", impedimentId);

        if (error) {
            Logger.error(`Failed to assign helper for impediment ${impedimentId}:`, error);
            throw error;
        }

        return this.getImpedimentById(impedimentId);
    },

    async resolveImpediment(impedimentId: string, resolverUserId: string): Promise<ImpedimentWithDetails | null> {
        const existing = await this.getImpedimentById(impedimentId);
        if (!existing) return null;

        const updatePayload: Record<string, any> = {
            status: "resolved",
            resolved_at: new Date().toISOString(),
        };

        if (!existing.helper_id && existing.user_id !== resolverUserId) {
            updatePayload.helper_id = resolverUserId;
        }

        const { error } = await supabase
            .from("impediments")
            .update(updatePayload)
            .eq("id", impedimentId);

        if (error) {
            Logger.error(`Failed to resolve impediment ${impedimentId}:`, error);
            throw error;
        }

        return this.getImpedimentById(impedimentId);
    },

    async getProjectImpedimentStats(projectId: string): Promise<{
        totalActive: number;
        inAssistance: number;
        resolved: number;
        maxBlockStreak: number;
        unassignedCount: number;
    }> {
        const [{ data: activeList }, { data: resolvedList }] = await Promise.all([
            supabase.from("impediments").select("*").eq("project_id", projectId).in("status", ["active", "in_assistance"]),
            supabase.from("impediments").select("id").eq("project_id", projectId).eq("status", "resolved")
        ]);

        const active = activeList || [];
        const resolved = resolvedList || [];

        let inAssistance = 0;
        let unassignedCount = 0;
        let maxBlockStreak = 0;

        for (const item of active) {
            if (item.status === "in_assistance") inAssistance++;
            if (!item.helper_id) unassignedCount++;
            if (item.block_streak > maxBlockStreak) maxBlockStreak = item.block_streak;
        }

        return {
            totalActive: active.length,
            inAssistance,
            resolved: resolved.length,
            maxBlockStreak,
            unassignedCount,
        };
    }
};
