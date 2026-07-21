import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { dateUtils } from "../utils/dateUtils.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, errorMsg, kvPair, codeBox
} from "../utils/theme.js";

export const setupDaily: Command = {
    name: "setup_daily",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("This command can only be run inside a Discord server."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const time = interaction.options.getString("time", true).trim();
        const days = interaction.options.getString("days", true).trim();
        const periodInput = interaction.options.getString("period", true).trim().toLowerCase();
        let timezoneInput = interaction.options.getString("timezone")?.trim() || "UTC";
        timezoneInput = dateUtils.normalizeTimezone(timezoneInput);

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            await interaction.editReply({
                content: errorMsg("Invalid time format! Please use 24-hour format: `HH:MM` (e.g. `10:00`, `14:30`, `09:15`)."),
            });
            return;
        }

        // Parse period
        const periodMinutes = dateUtils.parsePeriodToMinutes(periodInput);
        if (periodMinutes === null || periodMinutes <= 0) {
            await interaction.editReply({
                content: errorMsg("Invalid period format! Please use formats like `30m`, `2h`, `1h30m`, or just minutes (e.g. `120`). Must be greater than 0."),
            });
            return;
        }

        // Validate timezone
        try {
            new Intl.DateTimeFormat("en-US", { timeZone: timezoneInput });
        } catch (e) {
            await interaction.editReply({
                content: errorMsg(`Invalid timezone: \`${timezoneInput}\`. Please use standard IANA timezone names (e.g. \`America/Sao_Paulo\`) or UTC offsets (e.g. \`-3\`, \`+05:30\`).`),
            });
            return;
        }

        const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        const inputDays = days.split(",").map(d => d.trim().toLowerCase());
        const normalizedDays: string[] = [];
        const dayMapping: Record<string, string> = {
            monday: "mon", mon: "mon",
            tuesday: "tue", tue: "tue",
            wednesday: "wed", wed: "wed",
            thursday: "thu", thu: "thu",
            friday: "fri", fri: "fri",
            saturday: "sat", sat: "sat",
            sunday: "sun", sun: "sun"
        };

        const invalidDays: string[] = [];
        for (const d of inputDays) {
            const mapped = dayMapping[d];
            if (mapped) {
                if (!normalizedDays.includes(mapped)) {
                    normalizedDays.push(mapped);
                }
            } else {
                invalidDays.push(d);
            }
        }

        if (invalidDays.length > 0) {
            await interaction.editReply({
                content: errorMsg(`Invalid day(s) provided: \`${invalidDays.join(", ")}\`. Please use abbreviations: \`mon,tue,wed,thu,fri,sat,sun\`.`),
            });
            return;
        }

        if (normalizedDays.length === 0) {
            await interaction.editReply({
                content: errorMsg("Please provide at least one valid day."),
            });
            return;
        }

        normalizedDays.sort((a, b) => validDays.indexOf(a) - validDays.indexOf(b));
        const weekdaysStr = normalizedDays.join(",");

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("No project exists for this server. Please create one first using `/create_project`."),
            });
            return;
        }

        await projectService.updateProjectSchedule(project.id, `${time}:00`, weekdaysStr, periodMinutes, timezoneInput);

        const embed = buildEmbed({
            title: `${ICONS.success}  Schedule Updated`,
            description: [
                HEADERS.config,
                "",
                `${ICONS.diamond} Standup schedule for **${project.name}** has been configured.`,
                "",
                `├─ ${kvPair(ICONS.clock + " Time", codeBox(time))}`,
                `├─ ${kvPair(ICONS.calendar + " Days", codeBox(weekdaysStr.toUpperCase()))}`,
                `├─ ${kvPair(ICONS.timer + " Window", codeBox(`${periodInput} (${periodMinutes} min)`))}`,
                `└─ ${kvPair(ICONS.timezone + " Timezone", codeBox(timezoneInput))}`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
