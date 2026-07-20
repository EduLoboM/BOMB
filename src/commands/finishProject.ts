import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import {
    COLORS, ICONS, HEADERS, DIVIDERS,
    buildEmbed, errorMsg, treeItem
} from "../utils/theme.js";

export const finishProject: Command = {
    name: "finish_project",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("No project exists for this server. There is nothing to finish."),
            });
            return;
        }

        const embed = buildEmbed({
            title: `${ICONS.warning}  Finish Project: ${project.name}`,
            description: [
                HEADERS.danger,
                "",
                "Are you absolutely sure you want to finish and delete this project?",
                "",
                `${ICONS.cross} **This action is PERMANENT and will delete:**`,
                "",
                treeItem(`The project **${project.name}**`),
                treeItem("All registered team members"),
                treeItem("All configured sprints"),
                treeItem("All daily standup submissions", true),
                "",
                DIVIDERS.dotted,
                "",
                `${ICONS.arrow} Click the button below to confirm.`,
            ].join("\n"),
            color: COLORS.danger,
        });

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_finish_project_${project.id}`)
            .setLabel("  Confirm Finish & Delete Project")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }
};
