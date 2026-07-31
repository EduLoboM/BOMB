import { supabase } from "../supabase.js";
import { Logger } from "../logger.js";
import type { Mascot, MascotType } from "../types.js";

export interface MascotDefinition {
    type: MascotType;
    icon: string;
    name: string;
    description: string;
    auraInfo: string;
    stage1Name: string;
    stage2Name: string;
    stage3Name: string;
}

export const MASCOT_REGISTRY: Record<MascotType, MascotDefinition> = {
    "Fusca Transformer": { type: "Fusca Transformer", icon: "🚗", name: "Fusca Transformer", description: "Carro clássico que se desdobra em robô.", auraInfo: "+25% XP em envios matutinos", stage1Name: "Fusca Enferrujado", stage2Name: "Fusca Tunado", stage3Name: "Robô Transformer Supremo" },
    "Filhote de Esfinge": { type: "Filhote de Esfinge", icon: "👶", name: "Filhote de Esfinge", description: "Mini esfinge mística de fralda.", auraInfo: "+20% XP por detalhamento de blockers", stage1Name: "Esfinge de Fralda", stage2Name: "Esfinge de Babador", stage3Name: "Esfinge da Sabedoria" },
    "Kaiju de Forma": { type: "Kaiju de Forma", icon: "🍞", name: "Kaiju de Forma", description: "Monstro colossal no formato de pão de forma.", auraInfo: "Proteção de streak em atrasos curtos", stage1Name: "Fatia Simples", stage2Name: "Pão Tostado Kaiju", stage3Name: "Kaiju de Forma Mágico" },
    "Pato Voodoo de Borracha": { type: "Pato Voodoo de Borracha", icon: "🦆", name: "Pato Voodoo de Borracha", description: "Pato de borracha com alfinetes e magia voodoo.", auraInfo: "+15% XP bônus em Kudos e reações", stage1Name: "Patinho de Banho Voodoo", stage2Name: "Pato Voodoo Erudito", stage3Name: "Pato Voodoo Arcano Cósmico" },
    "Literalmente um Cacto": { type: "Literalmente um Cacto", icon: "🌵", name: "Literalmente um Cacto", description: "Literalmente um cacto estático em um vaso.", auraInfo: "+20% XP multiplicador em streaks", stage1Name: "Brotinho de Cacto", stage2Name: "Cacto Simples", stage3Name: "Literalmente um Cacto Supremo" },
    "Guaxinim Garimpeiro": { type: "Guaxinim Garimpeiro", icon: "🦝", name: "Guaxinim Garimpeiro", description: "Guaxinim esperto com tampa de lixeira como escudo.", auraInfo: "Maior chance de drop de cards raros", stage1Name: "Guaxinim do Lixo", stage2Name: "Guaxinim Garimpeiro", stage3Name: "Guaxinim Rei do Reciclável" }
};

export class MascotService {
    static async getMascot(projectId: string): Promise<Mascot | null> {
        const { data, error } = await supabase.from("mascots").select("*").eq("project_id", projectId).maybeSingle();
        if (error && error.code !== "PGRST116") Logger.error("Failed to fetch mascot:", error);
        return (data as Mascot) ?? null;
    }

    static async getOrCreateMascot(projectId: string, mascotType: MascotType = "Fusca Transformer"): Promise<Mascot> {
        const mascot = await this.getMascot(projectId);
        if (mascot) return mascot;

        const def = MASCOT_REGISTRY[mascotType] || MASCOT_REGISTRY["Fusca Transformer"];
        const { data, error } = await supabase.from("mascots").insert([{
            project_id: projectId, type: mascotType, level: 1, xp: 0, name: def.stage1Name, current_mood: "Feliz", active_aura: def.auraInfo, updated_at: new Date().toISOString()
        }]).select().single();

        if (error) { Logger.error("Failed to create mascot:", error); throw error; }
        return data as Mascot;
    }

    static async setMascotType(projectId: string, mascotType: MascotType): Promise<Mascot> {
        const def = MASCOT_REGISTRY[mascotType];
        if (!def) throw new Error("Invalid mascot type");

        const mascot = await this.getMascot(projectId);
        if (!mascot) return this.getOrCreateMascot(projectId, mascotType);

        const stageName = mascot.level >= 10 ? def.stage3Name : mascot.level >= 5 ? def.stage2Name : def.stage1Name;
        const { data, error } = await supabase.from("mascots").update({
            type: mascotType, name: stageName, active_aura: def.auraInfo, updated_at: new Date().toISOString()
        }).eq("project_id", projectId).select().single();

        if (error) throw error;
        return data as Mascot;
    }

    static async feedMascot(projectId: string, xpGained: number): Promise<{ mascot: Mascot; leveledUp: boolean }> {
        const mascot = await this.getOrCreateMascot(projectId);
        const newXP = mascot.xp + Math.round(xpGained * 0.2);
        const leveledUp = newXP >= mascot.level * 100;
        const newLevel = leveledUp ? mascot.level + 1 : mascot.level;

        const def = MASCOT_REGISTRY[mascot.type];
        const stageName = newLevel >= 10 ? def.stage3Name : newLevel >= 5 ? def.stage2Name : def.stage1Name;

        const { data, error } = await supabase.from("mascots").update({
            xp: newXP, level: newLevel, name: stageName, updated_at: new Date().toISOString()
        }).eq("id", mascot.id).select().single();

        if (error) { Logger.error("Failed to update mascot XP:", error); return { mascot, leveledUp: false }; }
        return { mascot: data as Mascot, leveledUp };
    }

    static renderMascotBanner(mascot: Mascot): string {
        const def = MASCOT_REGISTRY[mascot.type] || MASCOT_REGISTRY["Fusca Transformer"];
        const nextLevelXP = mascot.level * 100;
        const progress = Math.min(100, Math.floor((mascot.xp / nextLevelXP) * 100));

        return [
            "```ansi",
            `\u001b[1;33m${def.icon} MASCOTE DA GUILDA: ${mascot.name} (Nível ${mascot.level})\u001b[0m`,
            `\u001b[0;36mAura Ativa:\u001b[0m ${def.auraInfo}`,
            `\u001b[0;32mAlimentação:\u001b[0m ${mascot.xp} / ${nextLevelXP} XP (${progress}%)`,
            "```"
        ].join("\n");
    }
}
