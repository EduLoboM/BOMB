import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { sprintService } from "../services/sprintService.js";
import { planningService } from "../services/planningService.js";
import { COLORS, ICONS, HEADERS, buildEmbed, errorMsg, successMsg, kvPair, codeBox } from "../utils/theme.js";
import { TaskStatus, EventStatus } from "../types.js";

export const reviewCommand: Command = {
    name: "review",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."), flags: MessageFlags.Ephemeral });
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.editReply({ content: errorMsg("Nenhum projeto registrado neste servidor.") });

        const activeSprint = await sprintService.getActiveSprint(project.id);
        const sprintId = activeSprint?.id, sprintNum = activeSprint ? activeSprint.number : "Geral";

        if (subcommand === "sprint") {
            const summary = await planningService.getSprintReviewSummary(project.id, sprintId);
            const taskLines = summary.tasks.map(t => `• **${t.title}** (${t.points} pts) — ${t.assignee ? `<@${t.assignee.discord_id}>` : "Ninguém"} [${t.status === "completed" ? "✅ Concluída" : t.status === "cancelled" ? "❌ Cancelada" : "⏳ Pendente"}]`);
            const eventLines = summary.events.map(e => `• **${e.title}** (\`${e.event_type}\`) [${e.status === "completed" ? "✅ Realizado" : "📅 Agendado"}]`);

            const embed = buildEmbed({
                title: `🔍  Revisão da Expedição #${sprintNum}`,
                description: [
                    HEADERS.sprint, "", `📊 **Resumo da Revisão de Entregas & Rituais** — **${project.name}**`, "",
                    `📈 **Taxa de Conclusão de Tarefas:** \`${summary.taskCompletionRate}%\` (${summary.completedTasks}/${summary.totalTasks} tarefas, ${summary.completedPoints}/${summary.totalPoints} pts)`,
                    `📈 **Taxa de Realização de Eventos:** \`${summary.eventCompletionRate}%\` (${summary.completedEvents}/${summary.totalEvents} eventos)`, "",
                    "📋 **Status das Tarefas:**", ...(taskLines.length ? taskLines : ["*Nenhuma tarefa registrada.*"]), "",
                    "📅 **Status dos Eventos:**", ...(eventLines.length ? eventLines : ["*Nenhum evento registrado.*"]), "",
                    `${ICONS.sparkle} *Use \`/review task\` ou \`/review event\` para atualizar itens, ou \`/review complete\` para finalizar a revisão e conceder XP!*`
                ].join("\n"),
                color: COLORS.sprint
            });
            return void await interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === "task") {
            const updated = await planningService.updateTaskStatus(interaction.options.getString("task_id", true).trim(), interaction.options.getString("status", true) as TaskStatus, interaction.options.getString("notes") || undefined);
            if (!updated) return void await interaction.editReply({ content: errorMsg("Tarefa não encontrada com o ID fornecido.") });
            return void await interaction.editReply({ content: successMsg(`Tarefa **"${updated.title}"** atualizada para status \`${updated.status}\` com sucesso! 📌`) });
        }

        if (subcommand === "event") {
            const updated = await planningService.updateEventStatus(interaction.options.getString("event_id", true).trim(), interaction.options.getString("status", true) as EventStatus, interaction.options.getString("notes") || undefined);
            if (!updated) return void await interaction.editReply({ content: errorMsg("Evento não encontrado com o ID fornecido.") });
            return void await interaction.editReply({ content: successMsg(`Evento **"${updated.title}"** atualizado para status \`${updated.status}\` com sucesso! 📅`) });
        }

        if (subcommand === "complete") {
            const result = await planningService.concludeSprintReview(project.id, sprintId, interaction.options.getString("summary") || undefined);
            const xpLines = result.awardedUsers.length > 0
                ? result.awardedUsers.map(u => `⭐ **${u.name}:** +${u.xp} XP acumulados`)
                : ["*Nenhum XP de tarefa atribuído nesta revisão.*"];

            const embed = buildEmbed({
                title: "🎉  Revisão de Expedição Concluída!",
                description: [
                    HEADERS.victory, "", `A revisão da Expedição #${sprintNum} foi finalizada com sucesso!`, "",
                    `├─ ${kvPair("Tarefas Concluídas", codeBox(`${result.summary.completedTasks}/${result.summary.totalTasks} (${result.summary.taskCompletionRate}%)`))}`,
                    `└─ ${kvPair("Pontos de História", codeBox(`${result.summary.completedPoints}/${result.summary.totalPoints} pts`))}`, "",
                    `📜 **Notas da Revisão:** *"${result.summaryNotes}"*`, "",
                    "🌟 **XP Concedido aos Responsáveis pelas Entregas:**", ...xpLines, "",
                    `${ICONS.sparkle} *Parabéns à guilda pelo esforço e pelas conquistas do sprint!*`
                ].join("\n"),
                color: COLORS.legendary
            });
            return void await interaction.editReply({ embeds: [embed] });
        }
    }
};
