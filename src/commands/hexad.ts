import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { HEXAD_REGISTRY, CLASS_REGISTRY } from "../services/gamificationService.js";
import type { HexadProfile } from "../types.js";
import { COLORS, HEADERS, buildEmbed, ansiBlock, ansiColor, ANSI } from "../utils/theme.js";

export const hexadCommand: Command = {
    name: "hexad",
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        const currentProfile = user.hexad_profile as HexadProfile | undefined | null;
        const currentHexadInfo = currentProfile ? HEXAD_REGISTRY[currentProfile] : null;

        const embed = buildEmbed({
            title: "🧪  Ciência do Engajamento  —  Modelo Hexad de Marczewski",
            description: [
                HEADERS.bomb, "", "🔬 **Gamificação Baseada em Ciência Motivacional (SDT)**",
                "*Descubra seu perfil motivacional dominante e destrave o potencial máximo da sua classe RPG.*\n",
                currentHexadInfo
                    ? ansiBlock([ansiColor(`SEU PERFIL ATUAL: ${currentHexadInfo.icon} ${currentHexadInfo.name}`, ANSI.GREEN), ansiColor(`MOTIVAÇÃO CHAVE: ${currentHexadInfo.sdtDriver}`, ANSI.CYAN)])
                    : ansiBlock([ansiColor("STATUS: Perfil ainda não diagnosticado!", ANSI.YELLOW), ansiColor("Faça o teste de 30 segundos abaixo para descobrir seu perfil dominante.", ANSI.WHITE)])
            ].join("\n"),
            color: COLORS.primary,
        });

        const profilesText = (Object.keys(HEXAD_REGISTRY) as HexadProfile[]).map(key => {
            const h = HEXAD_REGISTRY[key];
            const recommendedClassDef = CLASS_REGISTRY[h.recommendedClass];
            const classBadge = recommendedClassDef ? `\`[${recommendedClassDef.icon} ${recommendedClassDef.name}]\`` : "";
            return `${h.icon} **${h.name}** ${classBadge}${currentProfile === key ? " ⭐ **(SEU PERFIL)**" : ""}\n└─ 💡 *Driver:* **${h.sdtDriver}** | ${h.description}\n`;
        }).join("\n");

        embed.addFields({ name: "🧬  Os 6 Archetypes Motivacionais do Hexad", value: profilesText });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("start_hexad_quiz_btn").setLabel(currentProfile ? "Refazer Teste de Perfil Hexad" : "Fazer Teste de Perfil Hexad").setEmoji("🧪").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("hexad_recommended_class_btn").setLabel("Ver Minha Classe Recomendada").setEmoji("🛡️").setStyle(ButtonStyle.Success).setDisabled(!currentProfile)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
