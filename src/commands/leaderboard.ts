import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { CLASS_REGISTRY } from "../services/gamificationService.js";
import { COLORS, ICONS, buildEmbed } from "../utils/theme.js";

export const leaderboardCommand: Command = {
    name: "leaderboard",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: `${ICONS.error} Nenhuma guilda encontrada neste servidor.`,
            });
            return;
        }

        const members = await userService.getLeaderboard(project.id, 10);

        if (members.length === 0) {
            await interaction.editReply({
                content: `${ICONS.pending} Nenhum aventureiro encontrado na guilda.`,
            });
            return;
        }

        const rankEmojis = ["👑", "⚔️", "🛡️", "📜", "📜", "📜", "📜", "📜", "📜", "📜"];
        const rankTitles = ["Campeão da Guilda", "Vice-Campeão", "Cavaleiro Honorário"];

        const rankingLines = members.map((user, index) => {
            const rankEmoji = rankEmojis[index] || "📜";
            const rankTitle = rankTitles[index];
            const userClass = user.character_class || "Gobbo";
            const classIcon = CLASS_REGISTRY[userClass]?.icon || "🍀";
            const level = user.level ?? 1;
            const xp = user.xp ?? 0;
            const streak = user.streak ?? 0;

            const streakText = streak > 0 ? `| 🔥 ${streak}d` : "";
            const titleText = rankTitle ? `  *— ${rankTitle}*` : "";

            return `${rankEmoji} **<@${user.discord_id}>** *(${user.display_name})*${titleText}\n` +
                   `    └─ ${classIcon} **${userClass}** · Lv **${level}** · \`${xp} XP\` ${streakText}`;
        });

        const embed = buildEmbed({
            title: `🏆  ${project.name}  —  Hall dos Campeões`,
            description: [
                `Os aventureiros mais valentes da guilda, ranqueados por XP e façanhas:`,
                "",
                rankingLines.join("\n\n"),
            ].join("\n"),
            color: COLORS.gold,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
