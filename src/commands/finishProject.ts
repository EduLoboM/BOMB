import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";

export const finishProject: Command = {
    name: "finish_project",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project exists for this server. There is nothing to finish.",
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Finish Project: ${project.name}`)
            .setDescription(
                "Are you absolutely sure you want to finish and delete this project?\n\n" +
                "💥 **WARNING:** This action is **permanent** and will delete:\n" +
                `• The project **${project.name}**\n` +
                "• All registered team members\n" +
                "• All configured sprints\n" +
                "• All daily standup submissions\n\n" +
                "Please click the button below to confirm."
            )
            .setColor(0xef4444)
            .setTimestamp();

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_finish_project_${project.id}`)
            .setLabel("Confirm Finish & Delete Project")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️");

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }
};
