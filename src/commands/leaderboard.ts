import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { CLASS_REGISTRY } from "../services/gamificationService.js";
import { COLORS, ICONS, buildEmbed } from "../utils/theme.js";

export const leaderboardCommand: Command = {
    name: "leaderboard",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`, flags: MessageFlags.Ephemeral });
        await interaction.deferReply();

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.editReply({ content: `${ICONS.error} Nenhuma guilda encontrada neste servidor.` });

        const members = await userService.getLeaderboard(project.id, 10);
        if (members.length === 0) return void await interaction.editReply({ content: `${ICONS.pending} Nenhum aventureiro encontrado na guilda.` });

        const rankEmojis = ["👑", "⚔️", "🛡️"], rankTitles = ["Campeão da Guilda", "Vice-Campeão", "Cavaleiro Honorário"];
        const rankingLines = members.map((user, i) => {
            const userClass = user.character_class || "Gobbo";
            const classIcon = CLASS_REGISTRY[userClass]?.icon || "🍀";
            const streakText = user.streak ? `| 🔥 ${user.streak}d` : "";
            const titleText = rankTitles[i] ? `  *— ${rankTitles[i]}*` : "";

            return `${rankEmojis[i] || "📜"} **<@${user.discord_id}>** *(${user.display_name})*${titleText}\n    └─ ${classIcon} **${userClass}** · Lv **${user.level ?? 1}** · \`${user.xp ?? 0} XP\` ${streakText}`;
        });

        const embed = buildEmbed({
            title: `🏆  ${project.name}  —  Hall dos Campeões`,
            description: ["Os aventureiros mais valentes da guilda, ranqueados por XP e façanhas:", "", rankingLines.join("\n\n")].join("\n"),
            color: COLORS.gold,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
