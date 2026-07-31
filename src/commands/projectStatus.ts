import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { dateUtils } from "../utils/dateUtils.js";
import { COLORS, ICONS, HEADERS, DIVIDERS, buildEmbed, statusBadge, memberLine, sprintTimeline, kvPair, codeBox, ansiBlock, ansiProgressBar } from "../utils/theme.js";
import { t, Language, SUPPORTED_LANGUAGES } from "../i18n/index.js";

export const projectStatus: Command = {
    name: "project_status",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: `${ICONS.error} Este comando só pode ser executado dentro de um servidor do Discord.`, flags: MessageFlags.Ephemeral });
        await interaction.deferReply();

        const projectName = interaction.options.getString("project")?.trim();
        const project = await projectService.getProjectByGuild(interaction.guildId, projectName || undefined);

        if (!project) {
            const allProjects = await projectService.getProjectsByGuild(interaction.guildId);
            const msg = allProjects.length > 0
                ? `${ICONS.error} Guilda não encontrada. Guildas disponíveis neste servidor:\n` + allProjects.map(p => `• **${p.name}** (Código: \`${p.access_code}\`)`).join("\n")
                : `${ICONS.error} Nenhuma guilda foi fundada neste servidor ainda. Peça a um líder para usar \`/create_project\`.`;
            return void await interaction.editReply({ content: msg });
        }

        const [members, sprints] = await Promise.all([userService.getProjectMembers(project.id), sprintService.getSprints(project.id)]);
        let sprintStatusText = `${ICONS.pending} Nenhuma expedição configurada`, sprintColor: number = COLORS.neutral;

        if (sprints.length > 0) {
            const todayStr = dateUtils.getLocalDateString();
            const currentSprint = sprints.find(s => s.start_date <= todayStr && todayStr <= s.end_date);

            if (currentSprint) {
                const daysLeft = Math.ceil((new Date(currentSprint.end_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                const totalDays = Math.ceil((new Date(currentSprint.end_date).getTime() - new Date(currentSprint.start_date).getTime()) / (1000 * 60 * 60 * 24));
                sprintStatusText = [`${statusBadge("Ativa", true)}  **Expedição #${currentSprint.number}**`, "", sprintTimeline(currentSprint.start_date, currentSprint.end_date, daysLeft), "", ansiBlock([ansiProgressBar(totalDays - daysLeft, totalDays)])].join("\n");
                sprintColor = COLORS.sprint;
            } else {
                const upcoming = sprints.filter(s => s.start_date > todayStr).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
                if (upcoming) {
                    const daysUntil = Math.ceil((new Date(upcoming.start_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                    sprintStatusText = [`${statusBadge("Em breve", false)}  **Expedição #${upcoming.number}**`, "", sprintTimeline(upcoming.start_date, upcoming.end_date), `    ${ICONS.clock} Começa em **${daysUntil}** dia(s)`].join("\n");
                } else {
                    const latest = sprints[0]!;
                    sprintStatusText = [`${statusBadge("Encerrada", false)}  **Expedição #${latest.number}**`, "", sprintTimeline(latest.start_date, latest.end_date), `    ${ICONS.arrow} Use \`/setup_sprint\` para iniciar uma nova expedição.`].join("\n");
                }
            }
        }

        const lang: Language = (project.language as Language) || "pt";
        const langInfo = SUPPORTED_LANGUAGES[lang];
        const memberListText = members.length > 0
            ? members.map((m, i) => memberLine(`<@${m.discord_id}>`, m.display_name, i === members.length - 1)).join("\n")
            : `${ICONS.pending} Nenhum aventureiro registrado. Diga à sua equipe para entrar usando \`/join_project\`.`;

        const embed = buildEmbed({ title: `🏰  ${project.name}  —  Painel da Guilda`, description: HEADERS.bomb, color: sprintColor });
        embed.addFields(
            { name: `🗝️  ${t("project.accessCode", lang)}`, value: `\`\`\`\n  ${project.access_code}\n\`\`\``, inline: true },
            { name: "📡  Canal de Comunicação", value: project.channel_id ? `<#${project.channel_id}>` : "N/A", inline: true },
            { name: "\u200B", value: DIVIDERS.quest, inline: false },
            {
                name: "⏰  Ritual Diário", value: [
                    `├─ ${kvPair("⏰ Horário", codeBox(project.daily_time ? project.daily_time.substring(0, 5) : "N/A"))}`,
                    `├─ ${kvPair("📅 Dias", codeBox(project.weekdays ? project.weekdays.toUpperCase() : "N/A"))}`,
                    `├─ ${kvPair("⏱️ Janela", codeBox(project.daily_period ? `${project.daily_period} minuto(s)` : "N/A"))}`,
                    `├─ ${kvPair("🌍 Timezone", codeBox(project.timezone || "UTC"))}`,
                    `└─ ${kvPair("🌐 Idioma / Language", codeBox(`${langInfo.flag} ${langInfo.name}`))}`,
                ].join("\n"), inline: false
            },
            { name: "🏁  Expedição Ativa", value: sprintStatusText, inline: false },
            {
                name: "🔄  Expedição Perpétua", value: [
                    `├─ ${kvPair("Auto-Repeat", project.sprint_repeat ? statusBadge("Ativado", true) : statusBadge("Desativado", false))}`,
                    `└─ ${kvPair("Duração Padrão", codeBox(project.sprint_duration ? `${project.sprint_duration} dia(s)` : "N/A"))}`,
                ].join("\n"), inline: false
            },
            { name: "\u200B", value: DIVIDERS.quest, inline: false },
            { name: `🛡️  Companheiros de Guilda (${members.length})`, value: memberListText, inline: false }
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
