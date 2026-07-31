import { supabase } from "../supabase.js";
import { Logger } from "../logger.js";

export class KudosService {
    static async addKudo(dailyId: string, fromUserId: string, toUserId: string, kudoType: string = "kudos"): Promise<boolean> {
        if (fromUserId === toUserId) return false;
        const { error } = await supabase.from("kudos").insert([{ daily_id: dailyId, from_user_id: fromUserId, to_user_id: toUserId, kudo_type: kudoType, created_at: new Date().toISOString() }]);
        if (error) return Logger.error("Failed to add kudo:", error), false;

        try {
            await supabase.rpc("increment_user_xp", { target_user_id: toUserId, xp_amount: 10 });
        } catch {
            const { data } = await supabase.from("users").select("xp").eq("id", toUserId).single();
            if (data) await supabase.from("users").update({ xp: (data.xp || 0) + 10 }).eq("id", toUserId);
        }
        return true;
    }
}
