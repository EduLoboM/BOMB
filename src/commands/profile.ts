import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { CardService } from "../services/cardService.js";
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from "../services/gamificationService.js";
import { COLORS, ICONS, buildEmbed, kvPair, codeBox, getClassColor, ansiBlock, ansiProgressBar } from "../utils/theme.js";

export const profileCommand: Command = {
    name: "profile",
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const target = interaction.options.getUser("user") || interaction.user;
        const { user } = await userService.getOrCreateUser(target.id, target.displayName || target.username);

        const currentXP = user.xp ?? 0, currentLevel = user.level ?? 1, characterClass = user.character_class || "Gobbo";
        const classDef = CLASS_REGISTRY[characterClass] || CLASS_REGISTRY["Gobbo"]!;
        const hexadBadge = classDef ? `\`[${classDef.hexadIcon} ${classDef.hexadTitle}]\`` : "";

        const currentLevelXP = gamificationService.getXPForLevel(currentLevel);
        const nextLevelXP = gamificationService.getXPForLevel(currentLevel + 1);
        const xpInCurrent = currentXP - currentLevelXP, xpNeeded = nextLevelXP - currentLevelXP;

        const availableEvolutions = gamificationService.getAvailableEvolutions(characterClass, currentLevel, user.class_chosen_at_level ?? 1);
        const embed = buildEmbed({
            title: `${classDef.icon}  Ficha do Aventureiro  —  ${user.display_name}`,
            description: `> ${classDef.icon} **${classDef.name}** · Estágio ${classDef.tier} ${hexadBadge}\n> *${classDef.description}*`,
            color: getClassColor(characterClass),
            author: { name: `${classDef.name} · Nível ${currentLevel}`, iconURL: target.displayAvatarURL() },
        });

        embed.addFields(
            {
                name: "✨  Nível & Experiência",
                value: [`├─ ${kvPair("Nível", codeBox(currentLevel.toString()))}`, `├─ ${kvPair("XP Total", codeBox(`${currentXP} XP`))}`, `└─ ${kvPair("Progresso", codeBox(`${xpInCurrent}/${xpNeeded} XP`))}`, ansiBlock([ansiProgressBar(xpInCurrent, xpNeeded)])].join("\n"),
                inline: false
            },
            {
                name: "🔥  Chama do Compromisso (Streak)",
                value: [`├─ ${kvPair("Sequência Atual", codeBox(`🔥 ${user.streak ?? 0} dia(s)`))}`, `└─ ${kvPair("Maior Sequência", codeBox(`🏆 ${user.max_streak ?? 0} dia(s)`))}`].join("\n"),
                inline: false
            },
            { name: "⚡  Poder Passivo", value: `> *${classDef.passiveInfo}*`, inline: false }
        );

        const [badges, cards] = await Promise.all([userService.getUserBadges(user.id), CardService.getUserCards(user.id)]);

        if (badges.length > 0) {
            embed.addFields({ name: `🏆  Troféus da Guilda (${badges.length})`, value: badges.map(b => `${b.icon || "🏆"} **${b.project_name}** — *"${b.description}"*`).join("\n"), inline: false });
        }

        if (cards.length > 0) {
            const summary = cards.map(c => `🎴 **${c.card_name}** (${c.rarity}${c.is_shiny ? " ✨" : ""})`).slice(0, 10).join("\n");
            embed.addFields({ name: `🎴  Álbum de Figurinhas Colecionáveis (${cards.length})`, value: cards.length > 10 ? `${summary}\n*...e mais ${cards.length - 10} card(s)*` : summary, inline: false });
        } else {
            embed.addFields({ name: "🎴  Álbum de Figurinhas Colecionáveis (0)", value: "*Nenhuma figurinha coletada ainda. Envie suas dailies para ganhar pacotes de cards!*", inline: false });
        }

        if (availableEvolutions.length > 0) {
            embed.addFields({
                name: "⚡  EVOLUÇÃO DESBLOQUEADA!",
                value: ["✨ Sua classe pode evoluir! Selecione no menu abaixo:", ...availableEvolutions.map(e => CLASS_REGISTRY[e] ? `${ICONS.arrow} ${CLASS_REGISTRY[e]!.icon} **${CLASS_REGISTRY[e]!.name}** — *${CLASS_REGISTRY[e]!.passiveInfo}*` : `${ICONS.arrow} **${e}**`)].join("\n"),
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed], components: target.id === interaction.user.id ? [createClassSelectRow(user)] : [] });
    }
};
