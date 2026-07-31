import { supabase } from "../supabase.js";
import { Logger } from "../logger.js";
import type { UserCard } from "../types.js";

export interface CardDefinition {
    id: string;
    name: string;
    icon: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny';
    description: string;
}

export const CARD_REGISTRY: CardDefinition[] = [
    { id: "c1", name: "O Café Esquecido", icon: "☕", rarity: "Common", description: "Esfriou mas ainda dá energia." },
    { id: "c2", name: "O Bug de Sexta", icon: "🐛", rarity: "Common", description: "Clássico erro que aparece às 17h59." },
    { id: "c3", name: "Gambiarra Suprema", icon: "🛠️", rarity: "Rare", description: "Funciona e ninguém sabe como." },
    { id: "c4", name: "Lógica Inquebrável", icon: "💎", rarity: "Rare", description: "Um algoritmo perfeito à prova de falhas." },
    { id: "c5", name: "O Mergão Sem Conflito", icon: "🔀", rarity: "Epic", description: "Raridade lendária de um Git merge limpo." },
    { id: "c6", name: "Deploy Sem Caos", icon: "🚀", rarity: "Shiny", description: "O milagre divino do código em produção." }
];

const CARD_POOLS = {
    Common: CARD_REGISTRY.filter(c => c.rarity === 'Common'),
    Rare: CARD_REGISTRY.filter(c => c.rarity === 'Rare'),
    Epic: CARD_REGISTRY.filter(c => c.rarity === 'Epic'),
    Shiny: CARD_REGISTRY.filter(c => c.rarity === 'Shiny'),
};

export function drawCard(): { id: string; name: string; rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny'; isShiny: boolean } {
    const rand = Math.random() * 100;
    const rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny' = rand > 98 ? "Shiny" : rand > 90 ? "Epic" : rand > 60 ? "Rare" : "Common";
    const pool = CARD_POOLS[rarity];
    const cardDef = pool[Math.floor(Math.random() * pool.length)] || CARD_REGISTRY[0]!;
    return { id: cardDef.id, name: cardDef.name, rarity: cardDef.rarity, isShiny: cardDef.rarity === "Shiny" };
}

export class CardService {
    static async drawCard(userId: string): Promise<UserCard | null> {
        const card = drawCard();
        const { data, error } = await supabase.from("user_cards").insert([{
            user_id: userId, card_id: card.id, card_name: card.name, rarity: card.rarity, is_shiny: card.isShiny, obtained_at: new Date().toISOString()
        }]).select().single();
        if (error) return Logger.error("Failed to insert user card:", error), null;
        return data as UserCard;
    }

    static async getUserCards(userId: string): Promise<UserCard[]> {
        const { data, error } = await supabase.from("user_cards").select("*").eq("user_id", userId).order("obtained_at", { ascending: false });
        if (error) return Logger.error("Failed to fetch user cards:", error), [];
        return (data || []) as UserCard[];
    }
}
