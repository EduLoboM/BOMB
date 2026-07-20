import "dotenv/config";
import { Logger } from "./logger.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { startScheduler, stopScheduler } from "./scheduler/standupScheduler.js";
import { handleInteraction } from "./handlers/interactionHandler.js";
import { getRequiredEnv } from "./env.js";

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

// ─── Graceful Shutdown ────────────────────────────────
function shutdown() {
    Logger.info("Shutting down gracefully...");
    stopScheduler();
    client.destroy();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

client.login(token).catch((error: unknown) => {
    Logger.error("Failed to connect the bot", error);
    process.exitCode = 1;
});