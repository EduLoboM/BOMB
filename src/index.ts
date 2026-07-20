import "dotenv/config";
import { Logger } from "./logger.js";

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Events,
    GatewayIntentBits,
    InteractionReplyOptions,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`The variable ${name} was not defined in the .env file.`);
    }

    return value;
}

const token = getRequiredEnv("DISCORD_TOKEN");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    Logger.success(`Bot connected successfully as \x1b[1m${readyClient.user.tag}\x1b[0m`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (
            interaction.isChatInputCommand() &&
            interaction.commandName === "panel"
        ) {
            Logger.info(`Command "/panel" executed by \x1b[1m${interaction.user.tag}\x1b[0m (ID: ${interaction.user.id})`);
            const openModalButton = new ButtonBuilder()
                .setCustomId("open_registration_modal")
                .setLabel("Open form")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                openModalButton,
            );

            await interaction.reply({
                content: [
                    "## Bot panel",
                    "Use the button below to open the form.",
                ].join("\n"),
                components: [row],
            });

            return;
        }
        if (
            interaction.isButton() &&
            interaction.customId === "open_registration_modal"
        ) {
            Logger.info(`Button "open_registration_modal" clicked by \x1b[1m${interaction.user.tag}\x1b[0m`);
            const modal = new ModalBuilder()
                .setCustomId("registration_modal")
                .setTitle("Registration");

            const nameInput = new TextInputBuilder()
                .setCustomId("name")
                .setLabel("What is your name?")
                .setPlaceholder("Type your name")
                .setStyle(TextInputStyle.Short)
                .setMinLength(2)
                .setMaxLength(50)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId("description")
                .setLabel("Tell us a bit about yourself")
                .setPlaceholder("Write a brief description")
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
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "registration_modal"
        ) {
            const name = interaction.fields.getTextInputValue("name");
            const description =
                interaction.fields.getTextInputValue("description") ||
                "No description provided.";

            Logger.info(`Modal "registration_modal" submitted by \x1b[1m${interaction.user.tag}\x1b[0m (Name: "${name}")`);

            await interaction.reply({
                content: [
                    "### Registration received",
                    `**Name:** ${name}`,
                    `**Description:** ${description}`,
                ].join("\n"),
                flags: MessageFlags.Ephemeral,
                allowedMentions: {
                    parse: [],
                },
            });
        }
    } catch (error: unknown) {
        Logger.error(`Error processing action for user \x1b[1m${interaction.user.tag}\x1b[0m`, error);

        if (!interaction.isRepliable()) {
            return;
        }

        const errorResponse: InteractionReplyOptions = {
            content: "Error while processing this action.",
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
    Logger.error("Failed to connect the bot", error);
    process.exitCode = 1;
});