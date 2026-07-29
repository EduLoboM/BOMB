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
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
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
                content: errorMsg("Formato de horário inválido! Use o formato 24h: `HH:MM` (ex: `10:00`, `14:30`, `09:15`)."),
            });
            return;
        }
        const periodMinutes = dateUtils.parsePeriodToMinutes(periodInput);
        if (periodMinutes === null || periodMinutes <= 0) {
            await interaction.editReply({
                content: errorMsg("Formato de período inválido! Use formatos como `30m`, `2h`, `1h30m`, ou apenas minutos (ex: `120`). Deve ser maior que 0."),
            });
            return;
        }
        try {
            new Intl.DateTimeFormat("en-US", { timeZone: timezoneInput });
        } catch (e) {
            await interaction.editReply({
                content: errorMsg(`Timezone inválida: \`${timezoneInput}\`. Use nomes IANA padrão (ex: \`America/Sao_Paulo\`) ou offsets UTC (ex: \`-3\`, \`+05:30\`).`),
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
                content: errorMsg(`Dia(s) inválido(s): \`${invalidDays.join(", ")}\`. Use abreviações: \`mon,tue,wed,thu,fri,sat,sun\`.`),
            });
            return;
        }

        if (normalizedDays.length === 0) {
            await interaction.editReply({
                content: errorMsg("Forneça pelo menos um dia válido."),
            });
            return;
        }

        normalizedDays.sort((a, b) => validDays.indexOf(a) - validDays.indexOf(b));
        const weekdaysStr = normalizedDays.join(",");

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("Nenhuma guilda existe neste servidor. Crie uma primeiro usando `/create_project`."),
            });
            return;
        }

        await projectService.updateProjectSchedule(project.id, `${time}:00`, weekdaysStr, periodMinutes, timezoneInput);

        const embed = buildEmbed({
            title: `🔮  Ritual Diário Configurado!`,
            description: [
                HEADERS.config,
                "",
                `${ICONS.diamond} O ritual diário da guilda **${project.name}** foi encantado com sucesso!`,
                "",
                `├─ ${kvPair("⏰ Horário", codeBox(time))}`,
                `├─ ${kvPair("📅 Dias", codeBox(weekdaysStr.toUpperCase()))}`,
                `├─ ${kvPair("⏱️ Janela", codeBox(`${periodInput} (${periodMinutes} min)`))}`,
                `└─ ${kvPair("🌍 Timezone", codeBox(timezoneInput))}`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
