import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";

export const setupSprint: Command = {
    name: "setup_sprint",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: "❌ This command can only be run inside a Discord server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const startInput = interaction.options.getString("start", true).trim().toLowerCase();
        const daysInput = interaction.options.getInteger("days", true);

        if (daysInput <= 0) {
            await interaction.editReply({
                content: "❌ Sprint duration must be a positive number of days.",
            });
            return;
        }

        const startDate = dateUtils.parseStartDate(startInput);

        if (isNaN(startDate.getTime())) {
            await interaction.editReply({
                content: "❌ Invalid start date format! Use `YYYY-MM-DD` or `today`.",
            });
            return;
        }

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysInput - 1);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: "❌ No project exists for this server. Please create one first using `/create_project`.",
            });
            return;
        }

        const latestSprintNumber = await sprintService.getLatestSprintNumber(project.id);
        const nextSprintNumber = latestSprintNumber + 1;

        await sprintService.createSprint(
            project.id,
            nextSprintNumber,
            dateUtils.getLocalDateString(startDate),
            dateUtils.getLocalDateString(endDate)
        );

        await interaction.editReply({
            content: `✅ **Sprint #${nextSprintNumber}** has been defined for project **${project.name}**!\n` +
                `📅 **Start Date:** ${dateUtils.getLocalDateString(startDate)}\n` +
                `🏁 **End Date:** ${dateUtils.getLocalDateString(endDate)}\n` +
                `⏱️ **Duration:** ${daysInput} day(s)`,
        });
    }
};
