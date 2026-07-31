import { supabase } from "../supabase.js";
import { Logger } from "../logger.js";
import type { BattleBuddy } from "../types.js";

export class BuddyService {
    static async getBuddy(projectId: string, userId: string): Promise<BattleBuddy | null> {
        const { data, error } = await supabase.from("battle_buddies").select("*").eq("project_id", projectId).or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`).maybeSingle();
        if (error && error.code !== "PGRST116") Logger.error("Failed to fetch battle buddy:", error);
        return (data as BattleBuddy) ?? null;
    }

    static async setBuddyPair(projectId: string, sprintId: string, user1Id: string, user2Id: string): Promise<BattleBuddy | null> {
        const { data, error } = await supabase.from("battle_buddies").insert([{ project_id: projectId, sprint_id: sprintId, user_1_id: user1Id, user_2_id: user2Id, created_at: new Date().toISOString() }]).select().single();
        if (error) Logger.error("Failed to pair battle buddies:", error);
        return (data as BattleBuddy) ?? null;
    }
}
