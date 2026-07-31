import { ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { MASCOT_REGISTRY } from "../services/mascotService.js";

export const setupMascotCommand: Command = {
    name: "setup_mascot",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: "❌ Este comando só pode ser executado dentro de um servidor.", flags: 64 });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.reply({ content: "❌ Nenhum projeto registrado neste servidor. Use `/create_project` primeiro.", flags: 64 });

        const selectMenu = new StringSelectMenuBuilder().setCustomId("select_mascot_type").setPlaceholder("Selecione um Mascote da Guilda...").addOptions(
            Object.values(MASCOT_REGISTRY).map(def => new StringSelectMenuOptionBuilder().setLabel(`${def.icon} ${def.name}`).setValue(def.type).setDescription(def.auraInfo))
        );

        await interaction.reply({ content: "🚗 **Selecione o Mascote da Guilda para o seu servidor:**", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)], flags: 64 });
    }
};
