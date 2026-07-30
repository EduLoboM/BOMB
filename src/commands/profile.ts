import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { CardService } from "../services/cardService.js";
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../services/gamificationService.js";
import type { HexadProfile } from "../types.js";
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
        const hexadProfileKey = user.hexad_profile as HexadProfile | undefined | null;
        const hexadBadge = classDef ? `\`[${classDef.hexadIcon} ${classDef.hexadTitle}]\`` : "";

        const currentLevelXP = gamificationService.getXPForLevel(currentLevel);
        const nextLevelXP = gamificationService.getXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = currentXP - currentLevelXP;
        const xpNeededForNext = nextLevelXP - currentLevelXP;

        const availableEvolutions = gamificationService.getAvailableEvolutions(characterClass, currentLevel, classChosenAtLevel);
        const embed = buildEmbed({
            title: `${classDef.icon}  Ficha do Aventureiro  —  ${user.display_name}`,
            description: [
                `> ${classDef.icon} **${classDef.name}** · Estágio ${classDef.tier} ${hexadBadge}`,
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

        const [badges, cards] = await Promise.all([
            userService.getUserBadges(user.id),
            CardService.getUserCards(user.id)
        ]);

        if (badges.length > 0) {
            embed.addFields({
                name: `🏆  Troféus da Guilda (${badges.length})`,
                value: badges.map(b => `${b.icon || "🏆"} **${b.project_name}** — *"${b.description}"*`).join("\n"),
                inline: false
            });
        }

        if (cards.length > 0) {
            const cardSummary = cards.map(c => {
                const shinyBadge = c.is_shiny ? " ✨" : "";
                return `🎴 **${c.card_name}** (${c.rarity}${shinyBadge})`;
            }).slice(0, 10).join("\n");
            embed.addFields({
                name: `🎴  Álbum de Figurinhas Colecionáveis (${cards.length})`,
                value: cards.length > 10 ? `${cardSummary}\n*...e mais ${cards.length - 10} card(s)*` : cardSummary,
                inline: false
            });
        } else {
            embed.addFields({
                name: `🎴  Álbum de Figurinhas Colecionáveis (0)`,
                value: `*Nenhuma figurinha coletada ainda. Envie suas dailies para ganhar pacotes de cards!*`,
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
