import { Client, TextChannel } from 'discord.js';
import { supabase } from '../supabase.js';
import { fetchGuildTableData, renderGuildTableEmbed } from './guildTableRenderService.js';
import { Logger } from '../logger.js';

interface PendingUpdate {
  projectId: string;
  guildId: string;
  channelId: string;
  timer: NodeJS.Timeout;
}

class GuildTableQueueService {
  private pendingUpdates: Map<string, PendingUpdate> = new Map();
  private updateLocks: Set<string> = new Set();
  private DEBOUNCE_MS = 1500;

  public enqueueUpdate(client: Client, projectId: string, guildId: string, channelId: string): void {
    const existing = this.pendingUpdates.get(projectId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    const timer = setTimeout(() => {
      this.pendingUpdates.delete(projectId);
      this.processUpdate(client, projectId, guildId, channelId);
    }, this.DEBOUNCE_MS);

    this.pendingUpdates.set(projectId, { projectId, guildId, channelId, timer });
  }

  private async processUpdate(client: Client, projectId: string, guildId: string, channelId: string): Promise<void> {
    if (this.updateLocks.has(projectId)) {
      this.enqueueUpdate(client, projectId, guildId, channelId);
      return;
    }

    this.updateLocks.add(projectId);

    try {
      const data = await fetchGuildTableData(projectId);
      if (!data) return;

      const channel = await client.channels.fetch(channelId).catch(() => null) as TextChannel | null;
      if (!channel || !channel.isTextBased()) return;

      const rendered = renderGuildTableEmbed(data);

      const { data: dbEntry } = await supabase
        .from('guild_tables')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      let messageId = dbEntry?.message_id;

      if (messageId) {
        const existingMsg = await channel.messages.fetch(messageId).catch(() => null);
        if (existingMsg) {
          await existingMsg.edit(rendered);
          Logger.info(`Updated Guild Table message for project ${projectId}`);
          return;
        }
      }

      const newMsg = await channel.send(rendered);
      await supabase.from('guild_tables').upsert({
        project_id: projectId,
        guild_id: guildId,
        channel_id: channelId,
        message_id: newMsg.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id' });

      Logger.info(`Created new Guild Table message for project ${projectId}`);
    } catch (err: any) {
      Logger.error(`Error updating Guild Table for project ${projectId}:`, err);
      if (err?.code === 429 || err?.status === 429) {
        const retryAfter = (err?.retryAfter || 5) * 1000;
        Logger.warn(`Rate limit hit updating Guild Table. Retrying in ${retryAfter}ms`);
        setTimeout(() => {
          this.enqueueUpdate(client, projectId, guildId, channelId);
        }, retryAfter);
      }
    } finally {
      this.updateLocks.delete(projectId);
    }
  }
}

export const guildTableQueue = new GuildTableQueueService();
