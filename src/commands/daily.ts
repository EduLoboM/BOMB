import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "./commandInterface.js";
import { projectService } from "../services/projectService.js";
import { userService } from "../services/userService.js";
import { reportUtils } from "../utils/reportUtils.js";
import { errorMsg } from "../utils/theme.js";

export const daily: Command = {
    name: "daily",
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return void await interaction.reply({ content: errorMsg("Este comando só pode ser executado dentro de um servidor do Discord."), flags: MessageFlags.Ephemeral });

        const project = await projectService.getProjectByGuild(interaction.guildId);
        if (!project) return void await interaction.reply({ content: errorMsg("Nenhuma guilda existe neste servidor. Crie uma primeiro usando `/create_project`."), flags: MessageFlags.Ephemeral });

        if (!(await userService.getMember(interaction.user.id, project.id))) {
            return void await interaction.reply({ content: errorMsg("Você não é um aventureiro desta guilda. Entre usando `/join_project` com o código de acesso."), flags: MessageFlags.Ephemeral });
        }

        if (!reportUtils.isDailyOpen(project)) {
            const time = project.daily_time ? project.daily_time.substring(0, 5) : "N/A";
            const period = project.daily_period ? `${project.daily_period}m` : "N/A";
            return void await interaction.reply({ content: errorMsg(`O portal de submissão está fechado! ⏰ Ele só abre por ${period} a partir das ${time}.`), flags: MessageFlags.Ephemeral });
        }

        await reportUtils.showDailyModal(interaction);
    }
};
