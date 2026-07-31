import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { COLORS, ICONS, HEADERS, buildEmbed, errorMsg, kvPair, codeBox, sprintTimeline, statusBadge } from "../utils/theme.js";

export const setupSprint: Command = {
    name: "setup_sprint",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."), flags: MessageFlags.Ephemeral });
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const startInput = interaction.options.getString("start", true).trim().toLowerCase();
        const daysInput = interaction.options.getInteger("days", true);
        const repeatInput = interaction.options.getBoolean("repeat", true);

        if (daysInput <= 0) return void await interaction.editReply({ content: errorMsg("A duração da expedição deve ser um número positivo de dias.") });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.editReply({ content: errorMsg("Nenhuma guilda existe neste servidor. Crie uma primeiro usando `/create_project`.") });

        let startDateStr = "";
        if (startInput === "today") {
            startDateStr = dateUtils.getDateTimeInTimezone(new Date(), project.timezone || "UTC").dateString;
        } else {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startInput)) return void await interaction.editReply({ content: errorMsg("Formato de data inválido! Use `YYYY-MM-DD` (ex: `2026-07-20`) ou `today`.") });
            const [y, m, d] = startInput.split("-").map(Number) as [number, number, number];
            if (isNaN(new Date(Date.UTC(y, m - 1, d)).getTime())) return void await interaction.editReply({ content: errorMsg("Data inválida! Verifique se é uma data válida do calendário.") });
            startDateStr = startInput;
        }

        const endDateStr = dateUtils.addDaysToDateString(startDateStr, daysInput - 1);
        const nextSprintNumber = (await sprintService.getLatestSprintNumber(project.id)) + 1;

        await sprintService.createSprint(project.id, nextSprintNumber, startDateStr, endDateStr);
        await projectService.updateProjectSprintSettings(project.id, repeatInput, daysInput);

        const embed = buildEmbed({
            title: "🏁  Nova Expedição Iniciada!",
            description: [
                HEADERS.sprint, "", `🏁 **Expedição #${nextSprintNumber}** para a guilda **${project.name}**`, "",
                sprintTimeline(startDateStr, endDateStr, daysInput), "",
                `├─ ${kvPair("Duração", codeBox(`${daysInput} dia(s)`))}`,
                `└─ ${kvPair("Auto-Repeat", statusBadge(repeatInput ? "Ativado" : "Desativado", repeatInput))}`, "",
                `${ICONS.sparkle} *Que a jornada comece!*`
            ].join("\n"),
            color: COLORS.sprint,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
