import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Guild, GuildMember } from "discord.js";
import { Logger } from "../logger.js";
import { supabase } from "../supabase.js";
import type { User, Project } from "../types.js";

export interface ClassDefinition {
    name: string;
    icon: string;
    tier: number;
    description: string;
    passiveInfo: string;
    evolvesTo?: string[];
    requiredLevelForEvo?: number;
}

export const CLASS_REGISTRY: Record<string, ClassDefinition> = {

    "Gobbo": {
        name: "Gobbo",
        icon: "🍀",
        tier: 1,
        description: "Tricky scavenger with unpredictable luck.",
        passiveInfo: "20% chance for a Lucky Scavenger Critical Hit (Double XP).",
        evolvesTo: ["Angel Gobbo"],
        requiredLevelForEvo: 5
    },
    "Angel Gobbo": {
        name: "Angel Gobbo",
        icon: "🪽",
        tier: 2,
        description: "Blessed goblin illuminated by divine fortune.",
        passiveInfo: "35% chance for Critical Hit (Double XP) + 25 extra base XP.",
        evolvesTo: ["Angel"],
        requiredLevelForEvo: 15
    },
    "Angel": {
        name: "Angel",
        icon: "👼",
        tier: 3,
        description: "Ascended celestial entity of supreme consistency.",
        passiveInfo: "50% chance for Critical Hit (Double XP) + 50 base XP + complete streak shield protection."
    },
    "Spearman": {
        name: "Spearman",
        icon: "🗡️",
        tier: 1,
        description: "Swift frontline soldier eager to act.",
        passiveInfo: "+50% XP bonus when you are the first member to submit the daily standup.",
        evolvesTo: ["Sunflower Knight"],
        requiredLevelForEvo: 5
    },
    "Sunflower Knight": {
        name: "Sunflower Knight",
        icon: "🌻",
        tier: 2,
        description: "Radiant knight spreading warmth and morale across the server.",
        passiveInfo: "+75% XP bonus when submitting first + 30 XP team morale boost.",
        evolvesTo: ["Undead Shieldsman"],
        requiredLevelForEvo: 15
    },
    "Undead Shieldsman": {
        name: "Undead Shieldsman",
        icon: "🧟‍♂️",
        tier: 3,
        description: "Undead guardian whose streak and speed never die.",
        passiveInfo: "+100% XP bonus when submitting first + 50 XP undead bonus + complete streak reset immunity."
    },
    "Mooladin": {
        name: "Mooladin",
        icon: "🐮",
        tier: 1,
        description: "Sturdy bovine defender with unwavering endurance.",
        passiveInfo: "+30% bonus to daily streak XP multipliers.",
        evolvesTo: ["Iron Mooladin"],
        requiredLevelForEvo: 5
    },
    "Iron Mooladin": {
        name: "Iron Mooladin",
        icon: "⛓️",
        tier: 2,
        description: "Heavy ironclad bovine guardian built like an impenetrable fortress.",
        passiveInfo: "+45% bonus to daily streak XP multipliers + 15% chance for Iron Fortitude Crit (1.5x XP).",
        evolvesTo: ["Heretic Mooladin"],
        requiredLevelForEvo: 15
    },
    "Heretic Mooladin": {
        name: "Heretic Mooladin",
        icon: "😈",
        tier: 3,
        description: "Dark bovine warrior wielding chaotic demonic power.",
        passiveInfo: "+60% streak XP multiplier + 30% chance for Dark Chaos Crit (1.75x XP)."
    },
    "Healer": {
        name: "Healer",
        icon: "🩹",
        tier: 1,
        description: "Compassionate protector keeping the squad healthy.",
        passiveInfo: "+35 XP bonus when submitting a standup with no blockers.",
        evolvesTo: ["Druid"],
        requiredLevelForEvo: 5
    },
    "Druid": {
        name: "Druid",
        icon: "🌿",
        tier: 2,
        description: "Nature scholar connected to the team's growth.",
        passiveInfo: "+50 XP bonus for blocker-free standups + 20 XP for detailed reports.",
        evolvesTo: ["Moth Mage"],
        requiredLevelForEvo: 15
    },
    "Moth Mage": {
        name: "Moth Mage",
        icon: "🦋",
        tier: 3,
        description: "Arcane scholar drawn to the light of progress.",
        passiveInfo: "+75 XP for blocker-free standups + 40 XP for detailed reports + 25% total XP boost."
    },
    "Beast Tamer": {
        name: "Beast Tamer",
        icon: "🐾",
        tier: 1,
        description: "Leader of team harmony and squad coordination.",
        passiveInfo: "+25 XP bonus for detailed reports + 20 XP when 100% of squad submits.",
        evolvesTo: ["Beast Huntress"],
        requiredLevelForEvo: 5
    },
    "Beast Huntress": {
        name: "Beast Huntress",
        icon: "🏹",
        tier: 2,
        description: "Relentless tracker hunting down project impediments.",
        passiveInfo: "+45 XP bonus for detailed reports + 35 XP when identifying blockers.",
        evolvesTo: ["Lightbringer"],
        requiredLevelForEvo: 15
    },
    "Lightbringer": {
        name: "Lightbringer",
        icon: "✨",
        tier: 3,
        description: "Legendary beacon illuminating the entire guild.",
        passiveInfo: "+60 XP base bonus + 50 XP squad synergy + grants bonus aura to the team."
    },
    "Scissorpaw": {
        name: "Scissorpaw",
        icon: "✂️",
        tier: 1,
        description: "Sharp-clawed adventurer that cuts through obstacles.",
        passiveInfo: "+40 XP bonus for blocker-free standups + 15% Crit chance.",
        evolvesTo: ["Dashing Fencer"],
        requiredLevelForEvo: 5
    },
    "Dashing Fencer": {
        name: "Dashing Fencer",
        icon: "🤺",
        tier: 2,
        description: "Flashy feline fencer darting across obstacles with flair and speed.",
        passiveInfo: "+50 XP for blocker-free standups + 30% first-submission bonus + 22% Crit chance.",
        evolvesTo: ["Fox Musketeer"],
        requiredLevelForEvo: 15
    },
    "Fox Musketeer": {
        name: "Fox Musketeer",
        icon: "🦊",
        tier: 3,
        description: "Ultra-fast duelist cutting deadlines with fencer precision.",
        passiveInfo: "+60 XP for blocker-free standups + 60% first-submission bonus + 30% Crit chance."
    }
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
        if (level <= 1) return 0;
        return Math.floor(100 * Math.pow(level - 1, 1.5));
    },
    calculateLevelFromXP(xp: number): number {
        let level = 1;
        while (this.getXPForLevel(level + 1) <= xp) {
            level++;
        }
        return level;
    },
    getDefaultClass(): string {
        return "Gobbo";
    },
    getAvailableEvolutions(characterClass: string, level: number, classChosenAtLevel: number = 1): string[] {
        const classDef = CLASS_REGISTRY[characterClass];
        if (!classDef || !classDef.evolvesTo || classDef.evolvesTo.length === 0) return [];

        const isBaseClass = classDef.tier === 1;
        const requiredSpan = classDef.requiredLevelForEvo ?? (isBaseClass ? 5 : 15);

        const minTargetLevel = Math.max(
            requiredSpan,
            classChosenAtLevel > 1 ? classChosenAtLevel + requiredSpan : requiredSpan
        );

        if (level >= minTargetLevel) {
            return classDef.evolvesTo;
        }

        return [];
    },
    async processDailySubmission(
        user: User,
        project: Project,
        isFirstSubmissionToday: boolean,
        hasNoBlockers: boolean,
        doneText: string,
        todoText: string
    ): Promise<XPResult> {
        const currentXP = user.xp ?? 0;
        const currentLevel = user.level ?? 1;
        const currentStreak = user.streak ?? 0;
        const maxStreak = user.max_streak ?? 0;
        const currentClass = user.character_class || this.getDefaultClass();
        const todayStr = new Date().toISOString().split("T")[0]!;
        let newStreak = currentStreak;
        const lastSub = user.last_submission_date ? new Date(user.last_submission_date).toISOString().split("T")[0] : null;

        if (lastSub !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (lastSub === yesterdayStr) {
                newStreak += 1;
            } else if (!lastSub) {
                newStreak = 1;
            } else {

                if (["Undead Shieldsman", "Angel"].includes(currentClass) && currentStreak > 0) {
                    newStreak = currentStreak;
                    Logger.info(`Streak protected by ${currentClass} passive for user ${user.id}`);
                } else {
                    newStreak = 1;
                }
            }
        }

        const newMaxStreak = Math.max(maxStreak, newStreak);
        let baseXP = 100;
        const passiveNotes: string[] = [];

        if (currentClass === "Angel Gobbo") {
            baseXP += 25;
            passiveNotes.push("🪽 Blessed Base XP (+25 XP)");
        } else if (currentClass === "Angel") {
            baseXP += 50;
            passiveNotes.push("👼 Divine Base XP (+50 XP)");
        } else if (currentClass === "Undead Shieldsman") {
            baseXP += 50;
            passiveNotes.push("🧟‍♂️ Undead Base XP (+50 XP)");
        } else if (currentClass === "Lightbringer") {
            baseXP += 60;
            passiveNotes.push("✨ Lightbringer Base XP (+60 XP)");
        }
        let streakMultiplier = 1.0;
        if (currentClass === "Mooladin") {
            streakMultiplier = 1.3;
            passiveNotes.push("🐮 Sturdy Streak Multiplier (x1.3)");
        } else if (currentClass === "Iron Mooladin") {
            streakMultiplier = 1.45;
            passiveNotes.push("⛓️ Iron Streak Multiplier (x1.45)");
        } else if (currentClass === "Heretic Mooladin") {
            streakMultiplier = 1.6;
            passiveNotes.push("😈 Dark Streak Multiplier (x1.6)");
        } else if (currentClass === "Sunflower Knight") {
            streakMultiplier = 1.2;
            passiveNotes.push("🌻 Morale Streak Multiplier (x1.2)");
        }

        const streakBonus = Math.min(150, Math.floor(newStreak * 10 * streakMultiplier));
        let passiveBonus = 0;
        let isCrit = false;
        if (isFirstSubmissionToday) {
            if (currentClass === "Spearman") {
                passiveBonus += Math.floor((baseXP + streakBonus) * 0.5);
                passiveNotes.push("🗡️ First Strike Bonus (+50% XP)");
            } else if (currentClass === "Sunflower Knight") {
                passiveBonus += Math.floor((baseXP + streakBonus) * 0.75) + 30;
                passiveNotes.push("🌻 Radiant Vanguard Bonus (+75% XP)");
            } else if (currentClass === "Undead Shieldsman") {
                passiveBonus += (baseXP + streakBonus);
                passiveNotes.push("🧟‍♂️ Undead Bastion First Strike (+100% XP)");
            } else if (currentClass === "Dashing Fencer") {
                passiveBonus += Math.floor((baseXP + streakBonus) * 0.3);
                passiveNotes.push("🤺 Dashing Speed Bonus (+30% XP)");
            } else if (currentClass === "Fox Musketeer") {
                passiveBonus += Math.floor((baseXP + streakBonus) * 0.6);
                passiveNotes.push("🦊 Fencer Precision Speed Bonus (+60% XP)");
            }
        }
        if (hasNoBlockers) {
            if (currentClass === "Healer") {
                passiveBonus += 35;
                passiveNotes.push("🩹 Cure Impediments (+35 XP)");
            } else if (currentClass === "Druid") {
                passiveBonus += 50;
                passiveNotes.push("🌿 Nature Balance (+50 XP)");
            } else if (currentClass === "Moth Mage") {
                passiveBonus += 75;
                passiveNotes.push("🦋 Arcane Epiphany (+75 XP)");
            } else if (currentClass === "Scissorpaw") {
                passiveBonus += 40;
                passiveNotes.push("✂️ Obstacle Cut (+40 XP)");
            } else if (currentClass === "Dashing Fencer") {
                passiveBonus += 50;
                passiveNotes.push("🤺 Blocker Parry (+50 XP)");
            } else if (currentClass === "Fox Musketeer") {
                passiveBonus += 60;
                passiveNotes.push("🦊 Fencer Blocker Slice (+60 XP)");
            }
        }
        const updateLength = doneText.length + todoText.length;
        if (updateLength > 100) {
            if (currentClass === "Beast Tamer") {
                passiveBonus += 25;
                passiveNotes.push("🐾 Pack Tactics Detailed Update (+25 XP)");
            } else if (currentClass === "Druid") {
                passiveBonus += 20;
                passiveNotes.push("🌿 Nature Scholar Detailed Update (+20 XP)");
            } else if (currentClass === "Beast Huntress") {
                passiveBonus += 45;
                passiveNotes.push("🏹 Relentless Tracker Detailed Update (+45 XP)");
            } else if (currentClass === "Moth Mage") {
                passiveBonus += 40;
                passiveNotes.push("🦋 Arcane Report Detailed Update (+40 XP)");
            }
        }
        let critThreshold = 0;
        if (currentClass === "Gobbo") critThreshold = 0.20;
        else if (currentClass === "Angel Gobbo") critThreshold = 0.35;
        else if (currentClass === "Angel") critThreshold = 0.50;
        else if (currentClass === "Scissorpaw") critThreshold = 0.15;
        else if (currentClass === "Dashing Fencer") critThreshold = 0.22;
        else if (currentClass === "Fox Musketeer") critThreshold = 0.30;

        if (critThreshold > 0 && Math.random() < critThreshold) {
            isCrit = true;
            passiveNotes.push(`${CLASS_REGISTRY[currentClass]?.icon} CRITICAL HIT! (2.0x Double XP)`);
        }

        let totalGained = baseXP + streakBonus + passiveBonus;

        if (currentClass === "Moth Mage") {
            totalGained = Math.floor(totalGained * 1.25);
            passiveNotes.push("🦋 Arcane Boost (+25% Total XP)");
        }

        if (isCrit) {
            totalGained *= 2;
        }
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
        const { error } = await supabase
            .from("users")
            .update({
                xp: newXP,
                level: newLevel,
                streak: newStreak,
                max_streak: newMaxStreak,
                last_submission_date: todayStr,
            })
            .eq("id", user.id);

        if (error) {
            Logger.error(`Failed to update gamification stats for user ${user.id}:`, error);
        }

        return {
            xpGained: totalGained,
            baseXP,
            streakBonus,
            passiveBonus,
            isCrit,
            oldLevel: currentLevel,
            newLevel,
            leveledUp,
            newStreak,
            oldClass: currentClass,
            availableEvolutions,
            passiveNotes,
        };
    },
    async changeUserClass(user: User, newClass: string): Promise<boolean> {
        const classDef = CLASS_REGISTRY[newClass];
        if (!classDef) {
            throw new Error(`Invalid class: ${newClass}`);
        }

        const isBaseClass = classDef.tier === 1;
        const updatePayload: Record<string, any> = { character_class: newClass };
        if (isBaseClass) {
            updatePayload.class_chosen_at_level = user.level ?? 1;
        }

        const { error } = await supabase
            .from("users")
            .update(updatePayload)
            .eq("id", user.id);

        if (error) {
            Logger.error(`Failed to change class for user ${user.id}:`, error);
            return false;
        }
        return true;
    },
    async syncUserRole(guild: Guild, member: GuildMember, characterClass: string): Promise<void> {
        try {
            const classDef = CLASS_REGISTRY[characterClass];
            if (!classDef) return;

            const roleName = `${classDef.icon} ${classDef.name}`;

            let role = guild.roles.cache.find(r => r.name === roleName || r.name === classDef.name);
            if (!role) {
                role = await guild.roles.create({
                    name: roleName,
                    reason: `BOMB Gamification auto-role for ${classDef.name} class`,
                });
            }

            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
            }

            for (const [_, existingRole] of member.roles.cache) {
                if (existingRole.id !== role.id) {
                    for (const cName of Object.keys(CLASS_REGISTRY)) {
                        const cDef = CLASS_REGISTRY[cName]!;
                        if (existingRole.name === `${cDef.icon} ${cDef.name}` || existingRole.name === cDef.name) {
                            await member.roles.remove(existingRole).catch(() => {});
                        }
                    }
                }
            }
        } catch (err) {
            Logger.warn(`Could not sync Discord role for member ${member.id}: ${String(err)}`);
        }
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
                    .setDescription(def.passiveInfo.substring(0, 100))
                    .setValue(def.name)
            );
        }
    }

    for (const cName of baseClasses) {
        const def = CLASS_REGISTRY[cName];
        if (def) {
            const isCurrent = cName === currentClass;
            const desc = isCurrent ? `[Classe Atual] ${def.passiveInfo}` : `[Trocar p/ Estágio 1] ${def.passiveInfo}`;
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${def.icon} ${def.name} (Base)` + (isCurrent ? " ★" : ""))
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
