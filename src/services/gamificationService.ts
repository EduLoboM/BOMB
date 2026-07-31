import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild, GuildMember } from "discord.js";
import { Logger } from "../logger.js";
import { supabase } from "../supabase.js";
import type { User, Project, HexadProfile } from "../types.js";

export interface HexadInfo {
    profile: HexadProfile;
    name: string;
    icon: string;
    sdtDriver: string;
    description: string;
    recommendedClass: string;
}

export const HEXAD_REGISTRY: Record<HexadProfile, HexadInfo> = {
    Philanthropist: { profile: "Philanthropist", name: "Filantropo (Mentoria & Propósito)", icon: "🩺", sdtDriver: "Propósito & Altruísmo", description: "Motivado pelo propósito maior e por ajudar companheiros de guilda a desobstruir o caminho.", recommendedClass: "Healer" },
    Socialiser: { profile: "Socialiser", name: "Socializador (Comunidade & Conexão)", icon: "🤝", sdtDriver: "Pertencimento & Relações", description: "Motivado pela sinergia do time, interação social, morale e conquistas em grupo.", recommendedClass: "Beast Tamer" },
    FreeSpirit: { profile: "FreeSpirit", name: "Espírito Livre (Autonomia & Exploração)", icon: "🎨", sdtDriver: "Autonomia & Autoexpressão", description: "Motivado pela liberdade, personalização, descobertas de segredos e escolhas customizadas.", recommendedClass: "Gobbo" },
    Achiever: { profile: "Achiever", name: "Realizador (Maestria & Competência)", icon: "⚡", sdtDriver: "Competência & Maestria", description: "Motivado por superação de desafios, consistência perfeita de streak e velocidade de entrega.", recommendedClass: "Spearman" },
    Player: { profile: "Player", name: "Jogador (Recompensas & Multiplicadores)", icon: "💎", sdtDriver: "Recompensas Extrínsecas", description: "Motivado pelo acúmulo de XP, multiplicadores compostos de streak e loot épico.", recommendedClass: "Mooladin" },
    Disruptor: { profile: "Disruptor", name: "Disruptor (Mudança & Inovação)", icon: "⚔️", sdtDriver: "Transformação & Agilidade", description: "Motivado por quebrar a burocracia, fatiar bloqueios complexos e sacudir a rotina.", recommendedClass: "Scissorpaw" }
};

export interface ClassDefinition {
    name: string;
    icon: string;
    tier: number;
    description: string;
    passiveInfo: string;
    hexadProfile: HexadProfile;
    hexadIcon: string;
    hexadTitle: string;
    evolvesTo?: string[];
    requiredLevelForEvo?: number;
}

export const CLASS_REGISTRY: Record<string, ClassDefinition> = {
    "Gobbo": { name: "Gobbo", icon: "🍀", tier: 1, description: "Tricky scavenger with unpredictable luck.", passiveInfo: "20% chance for a Lucky Scavenger Critical Hit (Double XP).", hexadProfile: "FreeSpirit", hexadIcon: "🎨", hexadTitle: "Espírito Livre (Autonomia)", evolvesTo: ["Angel Gobbo"], requiredLevelForEvo: 5 },
    "Angel Gobbo": { name: "Angel Gobbo", icon: "🪽", tier: 2, description: "Blessed goblin illuminated by divine fortune.", passiveInfo: "35% chance for Critical Hit (Double XP) + 25 extra base XP.", hexadProfile: "FreeSpirit", hexadIcon: "🎨", hexadTitle: "Espírito Livre (Autonomia)", evolvesTo: ["Angel"], requiredLevelForEvo: 15 },
    "Angel": { name: "Angel", icon: "👼", tier: 3, description: "Ascended celestial entity of supreme consistency.", passiveInfo: "50% chance for Critical Hit (Double XP) + 50 base XP + complete streak shield protection.", hexadProfile: "FreeSpirit", hexadIcon: "🎨", hexadTitle: "Espírito Livre (Autonomia)" },
    "Spearman": { name: "Spearman", icon: "🗡️", tier: 1, description: "Swift frontline soldier eager to act.", passiveInfo: "+50% XP bonus when you are the first member to submit the daily standup.", hexadProfile: "Achiever", hexadIcon: "⚡", hexadTitle: "Realizador (Maestria)", evolvesTo: ["Sunflower Knight"], requiredLevelForEvo: 5 },
    "Sunflower Knight": { name: "Sunflower Knight", icon: "🌻", tier: 2, description: "Radiant knight spreading warmth and morale across the server.", passiveInfo: "+75% XP bonus when submitting first + 30 XP team morale boost.", hexadProfile: "Achiever", hexadIcon: "⚡", hexadTitle: "Realizador (Maestria)", evolvesTo: ["Undead Shieldsman"], requiredLevelForEvo: 15 },
    "Undead Shieldsman": { name: "Undead Shieldsman", icon: "🧟‍♂️", tier: 3, description: "Undead guardian whose streak and speed never die.", passiveInfo: "+100% XP bonus when submitting first + 50 XP undead bonus + complete streak reset immunity.", hexadProfile: "Achiever", hexadIcon: "⚡", hexadTitle: "Realizador (Maestria)" },
    "Mooladin": { name: "Mooladin", icon: "🐮", tier: 1, description: "Sturdy bovine defender with unwavering endurance.", passiveInfo: "+30% bonus to daily streak XP multipliers.", hexadProfile: "Player", hexadIcon: "💎", hexadTitle: "Jogador (Recompensas)", evolvesTo: ["Iron Mooladin"], requiredLevelForEvo: 5 },
    "Iron Mooladin": { name: "Iron Mooladin", icon: "⛓️", tier: 2, description: "Heavy ironclad bovine guardian built like an impenetrable fortress.", passiveInfo: "+45% bonus to daily streak XP multipliers + 15% chance for Iron Fortitude Crit (1.5x XP).", hexadProfile: "Player", hexadIcon: "💎", hexadTitle: "Jogador (Recompensas)", evolvesTo: ["Heretic Mooladin"], requiredLevelForEvo: 15 },
    "Heretic Mooladin": { name: "Heretic Mooladin", icon: "😈", tier: 3, description: "Dark bovine warrior wielding chaotic demonic power.", passiveInfo: "+60% streak XP multiplier + 30% chance for Dark Chaos Crit (1.75x XP).", hexadProfile: "Player", hexadIcon: "💎", hexadTitle: "Jogador (Recompensas)" },
    "Healer": { name: "Healer", icon: "🩹", tier: 1, description: "Compassionate protector keeping the squad healthy.", passiveInfo: "+35 XP bonus when submitting a standup with no blockers.", hexadProfile: "Philanthropist", hexadIcon: "🩺", hexadTitle: "Filantropo (Propósito)", evolvesTo: ["Druid"], requiredLevelForEvo: 5 },
    "Druid": { name: "Druid", icon: "🌿", tier: 2, description: "Nature scholar connected to the team's growth.", passiveInfo: "+50 XP bonus for blocker-free standups + 20 XP for detailed reports.", hexadProfile: "Philanthropist", hexadIcon: "🩺", hexadTitle: "Filantropo (Propósito)", evolvesTo: ["Moth Mage"], requiredLevelForEvo: 15 },
    "Moth Mage": { name: "Moth Mage", icon: "🦋", tier: 3, description: "Arcane scholar drawn to the light of progress.", passiveInfo: "+75 XP for blocker-free standups + 40 XP for detailed reports + 25% total XP boost.", hexadProfile: "Philanthropist", hexadIcon: "🩺", hexadTitle: "Filantropo (Propósito)" },
    "Beast Tamer": { name: "Beast Tamer", icon: "🐾", tier: 1, description: "Leader of team harmony and squad coordination.", passiveInfo: "+25 XP bonus for detailed reports + 20 XP when 100% of squad submits.", hexadProfile: "Socialiser", hexadIcon: "🤝", hexadTitle: "Socializador (Comunidade)", evolvesTo: ["Beast Huntress"], requiredLevelForEvo: 5 },
    "Beast Huntress": { name: "Beast Huntress", icon: "🏹", tier: 2, description: "Relentless tracker hunting down project impediments.", passiveInfo: "+45 XP bonus for detailed reports + 35 XP when identifying blockers.", hexadProfile: "Socialiser", hexadIcon: "🤝", hexadTitle: "Socializador (Comunidade)", evolvesTo: ["Lightbringer"], requiredLevelForEvo: 15 },
    "Lightbringer": { name: "Lightbringer", icon: "✨", tier: 3, description: "Legendary beacon illuminating the entire guild.", passiveInfo: "+60 XP base bonus + 50 XP squad synergy + grants bonus aura to the team.", hexadProfile: "Socialiser", hexadIcon: "🤝", hexadTitle: "Socializador (Comunidade)" },
    "Scissorpaw": { name: "Scissorpaw", icon: "✂️", tier: 1, description: "Sharp-clawed adventurer that cuts through obstacles.", passiveInfo: "+40 XP bonus for blocker-free standups + 15% Crit chance.", hexadProfile: "Disruptor", hexadIcon: "⚔️", hexadTitle: "Disruptor (Mudança)", evolvesTo: ["Dashing Fencer"], requiredLevelForEvo: 5 },
    "Dashing Fencer": { name: "Dashing Fencer", icon: "🤺", tier: 2, description: "Flashy feline fencer darting across obstacles with flair and speed.", passiveInfo: "+50 XP for blocker-free standups + 30% first-submission bonus + 22% Crit chance.", hexadProfile: "Disruptor", hexadIcon: "⚔️", hexadTitle: "Disruptor (Mudança)", evolvesTo: ["Fox Musketeer"], requiredLevelForEvo: 15 },
    "Fox Musketeer": { name: "Fox Musketeer", icon: "🦊", tier: 3, description: "Ultra-fast duelist cutting deadlines with fencer precision.", passiveInfo: "+60 XP for blocker-free standups + 60% first-submission bonus + 30% Crit chance.", hexadProfile: "Disruptor", hexadIcon: "⚔️", hexadTitle: "Disruptor (Mudança)" }
};

export interface XPResult {
    xpGained: number;
    baseXP: number;
    streakBonus: number;
    passiveBonus: number;
    isCrit: boolean;
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
    newStreak: number;
    oldClass: string;
    availableEvolutions: string[];
    passiveNotes: string[];
}

export const gamificationService = {
    getXPForLevel(level: number): number {
        return level <= 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.5));
    },

    calculateLevelFromXP(xp: number): number {
        let level = 1;
        while (this.getXPForLevel(level + 1) <= xp) level++;
        return level;
    },

    getDefaultClass(): string {
        return "Gobbo";
    },

    calculateHexadFromAnswers(q1: string, q2: string, q3: string): HexadProfile {
        const scores: Record<HexadProfile, number> = { Philanthropist: 0, Socialiser: 0, FreeSpirit: 0, Achiever: 0, Player: 0, Disruptor: 0 };
        const keyMap: Record<string, HexadProfile> = { purpose: "Philanthropist", social: "Socialiser", autonomy: "FreeSpirit", mastery: "Achiever", rewards: "Player", disrupt: "Disruptor" };

        [q1, q2, q3].forEach(q => { if (keyMap[q]) scores[keyMap[q]] += 2; });

        let top: HexadProfile = "FreeSpirit", max = -1;
        for (const [p, score] of Object.entries(scores) as [HexadProfile, number][]) {
            if (score > max) { max = score; top = p; }
        }
        return top;
    },

    async saveUserHexadProfile(userId: string, hexadProfile: HexadProfile): Promise<boolean> {
        const { error } = await supabase.from("users").update({ hexad_profile: hexadProfile }).eq("id", userId);
        if (error) Logger.error(`Failed to save hexad profile for user ${userId}:`, error);
        return !error;
    },

    getAvailableEvolutions(characterClass: string, level: number, classChosenAtLevel: number = 1): string[] {
        const classDef = CLASS_REGISTRY[characterClass];
        if (!classDef?.evolvesTo?.length) return [];

        const span = classDef.requiredLevelForEvo ?? (classDef.tier === 1 ? 5 : 15);
        const minTarget = Math.max(span, classChosenAtLevel > 1 ? classChosenAtLevel + span : span);
        return level >= minTarget ? classDef.evolvesTo : [];
    },

    async processDailySubmission(
        user: User,
        project: Project,
        isFirstSubmissionToday: boolean,
        hasNoBlockers: boolean,
        doneText: string,
        todoText: string
    ): Promise<XPResult> {
        const currentXP = user.xp ?? 0, currentLevel = user.level ?? 1, currentStreak = user.streak ?? 0;
        const maxStreak = user.max_streak ?? 0, currentClass = user.character_class || this.getDefaultClass();
        const todayStr = new Date().toISOString().split("T")[0]!;
        let newStreak = currentStreak;
        const lastSub = user.last_submission_date ? new Date(user.last_submission_date).toISOString().split("T")[0] : null;

        if (lastSub !== todayStr) {
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
            if (lastSub === yesterdayStr) newStreak += 1;
            else if (!lastSub) newStreak = 1;
            else if (["Undead Shieldsman", "Angel"].includes(currentClass) && currentStreak > 0) {
                Logger.info(`Streak protected by ${currentClass} passive for user ${user.id}`);
            } else newStreak = 1;
        }

        const newMaxStreak = Math.max(maxStreak, newStreak);
        let baseXP = 100;
        const passiveNotes: string[] = [];

        const baseAdditions: Record<string, [number, string]> = {
            "Angel Gobbo": [25, "🪽 Blessed Base XP (+25 XP)"],
            "Angel": [50, "👼 Divine Base XP (+50 XP)"],
            "Undead Shieldsman": [50, "🧟‍♂️ Undead Base XP (+50 XP)"],
            "Lightbringer": [60, "✨ Lightbringer Base XP (+60 XP)"]
        };
        if (baseAdditions[currentClass]) {
            baseXP += baseAdditions[currentClass]![0];
            passiveNotes.push(baseAdditions[currentClass]![1]);
        }

        const streakMultipliers: Record<string, [number, string]> = {
            "Mooladin": [1.3, "🐮 Sturdy Streak Multiplier (x1.3)"],
            "Iron Mooladin": [1.45, "⛓️ Iron Streak Multiplier (x1.45)"],
            "Heretic Mooladin": [1.6, "😈 Dark Streak Multiplier (x1.6)"],
            "Sunflower Knight": [1.2, "🌻 Morale Streak Multiplier (x1.2)"]
        };
        const [streakMult, streakNote] = streakMultipliers[currentClass] ?? [1.0, ""];
        if (streakNote) passiveNotes.push(streakNote);

        const streakBonus = Math.min(150, Math.floor(newStreak * 10 * streakMult));
        let passiveBonus = 0, isCrit = false;

        if (isFirstSubmissionToday) {
            const firstStrikes: Record<string, [number, number, string]> = {
                "Spearman": [0.5, 0, "🗡️ First Strike Bonus (+50% XP)"],
                "Sunflower Knight": [0.75, 30, "🌻 Radiant Vanguard Bonus (+75% XP)"],
                "Undead Shieldsman": [1.0, 0, "🧟‍♂️ Undead Bastion First Strike (+100% XP)"],
                "Dashing Fencer": [0.3, 0, "🤺 Dashing Speed Bonus (+30% XP)"],
                "Fox Musketeer": [0.6, 0, "🦊 Fencer Precision Speed Bonus (+60% XP)"]
            };
            if (firstStrikes[currentClass]) {
                const [pct, flat, note] = firstStrikes[currentClass]!;
                passiveBonus += Math.floor((baseXP + streakBonus) * pct) + flat;
                passiveNotes.push(note);
            }
        }

        if (hasNoBlockers) {
            const noBlockerBonuses: Record<string, [number, string]> = {
                "Healer": [35, "🩹 Cure Impediments (+35 XP)"],
                "Druid": [50, "🌿 Nature Balance (+50 XP)"],
                "Moth Mage": [75, "🦋 Arcane Epiphany (+75 XP)"],
                "Scissorpaw": [40, "✂️ Obstacle Cut (+40 XP)"],
                "Dashing Fencer": [50, "🤺 Blocker Parry (+50 XP)"],
                "Fox Musketeer": [60, "🦊 Fencer Blocker Slice (+60 XP)"]
            };
            if (noBlockerBonuses[currentClass]) {
                passiveBonus += noBlockerBonuses[currentClass]![0];
                passiveNotes.push(noBlockerBonuses[currentClass]![1]);
            }
        }

        if (doneText.length + todoText.length > 100) {
            const detailBonuses: Record<string, [number, string]> = {
                "Beast Tamer": [25, "🐾 Pack Tactics Detailed Update (+25 XP)"],
                "Druid": [20, "🌿 Nature Scholar Detailed Update (+20 XP)"],
                "Beast Huntress": [45, "🏹 Relentless Tracker Detailed Update (+45 XP)"],
                "Moth Mage": [40, "🦋 Arcane Report Detailed Update (+40 XP)"]
            };
            if (detailBonuses[currentClass]) {
                passiveBonus += detailBonuses[currentClass]![0];
                passiveNotes.push(detailBonuses[currentClass]![1]);
            }
        }

        const critThresholds: Record<string, number> = {
            "Gobbo": 0.20, "Angel Gobbo": 0.35, "Angel": 0.50,
            "Scissorpaw": 0.15, "Dashing Fencer": 0.22, "Fox Musketeer": 0.30
        };
        const critThresh = critThresholds[currentClass] ?? 0;
        if (critThresh > 0 && Math.random() < critThresh) {
            isCrit = true;
            passiveNotes.push(`${CLASS_REGISTRY[currentClass]?.icon} CRITICAL HIT! (2.0x Double XP)`);
        }

        let totalGained = baseXP + streakBonus + passiveBonus;
        if (currentClass === "Moth Mage") {
            totalGained = Math.floor(totalGained * 1.25);
            passiveNotes.push("🦋 Arcane Boost (+25% Total XP)");
        }
        if (isCrit) totalGained *= 2;

        if (currentClass === "Iron Mooladin" && Math.random() < 0.15) {
            totalGained = Math.floor(totalGained * 1.5);
            passiveNotes.push("⛓️ Iron Fortitude Crit! (1.5x XP)");
        }
        if (currentClass === "Heretic Mooladin" && Math.random() < 0.30) {
            totalGained = Math.floor(totalGained * 1.75);
            passiveNotes.push("😈 Dark Chaos Crit! (1.75x XP)");
        }

        const newXP = currentXP + totalGained;
        const newLevel = this.calculateLevelFromXP(newXP);
        const leveledUp = newLevel > currentLevel;

        const availableEvolutions = this.getAvailableEvolutions(currentClass, newLevel, user.class_chosen_at_level ?? 1);
        const { error } = await supabase.from("users").update({
            xp: newXP, level: newLevel, streak: newStreak, max_streak: newMaxStreak, last_submission_date: todayStr,
        }).eq("id", user.id);

        if (error) Logger.error(`Failed to update gamification stats for user ${user.id}:`, error);

        return {
            xpGained: totalGained, baseXP, streakBonus, passiveBonus, isCrit,
            oldLevel: currentLevel, newLevel, leveledUp, newStreak, oldClass: currentClass, availableEvolutions, passiveNotes
        };
    },

    async changeUserClass(user: User, newClass: string): Promise<boolean> {
        const classDef = CLASS_REGISTRY[newClass];
        if (!classDef) throw new Error(`Invalid class: ${newClass}`);

        const updatePayload: Record<string, any> = { character_class: newClass };
        if (classDef.tier === 1) updatePayload.class_chosen_at_level = user.level ?? 1;

        const { error } = await supabase.from("users").update(updatePayload).eq("id", user.id);
        if (error) Logger.error(`Failed to change class for user ${user.id}:`, error);
        return !error;
    },

    async syncUserRole(guild: Guild, member: GuildMember, characterClass: string): Promise<void> {
        try {
            const classDef = CLASS_REGISTRY[characterClass];
            if (!classDef) return;

            const roleName = `${classDef.icon} ${classDef.name}`;
            let role = guild.roles.cache.find(r => r.name === roleName || r.name === classDef.name);
            if (!role) role = await guild.roles.create({ name: roleName, reason: `BOMB Gamification auto-role for ${classDef.name} class` });

            if (!member.roles.cache.has(role.id)) await member.roles.add(role);

            for (const [_, existingRole] of member.roles.cache) {
                if (existingRole.id !== role.id) {
                    if (Object.values(CLASS_REGISTRY).some(cDef => existingRole.name === `${cDef.icon} ${cDef.name}` || existingRole.name === cDef.name)) {
                        await member.roles.remove(existingRole).catch(() => {});
                    }
                }
            }
        } catch (err) {
            Logger.warn(`Could not sync Discord role for member ${member.id}: ${String(err)}`);
        }
    },

    async addXP(userId: string, xpAmount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
        const { data: user } = await supabase.from("users").select("*").eq("id", userId).single();
        if (!user) return { newXP: 0, newLevel: 1, leveledUp: false };

        const newXP = (user.xp || 0) + xpAmount;
        const newLevel = this.calculateLevelFromXP(newXP);
        await supabase.from("users").update({ xp: newXP, level: newLevel }).eq("id", userId);
        return { newXP, newLevel, leveledUp: newLevel > (user.level || 1) };
    }
};

export function createClassSelectRow(user: User): ActionRowBuilder<StringSelectMenuBuilder> {
    const currentClass = user.character_class || "Gobbo";
    const currentLevel = user.level ?? 1;
    const classChosenAtLevel = user.class_chosen_at_level ?? 1;

    const availableEvolutions = gamificationService.getAvailableEvolutions(currentClass, currentLevel, classChosenAtLevel);
    const baseClasses = ["Gobbo", "Spearman", "Mooladin", "Healer", "Beast Tamer", "Scissorpaw"];
    const options: StringSelectMenuOptionBuilder[] = [];

    for (const evoName of availableEvolutions) {
        const def = CLASS_REGISTRY[evoName];
        if (def) {
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`⚡ EVOLUÇÃO: ${def.icon} ${def.name}`)
                    .setDescription(`[${def.hexadTitle}] ${def.passiveInfo.substring(0, 70)}`)
                    .setValue(def.name)
            );
        }
    }

    for (const cName of baseClasses) {
        const def = CLASS_REGISTRY[cName];
        if (def) {
            const isCurrent = cName === currentClass;
            const desc = `${isCurrent ? "[Atual | " : "["}${def.hexadTitle}] ${def.passiveInfo}`;
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${def.icon} ${def.name} (${def.hexadIcon} ${def.hexadProfile})${isCurrent ? " ★" : ""}`)
                    .setDescription(desc.substring(0, 100))
                    .setValue(def.name)
                    .setDefault(isCurrent)
            );
        }
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId("class_select_menu")
        .setPlaceholder("🛡️ Escolha ou Evolua sua Classe de Aventureiro...")
        .addOptions(options.slice(0, 25));

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export function calculateDailyXP(user: any, project: any, mascot: any, isEarlyBird: boolean) {
    let base = 100;
    let breakdown = 'Base 100 XP';

    if (isEarlyBird) {
        base += 25;
        breakdown += ' + Early Bird 25 XP';
    }

    if (mascot && (mascot.type === 'Fusca Transformer' || mascot.name === 'Fusca Transformer') && isEarlyBird) {
        base += 25;
        breakdown += ' + Aura Mascote 25 XP';
    }

    return { totalXp: base, breakdown };
}
