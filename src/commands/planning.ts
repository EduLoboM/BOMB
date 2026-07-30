import {
    ChatInputCommandInteraction,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { sprintService } from "../services/sprintService.js";
import { planningService } from "../services/planningService.js";
import {
    COLORS, ICONS, HEADERS,
    buildEmbed, errorMsg, successMsg, statusBadge, codeBox
} from "../utils/theme.js";
import { EventType } from "../types.js";

export function renderPlanningBoard(project: any, sprintNumber: number | string, tasks: any[], events: any[], helpers: any[]) {
    const taskLines = tasks.length === 0
        ? ["*Nenhuma tarefa planejada ainda neste sprint.*"]
        : tasks.map(t => {
            const assigneeStr = t.assignee ? `<@${t.assignee.discord_id}>` : "⚠️ *Sem Responsável*";
            const pointsStr = `[${t.points || 1} pts]`;
            const statusIcon = t.status === "completed" ? "✅" : t.status === "in_progress" ? "⏳" : "📌";
            return `${statusIcon} **${t.title}** ${pointsStr}\n   └─ Responsável: ${assigneeStr} | Status: \`${t.status}\``;
        });

    const eventLines = events.length === 0
        ? ["*Nenhum evento agendado neste sprint.*"]
        : events.map(e => {
            const typeIcons: Record<string, string> = {
                meeting: "👥",
                review: "📊",
                retrospective: "💡",
                demo: "🚀",
                planning: "🗺️"
            };
            const icon = typeIcons[e.event_type] || "📅";
            const dateFormatted = new Date(e.event_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
            return `${icon} **${e.title}** (\`${e.event_type}\`)\n   └─ Data: \`${dateFormatted}\` | Status: \`${e.status}\``;
        });

    const helperLines = helpers.length === 0
        ? ["*Nenhum integrante com a mão estendida no momento.*"]
        : helpers.map(h => `🖐️ <@${h.helper.discord_id}> (${h.helper.display_name}) — *"${h.note}"*`);

    const description = [
        HEADERS.sprint,
        "",
        `🎯 **Painel de Planejamento & Expedição** — **${project.name}** (Sprint #${sprintNumber})`,
        "",
        `📋 **Tarefas Planejadas (${tasks.length}):**`,
        ...taskLines,
        "",
        `📅 **Eventos & Rituais Agendados (${events.length}):**`,
        ...eventLines,
        "",
        `🤝 **Mão Amiga (Membros Disponíveis para Ajuda - ${helpers.length}):**`,
        ...helperLines,
        "",
        `${ICONS.sparkle} *Aloque tarefas, organize rituais e colabore discretamente com a guilda!*`
    ].join("\n");

    const embed = buildEmbed({
        title: `🗺️  Planejamento da Expedição`,
        description,
        color: COLORS.primary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("planning_add_task_btn")
            .setLabel("Criar Tarefa")
            .setEmoji("📌")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("planning_offer_help_btn")
            .setLabel("Terminei & Ofereço Ajuda")
            .setEmoji("🖐️")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("planning_request_help_btn")
            .setLabel("Solicitar Suporte Discreto")
            .setEmoji("🆘")
            .setStyle(ButtonStyle.Secondary)
    );

    return { embed, row };
}

export const planningCommand: Command = {
    name: "planning",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({ content: errorMsg("Nenhum projeto registrado neste servidor.") });
            return;
        }

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);
        const activeSprint = await sprintService.getActiveSprint(project.id);
        const sprintId = activeSprint?.id;
        const sprintNum = activeSprint ? activeSprint.number : "Geral";

        if (subcommand === "add_task") {
            const title = interaction.options.getString("title", true).trim();
            const points = interaction.options.getInteger("points") || 1;
            const assigneeOption = interaction.options.getUser("assignee");
            const description = interaction.options.getString("description") || undefined;

            let assigneeId: string | undefined = undefined;
            if (assigneeOption) {
                const { user: assignedUser } = await userService.getOrCreateUser(
                    assigneeOption.id,
                    assigneeOption.displayName || assigneeOption.username
                );
                assigneeId = assignedUser.id;
            }

            const task = await planningService.createTask(
                project.id,
                user.id,
                title,
                description,
                points,
                assigneeId,
                sprintId
            );

            const assigneeMention = assigneeOption ? `<@${assigneeOption.id}>` : "*Ninguém (Disponível)*";
            await interaction.editReply({
                content: successMsg(`Tarefa criada com sucesso! 📌 **${task.title}** (${task.points} pts)\n└─ Responsável: ${assigneeMention}`)
            });
            return;
        }

        if (subcommand === "add_event") {
            const title = interaction.options.getString("title", true).trim();
            const eventType = (interaction.options.getString("event_type", true) as EventType);
            const dateStr = interaction.options.getString("date", true).trim();
            const description = interaction.options.getString("description") || undefined;

            let parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
                parsedDate = new Date();
            }

            const event = await planningService.createEvent(
                project.id,
                user.id,
                title,
                parsedDate.toISOString(),
                eventType,
                description,
                sprintId
            );

            await interaction.editReply({
                content: successMsg(`Evento agendado com sucesso! 📅 **${event.title}** (\`${event.event_type}\`)\n└─ Data: \`${new Date(event.event_date).toLocaleString("pt-BR")}\``)
            });
            return;
        }

        if (subcommand === "offer_help") {
            const note = interaction.options.getString("note") || undefined;
            await planningService.offerDiscreetHelp(project.id, user.id, note);

            await interaction.editReply({
                content: successMsg(`Sua mão amiga foi estendida para a guilda! 🖐️ Membros que precisarem de suporte poderão se conectar com você de forma discreta.`)
            });
            return;
        }

        if (subcommand === "request_help") {
            const helpers = await planningService.getActiveHelpers(project.id);
            const availableHelpers = helpers.filter(h => h.helper_id !== user.id);

            if (availableHelpers.length === 0) {
                await interaction.editReply({
                    content: errorMsg("Nenhum companheiro disponível com a mão estendida no momento. Avise a equipe na daily ou no chat!")
                });
                return;
            }

            const chosenHelper = availableHelpers[Math.floor(Math.random() * availableHelpers.length)]!;
            await planningService.requestDiscreetHelp(chosenHelper.id, user.id);

            await interaction.editReply({
                content: successMsg(`Matching de Suporte Discreto realizado! 🤝\n<@${chosenHelper.helper.discord_id}> (${chosenHelper.helper.display_name}) terminou as tarefas e está disponível para te ajudar! Mande uma DM discreta ou marque no canal.`)
            });
            return;
        }

        if (subcommand === "view") {
            const [tasks, events, helpers] = await Promise.all([
                planningService.getTasksForSprint(project.id, sprintId),
                planningService.getEventsForSprint(project.id, sprintId),
                planningService.getActiveHelpers(project.id)
            ]);

            const { embed, row } = renderPlanningBoard(project, sprintNum, tasks, events, helpers);
            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
        }
    }
};
