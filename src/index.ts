import "dotenv/config";
import { Logger } from "./logger.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { startScheduler } from "./scheduler/standupScheduler.js";
import { handleInteraction } from "./handlers/interactionHandler.js";

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
    startScheduler(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
    await handleInteraction(interaction);
});

client.login(token).catch((error: unknown) => {
    Logger.error("Failed to connect the bot", error);
    process.exitCode = 1;
});