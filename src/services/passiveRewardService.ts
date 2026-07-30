import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  TextChannel, 
  Client 
} from 'discord.js';
import { supabase } from '../supabase.js';
import { calculateDailyXP } from './gamificationService.js';
import { drawCard } from './cardService.js';
import { guildTableQueue } from './guildTableQueueService.js';
import { Logger } from '../logger.js';

interface DailySubmissionInput {
  client: Client;
  projectId: string;
  guildId: string;
  channelId: string;
  discordUserId: string;
  userDisplayName: string;
  done: string;
  todo: string;
  blockers: string;
}

export async function processDailySubmission(input: DailySubmissionInput) {
  const { client, projectId, guildId, channelId, discordUserId, userDisplayName, done, todo, blockers } = input;

  let { data: dbUser } = await supabase.from('users').select('*').eq('discord_id', discordUserId).maybeSingle();
  if (!dbUser) {
    const { data: newUser } = await supabase.from('users').insert({
      discord_id: discordUserId,
      display_name: userDisplayName,
      xp: 0,
      level: 1,
      streak: 1
    }).select().single();
    dbUser = newUser;
  }

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  const { data: mascot } = await supabase.from('mascots').select('*').eq('project_id', projectId).maybeSingle();

  const now = new Date();
  const isEarlyBird = now.getHours() < 12;
  const xpResult = calculateDailyXP(dbUser, project, mascot, isEarlyBird);
  const earnedXp = xpResult.totalXp;

  const newXp = (dbUser.xp || 0) + earnedXp;
  const newLevel = Math.floor(newXp / 500) + 1;
  const newStreak = (dbUser.streak || 0) + 1;

  await supabase.from('users').update({
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    last_submission_date: now.toISOString().split('T')[0]
  }).eq('id', dbUser.id);

  const drawnCard = drawCard();
  await supabase.from('user_cards').insert({
    user_id: dbUser.id,
    card_id: drawnCard.id,
    card_name: drawnCard.name,
    rarity: drawnCard.rarity,
    is_shiny: drawnCard.isShiny
  });

  const rawPayload = {
    done,
    todo,
    blockers,
    earned_xp: earnedXp,
    xp_breakdown: xpResult,
    drawn_card: drawnCard,
    submitted_at_iso: now.toISOString(),
    client_info: "Discord Bot v14"
  };

  const { data: insertedDaily } = await supabase.from('dailies').insert({
    user_id: dbUser.id,
    project_id: projectId,
    done,
    todo,
    blockers: blockers || null,
    raw_payload: rawPayload,
    discord_user_id: discordUserId,
    discord_guild_id: guildId,
    submitted_at: now.toISOString()
  }).select().single();

  if (blockers && blockers.trim().length > 0 && blockers.toLowerCase() !== 'nenhum') {
    await supabase.from('impediments').insert({
      project_id: projectId,
      user_id: dbUser.id,
      daily_id: insertedDaily?.id || null,
      description: blockers,
      status: 'active',
      raw_payload: { blocker_text: blockers, reported_by_discord_id: discordUserId },
      discord_user_id: discordUserId,
      discord_guild_id: guildId
    });
  }

  const channel = await client.channels.fetch(channelId).catch(() => null) as TextChannel | null;
  if (channel && channel.isTextBased()) {
    const rarityEmoji = drawnCard.rarity === 'Shiny' ? '✨' : (drawnCard.rarity === 'Epic' ? '💜' : '💙');

    const questLogEmbed = new EmbedBuilder()
      .setTitle(`📜 QUEST LOG: DAILY DE @${userDisplayName}`)
      .setDescription(
        `**🟢 Realizado Ontem:**\n${done}\n\n` +
        `**🎯 Foco de Hoje:**\n${todo}\n\n` +
        `**⚠️ Impedimentos:**\n${blockers || 'Nenhum! Caminho livre.'}`
      )
      .addFields(
        {
          name: '🎉 RECOMPENSAS DA REQUISIÇÃO (REVELAÇÃO PASSIVA)',
          value: 
            `⚡ **+${earnedXp} XP Adquiridos** (${xpResult.breakdown})\n` +
            `💥 **${earnedXp} de Dano** infligido no Boss da Sprint!\n` +
            `🎴 **CARD DROP:** ${rarityEmoji} **${drawnCard.name}** [${drawnCard.rarity}]`
        }
      )
      .setColor('#2ECC71')
      .setFooter({ text: `BOMB Gamificação • Streak: 🔥 ${newStreak} dias` })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_kudos_${insertedDaily?.id || 'daily'}`)
        .setLabel('Kudos (+10 XP)')
        .setEmoji('👏')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`btn_hand_help_offer_${discordUserId}`)
        .setLabel('Oferecer Ajuda')
        .setEmoji('🤝')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [questLogEmbed], components: [actionRow] });
  }

  guildTableQueue.enqueueUpdate(client, projectId, guildId, channelId);

  return {
    earnedXp,
    drawnCard,
    newStreak
  };
}
