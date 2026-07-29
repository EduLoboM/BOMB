import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import {
    COLORS, ICONS,
    buildEmbed, errorMsg
} from "../utils/theme.js";

export const setupChannel: Command = {
    name: "setup_channel",

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await interaction.reply({
                content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.options.getChannel("channel", true);

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) {
            await interaction.editReply({
                content: errorMsg("Nenhuma guilda existe neste servidor. Crie uma primeiro usando `/create_project`."),
            });
            return;
        }

        await projectService.updateProjectChannel(project.id, channel.id);

        const embed = buildEmbed({
            title: `📡  Canal de Comunicação Definido!`,
            description: [
                `${ICONS.channel} O canal de relatórios da guilda **${project.name}** foi definido para <#${channel.id}>`,
                "",
                `${ICONS.arrow} Os diários de expedição serão postados lá a partir de agora.`,
                `${ICONS.sparkle} *Que as aventuras comecem!*`,
            ].join("\n"),
            color: COLORS.success,
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
