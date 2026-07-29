import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import {
    COLORS, ICONS, HEADERS, DIVIDERS,
    buildEmbed, progressBar, statusBadge,
    memberLine, sprintTimeline, kvPair, codeBox,
    sectionTitle, ansiBlock, ansiColor, ansiProgressBar, ANSI
} from "../utils/theme.js";

export const projectStatus: Command = {
    name: "project_status",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const projectName = interaction.options.getString("project")?.trim();
        const project = await projectService.getProjectByGuild(interaction.guildId, projectName || undefined);

        if (!project) {
            const allProjects = await projectService.getProjectsByGuild(interaction.guildId);
            if (allProjects.length > 0) {
                await interaction.editReply({
                    content: `${ICONS.error} Guilda não encontrada. Guildas disponíveis neste servidor:\n` +
                             allProjects.map(p => `• **${p.name}** (Código: \`${p.access_code}\`)`).join("\n"),
                });
                return;
            }
            await interaction.editReply({
                content: `${ICONS.error} Nenhuma guilda foi fundada neste servidor ainda. Peça a um líder para usar \`/create_project\`.`,
            });
            return;
        }

        const [members, sprints] = await Promise.all([
            userService.getProjectMembers(project.id),
            sprintService.getSprints(project.id),
        ]);

        // ─── Sprint Status ────────────────────────────────
        let sprintStatusText = `${ICONS.pending} Nenhuma expedição configurada`;
        let sprintColor: number = COLORS.neutral;

        if (sprints.length > 0) {
            const todayStr = dateUtils.getLocalDateString();
            const currentSprint = sprints.find(s => s.start_date <= todayStr && todayStr <= s.end_date);

            if (currentSprint) {
                const daysLeft = Math.ceil(
                    (new Date(currentSprint.end_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
                );
                const totalDays = Math.ceil(
                    (new Date(currentSprint.end_date).getTime() - new Date(currentSprint.start_date).getTime()) / (1000 * 60 * 60 * 24)
                );
                const elapsed = totalDays - daysLeft;

                sprintStatusText = [
                    `${statusBadge("Ativa", true)}  **Expedição #${currentSprint.number}**`,
                    "",
                    sprintTimeline(currentSprint.start_date, currentSprint.end_date, daysLeft),
                    "",
                    ansiBlock([ansiProgressBar(elapsed, totalDays)]),
                ].join("\n");
                sprintColor = COLORS.sprint;
            } else {
                const upcomingSprint = sprints
                    .filter(s => s.start_date > todayStr)
                    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

                if (upcomingSprint) {
                    const daysUntil = Math.ceil(
                        (new Date(upcomingSprint.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    sprintStatusText = [
                        `${statusBadge("Em breve", false)}  **Expedição #${upcomingSprint.number}**`,
                        "",
                        sprintTimeline(upcomingSprint.start_date, upcomingSprint.end_date),
                        `    ${ICONS.clock} Começa em **${daysUntil}** dia(s)`,
                    ].join("\n");
                } else {
                    const latestSprint = sprints[0]!;
                    sprintStatusText = [
                        `${statusBadge("Encerrada", false)}  **Expedição #${latestSprint.number}**`,
                        "",
                        sprintTimeline(latestSprint.start_date, latestSprint.end_date),
                        `    ${ICONS.arrow} Use \`/setup_sprint\` para iniciar uma nova expedição.`,
                    ].join("\n");
                }
            }
        }

        // ─── Schedule Info ────────────────────────────────
        const dailyTimeText = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
        const weekdaysText = project.weekdays ? project.weekdays.toUpperCase() : "N/A";
        const dailyPeriodText = project.daily_period ? `${project.daily_period} minuto(s)` : "N/A";
        const timezoneText = project.timezone || "UTC";
        const channelText = project.channel_id ? `<#${project.channel_id}>` : "N/A";

        const sprintRepeatText = project.sprint_repeat ? statusBadge("Ativado", true) : statusBadge("Desativado", false);
        const sprintDurationText = project.sprint_duration ? `${project.sprint_duration} dia(s)` : "N/A";

        // ─── Members ──────────────────────────────────────
        const memberCount = members.length;
        const memberListText = members.length > 0
            ? members.map((m, i) => memberLine(`<@${m.discord_id}>`, m.display_name, i === members.length - 1)).join("\n")
            : `${ICONS.pending} Nenhum aventureiro registrado. Diga à sua equipe para entrar usando \`/join_project\`.`;

        // ─── Build Embed ──────────────────────────────────
        const embed = buildEmbed({
            title: `🏰  ${project.name}  —  Painel da Guilda`,
            description: HEADERS.bomb,
            color: sprintColor,
        });

        embed.addFields(
            {
                name: `🗝️  Pergaminho de Acesso`,
                value: `\`\`\`\n  ${project.access_code}\n\`\`\``,
                inline: true
            },
            {
                name: `📡  Canal de Comunicação`,
                value: channelText,
                inline: true
            },
            {
                name: "\u200B",
                value: DIVIDERS.quest,
                inline: false
            },
            {
                name: `⏰  Ritual Diário`,
                value: [
                    `├─ ${kvPair("⏰ Horário", codeBox(dailyTimeText))}`,
                    `├─ ${kvPair("📅 Dias", codeBox(weekdaysText))}`,
                    `├─ ${kvPair("⏱️ Janela", codeBox(dailyPeriodText))}`,
                    `└─ ${kvPair("🌍 Timezone", codeBox(timezoneText))}`,
                ].join("\n"),
                inline: false
            },
            {
                name: `🏁  Expedição Ativa`,
                value: sprintStatusText,
                inline: false
            },
            {
                name: `🔄  Expedição Perpétua`,
                value: [
                    `├─ ${kvPair("Auto-Repeat", sprintRepeatText)}`,
                    `└─ ${kvPair("Duração Padrão", codeBox(sprintDurationText))}`,
                ].join("\n"),
                inline: false
            },
            {
                name: "\u200B",
                value: DIVIDERS.quest,
                inline: false
            },
            {
                name: `🛡️  Companheiros de Guilda (${memberCount})`,
                value: memberListText,
                inline: false
            }
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
