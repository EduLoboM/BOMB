import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, errorMsg, kvPair, codeBox,
    sprintTimeline, statusBadge
} from "../utils/theme.js";

export const setupSprint: Command = {
    name: "setup_sprint",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const startInput = interaction.options.getString("start", true).trim().toLowerCase();
        const daysInput = interaction.options.getInteger("days", true);
        const repeatInput = interaction.options.getBoolean("repeat", true);

        if (daysInput <= 0) {
            await interaction.editReply({
                content: errorMsg("Sprint duration must be a positive number of days."),
            });
            return;
        }

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("No project exists for this server. Please create one first using `/create_project`."),
            });
            return;
        }

        let startDateStr = "";
        if (startInput === "today") {
            const timezone = project.timezone || "UTC";
            const tzInfo = dateUtils.getDateTimeInTimezone(new Date(), timezone);
            startDateStr = tzInfo.dateString;
        } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startInput)) {
                await interaction.editReply({
                    content: errorMsg("Invalid start date format! Use `YYYY-MM-DD` (e.g. `2026-07-20`) or `today`."),
                });
                return;
            }
            const [y, m, d] = startInput.split("-").map(Number) as [number, number, number];
            const testDate = new Date(Date.UTC(y, m - 1, d));
            if (isNaN(testDate.getTime())) {
                await interaction.editReply({
                    content: errorMsg("Invalid start date! Please make sure it is a valid calendar date."),
                });
                return;
            }
            startDateStr = startInput;
        }

        const endDateStr = dateUtils.addDaysToDateString(startDateStr, daysInput - 1);

        const latestSprintNumber = await sprintService.getLatestSprintNumber(project.id);
        const nextSprintNumber = latestSprintNumber + 1;

        // Create the initial sprint
        await sprintService.createSprint(
            project.id,
            nextSprintNumber,
            startDateStr,
            endDateStr
        );

        // Update project defaults for repeat and duration
        await projectService.updateProjectSprintSettings(project.id, repeatInput, daysInput);

        const repeatBadge = repeatInput ? statusBadge("Enabled", true) : statusBadge("Disabled", false);

        const embed = buildEmbed({
            title: `${ICONS.success}  Sprint Created`,
            description: [
                HEADERS.sprint,
                "",
                `${ICONS.sprint} **Sprint #${nextSprintNumber}** for **${project.name}**`,
                "",
                sprintTimeline(startDateStr, endDateStr, daysInput),
                "",
                `├─ ${kvPair("Duration", codeBox(`${daysInput} day(s)`))}`,
                `└─ ${kvPair("Auto-Repeat", repeatBadge)}`,
            ].join("\n"),
            color: COLORS.sprint,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
