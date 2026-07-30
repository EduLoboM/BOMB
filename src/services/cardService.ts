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

export class CardService {
    static async drawCard(userId: string): Promise<UserCard | null> {
        const rand = Math.random() * 100;
        let rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny' = "Common";
        
        if (rand > 98) rarity = "Shiny";
        else if (rand > 90) rarity = "Epic";
        else if (rand > 60) rarity = "Rare";

        const pool = CARD_REGISTRY.filter(c => c.rarity === rarity);
        const cardDef = pool[Math.floor(Math.random() * pool.length)] || CARD_REGISTRY[0];

        const { data, error } = await supabase
            .from("user_cards")
            .insert([{
                user_id: userId,
                card_id: cardDef!.id,
                card_name: cardDef!.name,
                rarity: cardDef!.rarity,
                is_shiny: cardDef!.rarity === "Shiny",
                obtained_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            Logger.error("Failed to insert user card:", error);
            return null;
        }

        return data as UserCard;
    }

    static async getUserCards(userId: string): Promise<UserCard[]> {
        const { data, error } = await supabase
            .from("user_cards")
            .select("*")
            .eq("user_id", userId)
            .order("obtained_at", { ascending: false });

        if (error) {
            Logger.error("Failed to fetch user cards:", error);
            return [];
        }

        return (data || []) as UserCard[];
    }
}

export function drawCard(): { id: string; name: string; rarity: string; isShiny: boolean } {
  const rand = Math.random() * 100;
  let rarity: 'Common' | 'Rare' | 'Epic' | 'Shiny' = "Common";
  
  if (rand > 98) rarity = "Shiny";
  else if (rand > 90) rarity = "Epic";
  else if (rand > 60) rarity = "Rare";

  const pool = CARD_REGISTRY.filter(c => c.rarity === rarity);
  const cardDef = pool[Math.floor(Math.random() * pool.length)] || CARD_REGISTRY[0];

  return {
    id: cardDef!.id,
    name: cardDef!.name,
    rarity: cardDef!.rarity,
    isShiny: cardDef!.rarity === 'Shiny'
  };
}

