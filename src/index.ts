import "dotenv/config";

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Events,
    GatewayIntentBits,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`A variável ${name} não foi definida no arquivo .env.`);
    }

    return value;
}

const token = getRequiredEnv("DISCORD_TOKEN");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Bot conectado como ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // Comando /painel
        if (
            interaction.isChatInputCommand() &&
            interaction.commandName === "painel"
        ) {
            const openModalButton = new ButtonBuilder()
                .setCustomId("open_registration_modal")
                .setLabel("Abrir formulário")
                .setEmoji("📝")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                openModalButton,
            );

            await interaction.reply({
                content: [
                    "## Painel do bot",
                    "Use o botão abaixo para abrir o formulário.",
                ].join("\n"),
                components: [row],
            });

            return;
        }

        // Clique no botão
        if (
            interaction.isButton() &&
            interaction.customId === "open_registration_modal"
        ) {
            const modal = new ModalBuilder()
                .setCustomId("registration_modal")
                .setTitle("Cadastro");

            const nameInput = new TextInputBuilder()
                .setCustomId("name")
                .setLabel("Qual é o seu nome?")
                .setPlaceholder("Digite seu nome")
                .setStyle(TextInputStyle.Short)
                .setMinLength(2)
                .setMaxLength(50)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("description")
                .setLabel("Conte um pouco sobre você")
                .setPlaceholder("Escreva uma breve descrição")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(500)
                .setRequired(false);

            const nameRow =
                new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

            const descriptionRow =
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    descriptionInput,
                );

            modal.addComponents(nameRow, descriptionRow);

            await interaction.showModal(modal);
            return;
        }

        // Envio do modal
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "registration_modal"
        ) {
            const name = interaction.fields.getTextInputValue("name");
            const description =
                interaction.fields.getTextInputValue("description") ||
                "Nenhuma descrição informada.";

            await interaction.reply({
                content: [
                    "### Cadastro recebido",
                    `**Nome:** ${name}`,
                    `**Descrição:** ${description}`,
                ].join("\n"),
                flags: MessageFlags.Ephemeral,
                allowedMentions: {
                    parse: [],
                },
            });
        }
    } catch (error: unknown) {
        console.error("Erro ao processar interação:", error);

        if (!interaction.isRepliable()) {
            return;
        }

        const errorResponse = {
            content: "Ocorreu um erro ao executar essa ação.",
            flags: MessageFlags.Ephemeral,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorResponse).catch(console.error);
        } else {
            await interaction.reply(errorResponse).catch(console.error);
        }
    }
});

client.login(token).catch((error: unknown) => {
    console.error("Não foi possível conectar o bot:", error);
    process.exitCode = 1;
});