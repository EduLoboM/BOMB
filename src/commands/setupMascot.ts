import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { MascotService, MASCOT_REGISTRY } from "../services/mascotService.js";
import type { MascotType } from "../types.js";

export const setupMascotCommand: Command = {
    name: "setup_mascot",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({ content: "❌ Este comando só pode ser executado dentro de um servidor.", flags: 64 });
            return;
        }

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.reply({ content: "❌ Nenhum projeto registrado neste servidor. Use `/create_project` primeiro.", flags: 64 });
            return;
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("select_mascot_type")
            .setPlaceholder("Selecione um Mascote da Guilda...");

        Object.values(MASCOT_REGISTRY).forEach((def) => {
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${def.icon} ${def.name}`)
                    .setValue(def.type)
                    .setDescription(def.auraInfo)
            );
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({
            content: "🚗 **Selecione o Mascote da Guilda para o seu servidor:**",
            components: [row],
            flags: 64
        });
    }
};
