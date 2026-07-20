import { ChatInputCommandInteraction, Client } from "discord.js";

export interface Command {
    name: string;
    execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;
}
