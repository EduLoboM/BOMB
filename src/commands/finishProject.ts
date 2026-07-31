import { ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { errorMsg } from "../utils/theme.js";

export const finishProject: Command = {
    name: "finish_project",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord.") });
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return void await interaction.reply({ content: errorMsg("Apenas administradores do servidor podem finalizar a expedição.") });

        const project = await projectService.getProjectByGuild(interaction.guildId, interaction.options.getString("project")?.trim() || undefined);
        if (!project) return void await interaction.reply({ content: errorMsg("Nenhuma guilda foi encontrada para finalizar neste servidor.") });

        const modal = new ModalBuilder().setCustomId(`finish_project_modal_${project.id}`).setTitle(`🏆 Concluir: ${project.name.substring(0, 25)}`).addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Descrição épica das conquistas da guilda").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Ex: Derrotamos o dragão do deadline! / Sistema completo...")),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(new TextInputBuilder().setCustomId("icon").setLabel("Emoji/Ícone do troféu (Opcional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Ex: 💣, 🚀, 👑, 🏆 (Padrão: 🏆)"))
        );

        await interaction.showModal(modal);
    }
};
