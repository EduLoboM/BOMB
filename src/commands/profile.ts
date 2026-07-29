import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../services/gamificationService.js";
import {
    COLORS, ICONS, DIVIDERS,
    buildEmbed, progressBar, kvPair, codeBox,
    getClassColor, ansiBlock, ansiProgressBar
} from "../utils/theme.js";

export const profileCommand: Command = {
    name: "profile",

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const targetDiscordUser = interaction.options.getUser("user") || interaction.user;
        const displayName = targetDiscordUser.displayName || targetDiscordUser.username;

        const { user } = await userService.getOrCreateUser(targetDiscordUser.id, displayName);

        const currentXP = user.xp ?? 0;
        const currentLevel = user.level ?? 1;
        const currentStreak = user.streak ?? 0;
        const maxStreak = user.max_streak ?? 0;
        const characterClass = user.character_class || "Gobbo";
        const classChosenAtLevel = user.class_chosen_at_level ?? 1;

        const classDef = CLASS_REGISTRY[characterClass] || CLASS_REGISTRY["Gobbo"]!;

        // Level XP math
        const currentLevelXP = gamificationService.getXPForLevel(currentLevel);
        const nextLevelXP = gamificationService.getXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = currentXP - currentLevelXP;
        const xpNeededForNext = nextLevelXP - currentLevelXP;

        const availableEvolutions = gamificationService.getAvailableEvolutions(characterClass, currentLevel, classChosenAtLevel);

        // ─── Build Character Sheet Embed ─────────────────
        const embed = buildEmbed({
            title: `${classDef.icon}  Ficha do Aventureiro  —  ${user.display_name}`,
            description: [
                `> ${classDef.icon} **${classDef.name}** · Estágio ${classDef.tier}`,
                `> *${classDef.description}*`,
            ].join("\n"),
            color: getClassColor(characterClass),
            author: {
                name: `${classDef.name} · Nível ${currentLevel}`,
                iconURL: targetDiscordUser.displayAvatarURL(),
            },
        });

        embed.addFields(
            {
                name: `✨  Nível & Experiência`,
                value: [
                    `├─ ${kvPair("Nível", codeBox(currentLevel.toString()))}`,
                    `├─ ${kvPair("XP Total", codeBox(`${currentXP} XP`))}`,
                    `└─ ${kvPair("Progresso", codeBox(`${xpInCurrentLevel}/${xpNeededForNext} XP`))}`,
                    ansiBlock([ansiProgressBar(xpInCurrentLevel, xpNeededForNext)]),
                ].join("\n"),
                inline: false
            },
            {
                name: `🔥  Chama do Compromisso (Streak)`,
                value: [
                    `├─ ${kvPair("Sequência Atual", codeBox(`🔥 ${currentStreak} dia(s)`))}`,
                    `└─ ${kvPair("Maior Sequência", codeBox(`🏆 ${maxStreak} dia(s)`))}`,
                ].join("\n"),
                inline: false
            },
            {
                name: `⚡  Poder Passivo`,
                value: `> *${classDef.passiveInfo}*`,
                inline: false
            }
        );

        const badges = await userService.getUserBadges(user.id);
        if (badges.length > 0) {
            embed.addFields({
                name: `🏆  Troféus da Guilda (${badges.length})`,
                value: badges.map(b => `${b.icon || "🏆"} **${b.project_name}** — *"${b.description}"*`).join("\n"),
                inline: false
            });
        }

        if (availableEvolutions.length > 0) {
            embed.addFields({
                name: `⚡  EVOLUÇÃO DESBLOQUEADA!`,
                value: [
                    `✨ Sua classe pode evoluir! Selecione no menu abaixo:`,
                    ...availableEvolutions.map(e => {
                        const evoDef = CLASS_REGISTRY[e];
                        return evoDef ? `${ICONS.arrow} ${evoDef.icon} **${evoDef.name}** — *${evoDef.passiveInfo}*` : `${ICONS.arrow} **${e}**`;
                    }),
                ].join("\n"),
                inline: false
            });
        }

        const isSelf = targetDiscordUser.id === interaction.user.id;
        const components = isSelf ? [createClassSelectRow(user)] : [];

        await interaction.editReply({ embeds: [embed], components });
    }
};
