import {
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    PermissionFlagsBits
} from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { ICONS, errorMsg } from "../utils/theme.js";

export const finishProject: Command = {
    name: "finish_project",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
            });
            return;
        }

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: errorMsg("Apenas administradores do servidor podem finalizar a expedição."),
            });
            return;
        }

        const projectName = interaction.options.getString("project")?.trim();
        const project = await projectService.getProjectByGuild(interaction.guildId, projectName || undefined);

        if (!project) {
            await interaction.reply({
                content: errorMsg("Nenhuma guilda foi encontrada para finalizar neste servidor."),
            });
            return;
        }

        // Show Modal to prompt for project completion description & badge emoji
        const modal = new ModalBuilder()
            .setCustomId(`finish_project_modal_${project.id}`)
            .setTitle(`🏆 Concluir: ${project.name.substring(0, 25)}`);

        const descriptionInput = new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Descrição épica das conquistas da guilda")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Ex: Derrotamos o dragão do deadline! / Sistema completo...");

        const iconInput = new TextInputBuilder()
            .setCustomId("icon")
            .setLabel("Emoji/Ícone do troféu (Opcional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder("Ex: 💣, 🚀, 👑, 🏆 (Padrão: 🏆)");

        const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(descriptionInput);
        const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(iconInput);

        modal.addComponents(row1, row2);

        await interaction.showModal(modal);
    }
};
