import { Interaction, MessageFlags } from "discord.js";
import { Logger } from "../logger.js";
import { commands } from "../commands/index.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { dailyService } from "../services/dailyService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { reportUtils } from "../utils/reportUtils.js";

export async function handleInteraction(interaction: Interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (command) {
                Logger.info(`Command "/${interaction.commandName}" executed by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);
                await command.execute(interaction, interaction.client);
            }
            return;
        }

        if (interaction.isButton() && interaction.customId === "submit_daily_btn") {
            Logger.info(`Button "submit_daily_btn" clicked by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            if (!interaction.guildId) {
                await interaction.reply({
                    content: "❌ This button can only be clicked inside a Discord server.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const project = await projectService.getProjectByGuild(interaction.guildId);
            if (!project) {
                await interaction.reply({
                    content: "❌ No project exists for this server.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const member = await userService.getMember(interaction.user.id, project.id);
            if (!member) {
                await interaction.reply({
                    content: "❌ You are not a member of this project. Join using `/join_project` with the invite code.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const isOpen = reportUtils.isDailyOpen(project);
            if (!isOpen) {
                const dailyTime = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
                const period = project.daily_period ? `${project.daily_period}m` : "N/A";
                await interaction.reply({
                    content: `❌ The daily standup submission period is closed. It is only open for ${period} starting at ${dailyTime}.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await reportUtils.showDailyModal(interaction);
            return;
        }

        if (interaction.isButton() && interaction.customId.startsWith("confirm_finish_project_")) {
            Logger.info(`Button "confirm_finish_project_" clicked by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            if (!interaction.guildId) {
                await interaction.reply({
                    content: "❌ This button can only be clicked inside a Discord server.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (!interaction.memberPermissions?.has("Administrator")) {
                await interaction.reply({
                    content: "❌ Only server administrators can confirm finishing the project.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await interaction.deferUpdate();

            const projectId = interaction.customId.replace("confirm_finish_project_", "");
            await projectService.deleteProject(projectId);

            await interaction.editReply({
                content: "✅ The project and all associated data (members, sprints, dailies) have been successfully deleted.",
                embeds: [],
                components: []
            });
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === "daily_modal") {
            Logger.info(`Modal "daily_modal" submitted by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);

            if (!interaction.guildId) {
                await interaction.reply({
                    content: "❌ This modal can only be submitted inside a Discord server.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const done = interaction.fields.getTextInputValue("done").trim();
            const todo = interaction.fields.getTextInputValue("todo").trim();
            const blockers = interaction.fields.getTextInputValue("blockers").trim() || "None";

            const project = await projectService.getProjectByGuild(interaction.guildId);
            if (!project) {
                await interaction.editReply({
                    content: "❌ Project not found.",
                });
                return;
            }

            const member = await userService.getMember(interaction.user.id, project.id);
            if (!member) {
                await interaction.editReply({
                    content: "❌ Member not found.",
                });
                return;
            }

            const todayStr = dateUtils.getLocalDateString();
            const { start, end } = dateUtils.getLocalDayBoundaries(todayStr);

            const existingDaily = await dailyService.getDailyForUserToday(member.id, project.id, start, end);

            if (existingDaily) {
                await dailyService.updateDaily(existingDaily.id, done, todo, blockers);
            } else {
                await dailyService.createDaily(member.id, project.id, done, todo, blockers);
            }

            let responseText = "✅ Your daily standup has been submitted successfully!";
            if (!project.channel_id) {
                responseText += "\n⚠️ *Note: No daily report channel has been configured for this project yet. Ask a project leader to run `/setup_channel` to enable the standup dashboard.*";
            }

            await interaction.editReply({ content: responseText });

            if (project.channel_id) {
                await reportUtils.sendOrUpdateDailyReport(interaction.client, project, todayStr);
            }
            return;
        }
    } catch (error: unknown) {
        Logger.error(`Error processing action for user \x1b[1m${interaction.user.tag}\x1b[0m`, error);

        if (!interaction.isRepliable()) {
            return;
        }

        const errorMessage = error && typeof error === "object" && "message" in error && typeof error.message === "string"
            ? `❌ Error: ${error.message}`
            : "❌ Error while processing this action.";

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: errorMessage }).catch(console.error);
        } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    }
}
