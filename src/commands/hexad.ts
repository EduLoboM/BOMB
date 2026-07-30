import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
} from "discord.js";
import { Command } from "./commandInterface.js";
import { userService } from "../services/userService.js";
import { HEXAD_REGISTRY, CLASS_REGISTRY } from "../services/gamificationService.js";
import type { HexadProfile } from "../types.js";
import {
    COLORS, ICONS, HEADERS, DIVIDERS,
    buildEmbed, ansiBlock, ansiColor, ANSI
} from "../utils/theme.js";

export const hexadCommand: Command = {
    name: "hexad",

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const currentProfile = user.hexad_profile as HexadProfile | undefined | null;
        const currentHexadInfo = currentProfile ? HEXAD_REGISTRY[currentProfile] : null;

        const embed = buildEmbed({
            title: `🧪  Ciência do Engajamento  —  Modelo Hexad de Marczewski`,
            description: [
                HEADERS.bomb,
                "",
                `🔬 **Gamificação Baseada em Ciência Motivacional (SDT)**`,
                `*Descubra seu perfil motivacional dominante e destrave o potencial máximo da sua classe RPG.*`,
                "",
                currentHexadInfo
                    ? ansiBlock([
                        `${ansiColor("SEU PERFIL ATUAL: " + currentHexadInfo.icon + " " + currentHexadInfo.name, ANSI.GREEN)}`,
                        `${ansiColor("MOTIVAÇÃO CHAVE: " + currentHexadInfo.sdtDriver, ANSI.CYAN)}`,
                    ])
                    : ansiBlock([
                        `${ansiColor("STATUS: Perfil ainda não diagnosticado!", ANSI.YELLOW)}`,
                        `${ansiColor("Faça o teste de 30 segundos abaixo para descobrir seu perfil dominante.", ANSI.WHITE)}`
                    ]),
            ].join("\n"),
            color: COLORS.primary,
        });

        let profilesText = "";
        for (const key of Object.keys(HEXAD_REGISTRY) as HexadProfile[]) {
            const h = HEXAD_REGISTRY[key];
            const isUserMatch = currentProfile === key;
            const marker = isUserMatch ? " ⭐ **(SEU PERFIL)**" : "";
            const recommendedClassDef = CLASS_REGISTRY[h.recommendedClass];
            const classBadge = recommendedClassDef ? `\`[${recommendedClassDef.icon} ${recommendedClassDef.name}]\`` : "";

            profilesText += [
                `${h.icon} **${h.name}** ${classBadge}${marker}`,
                `└─ 💡 *Driver:* **${h.sdtDriver}** | ${h.description}`,
                ""
            ].join("\n");
        }

        embed.addFields({
            name: `🧬  Os 6 Archetypes Motivacionais do Hexad`,
            value: profilesText
        });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("start_hexad_quiz_btn")
                .setLabel(currentProfile ? "Refazer Teste de Perfil Hexad" : "Fazer Teste de Perfil Hexad")
                .setEmoji("🧪")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("hexad_recommended_class_btn")
                .setLabel("Ver Minha Classe Recomendada")
                .setEmoji("🛡️")
                .setStyle(ButtonStyle.Success)
                .setDisabled(!currentProfile)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};
