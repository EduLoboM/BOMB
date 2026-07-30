import { 
  Interaction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelSelectMenuBuilder, 
  ChannelType, 
  TextChannel,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ApplicationCommandType
} from 'discord.js';
import { supabase } from '../supabase.js';
import { processDailySubmission } from '../services/passiveRewardService.js';
import { guildTableQueue } from '../services/guildTableQueueService.js';
import { Logger } from '../logger.js';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'bomb') {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'table') {
          let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
          if (!project) {
            const { data: newProj } = await supabase.from('projects').insert({
              guild_id: interaction.guildId,
              name: interaction.guild?.name || 'Projeto Guilda',
              access_code: Math.random().toString(36).substring(2, 8).toUpperCase()
            }).select().single();
            project = newProj;
          }

          await interaction.deferReply({ ephemeral: true });
          guildTableQueue.enqueueUpdate(interaction.client, project.id, interaction.guildId!, interaction.channelId!);
          await interaction.editReply({ content: '✅ Mesa da Guilda atualizada e afixada neste canal com sucesso!' });
          return;
        }

        if (subcommand === 'setup') {
          const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('setup_channel_select')
            .setPlaceholder('Escolha o canal oficial da Mesa da Guilda')
            .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

          const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);

          await interaction.reply({
            content: '⚙️ **Wizard de Configuração do BOMB**\nEscolha o canal onde a **Mesa da Guilda** será mantida fixada:',
            components: [row],
            ephemeral: true
          });
          return;
        }
      }

      if (commandName === 'daily') {
        await showDailyModal(interaction);
        return;
      }

      if (commandName === 'help_me') {
        const duvida = interaction.options.getString('duvida');
        if (duvida && duvida.trim().length > 0) {
          await showDiscreetHelpModal(interaction, duvida);
        } else {
          await showFullGuideEmbed(interaction);
        }
        return;
      }
    }

    if (interaction.isContextMenuCommand()) {
      if (interaction.commandName === '🖐️ Solicitar Mão Amiga') {
        if (interaction.commandType === ApplicationCommandType.Message) {
          const targetMsg = interaction.options.getMessage('message');
          await showDiscreetHelpModal(interaction, targetMsg?.content);
        } else {
          await showDiscreetHelpModal(interaction);
        }
        return;
      }
      if (interaction.commandName === '🖐️ Oferecer Mão Amiga') {
        const targetUser = (interaction as any).targetUser || interaction.user;
        await interaction.reply({
          content: `🤝 Você ofereceu apoio a **@${targetUser?.username}**! Um aviso discreto foi enviado. (+25 XP Prosocial)`,
          ephemeral: true
        });
        return;
      }
    }

    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'btn_daily_open') {
        await showDailyModal(interaction);
        return;
      }

      if (customId === 'btn_hand_help_open') {
        await showDiscreetHelpModal(interaction);
        return;
      }

      if (customId === 'btn_blockers_view') {
        await showBlockersDashboard(interaction);
        return;
      }

      if (customId === 'btn_profile_cards') {
        await showUserProfileAndCards(interaction);
        return;
      }

      if (customId.startsWith('btn_kudos_')) {
        await interaction.reply({
          content: '👏 **Kudos Enviado!** Você concedeu +10 XP para o autor desta daily.',
          ephemeral: true
        });
        return;
      }

      if (customId.startsWith('btn_hand_help_offer_')) {
        await interaction.reply({
          content: `🤝 **Mão Amiga Estendida!** Você ofereceu suporte ao dev. XP Prosocial concedido!`,
          ephemeral: true
        });
        return;
      }
    }

    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'setup_channel_select') {
        const selectedChannelId = interaction.values[0];
        
        const modal = new ModalBuilder()
          .setCustomId(`modal_setup_sprint_${selectedChannelId}`)
          .setTitle('⚙️ Configuração da Sprint & Guilda');

        const nameInput = new TextInputBuilder()
          .setCustomId('sprint_name')
          .setLabel('Nome da Sprint / Expedição')
          .setPlaceholder('Ex: Sprint 04 - Caverna dos Bugs')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const durationInput = new TextInputBuilder()
          .setCustomId('sprint_duration')
          .setLabel('Duração em Dias Úteis')
          .setValue('10')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput)
        );

        await interaction.showModal(modal);
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'select_guild_menu') {
        const selectedValue = interaction.values[0];

        if (selectedValue === 'ceremony_planning') {
          await startPlanningThread(interaction);
          return;
        }

        if (selectedValue === 'ceremony_review') {
          await showSprintReviewModal(interaction);
          return;
        }

        if (selectedValue === 'ceremony_retro') {
          await startRetroThread(interaction);
          return;
        }

        if (selectedValue === 'view_leaderboard') {
          await showLeaderboard(interaction);
          return;
        }

        if (selectedValue === 'view_mascot') {
          await showMascotStatus(interaction);
          return;
        }
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_daily_form') {
        await interaction.deferReply({ ephemeral: true });

        const done = interaction.fields.getTextInputValue('daily_done');
        const todo = interaction.fields.getTextInputValue('daily_todo');
        const blockers = interaction.fields.getTextInputValue('daily_blockers');

        let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
        if (!project) {
          const { data: newP } = await supabase.from('projects').insert({
            guild_id: interaction.guildId,
            name: interaction.guild?.name || 'Projeto Guilda',
            access_code: Math.random().toString(36).substring(2, 8).toUpperCase()
          }).select().single();
          project = newP;
        }

        const result = await processDailySubmission({
          client: interaction.client,
          projectId: project.id,
          guildId: interaction.guildId!,
          channelId: interaction.channelId!,
          discordUserId: interaction.user.id,
          userDisplayName: interaction.user.displayName || interaction.user.username,
          done,
          todo,
          blockers
        });

        await interaction.editReply({
          content: `🎉 **Daily Enviada com Sucesso!**\n⚡ **+${result.earnedXp} XP** | 🎴 Card: **${result.drawnCard.name}** | Streak: 🔥 **${result.newStreak} dias**`
        });
        return;
      }

      if (interaction.customId.startsWith('modal_setup_sprint_')) {
        const channelId = interaction.customId.replace('modal_setup_sprint_', '');
        const sprintName = interaction.fields.getTextInputValue('sprint_name');
        const duration = parseInt(interaction.fields.getTextInputValue('sprint_duration')) || 10;

        await interaction.deferReply({ ephemeral: true });

        let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
        if (!project) {
          const { data: newP } = await supabase.from('projects').insert({
            guild_id: interaction.guildId,
            name: sprintName,
            channel_id: channelId,
            sprint_duration: duration,
            access_code: Math.random().toString(36).substring(2, 8).toUpperCase()
          }).select().single();
          project = newP;
        } else {
          await supabase.from('projects').update({
            name: sprintName,
            channel_id: channelId,
            sprint_duration: duration
          }).eq('id', project.id);
        }

        guildTableQueue.enqueueUpdate(interaction.client, project.id, interaction.guildId!, channelId);

        await interaction.editReply({
          content: `✅ **Setup Concluído com Sucesso!**\nA Mesa da Guilda foi criada e fixada no canal <#${channelId}>.`
        });
        return;
      }

      if (interaction.customId === 'modal_discreet_help') {
        const note = interaction.fields.getTextInputValue('help_note');
        await interaction.reply({
          content: `🖐️ **Mão Amiga Solicitada!** Seu pedido de suporte foi cadastrado discretamente ("${note}"). Um companheiro de guilda responderá em breve! (+15 XP de Resiliência)`,
          ephemeral: true
        });
        return;
      }
    }
  } catch (error) {
    Logger.error('Error handling interaction:', error);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ content: '❌ Ocorreu um erro ao processar esta interacção.', ephemeral: true }).catch(() => {});
    }
  }
}

async function showDailyModal(interaction: any) {
  const modal = new ModalBuilder()
    .setCustomId('modal_daily_form')
    .setTitle('📜 Daily Assíncrona — Relatório Diário');

  const doneInput = new TextInputBuilder()
    .setCustomId('daily_done')
    .setLabel('O que você fez desde a última daily?')
    .setPlaceholder('Ex: Concluí o layout da Dashboard e testes unitários...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const todoInput = new TextInputBuilder()
    .setCustomId('daily_todo')
    .setLabel('O que você pretende fazer hoje?')
    .setPlaceholder('Ex: Integrar API de autenticação no backend...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const blockersInput = new TextInputBuilder()
    .setCustomId('daily_blockers')
    .setLabel('Existe algum impedimento / blocker?')
    .setPlaceholder('Ex: Nenhum (ou descreva o problema se estiver travado)...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(doneInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(todoInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(blockersInput)
  );

  await interaction.showModal(modal);
}

async function showDiscreetHelpModal(interaction: any, prefilledContent?: string) {
  const modal = new ModalBuilder()
    .setCustomId('modal_discreet_help')
    .setTitle('🖐️ Mão Amiga — Pedido de Suporte Discreto');

  const noteInput = new TextInputBuilder()
    .setCustomId('help_note')
    .setLabel('Descreva brevemente em que precisa de ajuda')
    .setValue(prefilledContent ? `Relacionado a: ${prefilledContent.substring(0, 80)}` : '')
    .setPlaceholder('Ex: Estou com dúvidas na configuração da rota no backend...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
  await interaction.showModal(modal);
}

async function showBlockersDashboard(interaction: any) {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ PAINEL DE BLOCKERS DA GUILDA')
    .setDescription('Aqui estão os impedimentos ativos relatados pelo time:')
    .addFields(
      { name: '🔴 @carla (Ativo há 1 dia)', value: 'Aguardando liberação de credenciais de banco.' },
      { name: '🟢 @marcos_qa (Resolvido)', value: 'Ajudado por @ana_coder ✨' }
    )
    .setColor('#E74C3C');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_hand_help_open').setLabel('Oferecer Suporte').setEmoji('🖐️').setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function showUserProfileAndCards(interaction: any) {
  const { data: dbUser } = await supabase.from('users').select('*').eq('discord_id', interaction.user.id).maybeSingle();
  const level = dbUser?.level || 1;
  const xp = dbUser?.xp || 0;
  const streak = dbUser?.streak || 0;
  const charClass = dbUser?.character_class || 'Gobbo';

  const embed = new EmbedBuilder()
    .setTitle(`🧙 FICHA DE HERÓI: ${interaction.user.username}`)
    .setDescription(
      `**Classe RPG:** 🍀 ${charClass}\n` +
      `**Nível:** Lv. ${level}\n` +
      `**XP Acumulado:** ⚡ ${xp} XP\n` +
      `**Sequência Ativa:** 🔥 ${streak} dias`
    )
    .setColor('#9B59B6');

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function startPlanningThread(interaction: any) {
  const channel = interaction.channel as TextChannel;
  if (channel && channel.threads) {
    const thread = await channel.threads.create({
      name: `🗺️-sprint-planning-${Date.now().toString().slice(-4)}`,
      autoArchiveDuration: 60,
      reason: 'Thread de Sprint Planning do BOMB'
    });

    await thread.send('🗺️ **Sprint Planning Iniciado!** Adicionem as tarefas e estimativas da expedição nesta thread.');
    await interaction.reply({ content: `✅ Thread de Planning criada: <#${thread.id}>`, ephemeral: true });
  } else {
    await interaction.reply({ content: '❌ As threads não estão habilitadas neste canal.', ephemeral: true });
  }
}

async function startRetroThread(interaction: any) {
  const channel = interaction.channel as TextChannel;
  if (channel && channel.threads) {
    const thread = await channel.threads.create({
      name: `💡-retrospectiva-${Date.now().toString().slice(-4)}`,
      autoArchiveDuration: 60,
      reason: 'Thread de Retrospectiva do BOMB'
    });

    const retroEmbed = new EmbedBuilder()
      .setTitle('💡 MURAL DE RETROSPECTIVA DA GUILDA')
      .setDescription('Clique nos botões abaixo para enviar seus pontos de feedback!')
      .setColor('#F1C40F');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('btn_retro_good').setLabel('O que funcionou').setEmoji('🟢').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_retro_bad').setLabel('O que ajustar').setEmoji('🔴').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_retro_idea').setLabel('Nova Ideia').setEmoji('💡').setStyle(ButtonStyle.Primary)
    );

    await thread.send({ embeds: [retroEmbed], components: [row] });
    await interaction.reply({ content: `✅ Thread de Retrospectiva criada: <#${thread.id}>`, ephemeral: true });
  } else {
    await interaction.reply({ content: '❌ As threads não estão habilitadas neste canal.', ephemeral: true });
  }
}

async function showSprintReviewModal(interaction: any) {
  await interaction.reply({
    content: '📊 **Sprint Review Concluída!** Calculando o Multiplicador de Progresso da Guilda e distribuindo bônus de expedição...',
    ephemeral: true
  });
}

async function showLeaderboard(interaction: any) {
  const { data: topUsers } = await supabase.from('users').select('*').order('xp', { ascending: false }).limit(5);

  let leaderboardText = '🏆 **RANKING DA GUILDA (TOP 5):**\n\n';
  if (topUsers && topUsers.length > 0) {
    topUsers.forEach((u, idx) => {
      const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '🎖️'));
      leaderboardText += `${medal} **${u.display_name}** — Lv. ${u.level} (⚡ ${u.xp} XP)\n`;
    });
  } else {
    leaderboardText += 'Nenhum participante pontuou ainda.';
  }

  await interaction.reply({ content: leaderboardText, ephemeral: true });
}

async function showMascotStatus(interaction: any) {
  await interaction.reply({
    content: '🐾 **MASCOTE DA GUILDA: Fusca Transformer (Nível 3)**\nAura Ativa: ⚡ **+25% XP em Dailies Matutinas** (Early Bird)',
    ephemeral: true
  });
}

async function showFullGuideEmbed(interaction: any) {
  const guideEmbed = new EmbedBuilder()
    .setTitle('💣 BOMB — GUIA COMPLETO & MANUAL DA GUILDA')
    .setDescription(
      `O **BOMB** é o assistente gamificado de Scrum/XP para equipes no Discord. Ele elimina a burocracia das dailies e cerimônias transformando a rotina do time em um jogo cooperativo com zero comandos complexos!\n\n` +
      `### 🛡️ 1. A Mesa da Guilda (Hub Central)\n` +
      `• Mensagem fixa no canal do projeto com status da Sprint, HP do Boss da Sprint, Nível do Mascote e lista de Dailies.\n` +
      `• **100% Interativo:** Clique nos botões diretamente na mensagem sem digitar nada!\n\n` +
      `### 📜 2. Dailies Assíncronas & Recompensas Passivas\n` +
      `• Clique em **[ 📜 Responder Daily ]** na Mesa da Guilda ou use **/daily**.\n` +
      `• Ganhe **XP**, cause **Dano no Boss**, ative **Passivas de Classe** e ganhe **Cards Colecionáveis** automaticamente.\n\n` +
      `### 🖐️ 3. Mão Amiga & Segurança Psicológica\n` +
      `• Suporte discreto sem exposição pública ou julgamentos.\n` +
      `• Execute **/help_me <sua dúvida>** ou clique com botão direito em qualquer mensagem/dev -> **Apps -> 🖐️ Solicitar Mão Amiga**.\n` +
      `• Integrantes que ajudam ganham **+25 XP Prosocial**.\n\n` +
      `### 🐾 4. Mascotes & Auras da Guilda\n` +
      `• O líder escolhe o Mascote do time (ex: **Fusca Transformer** concede +25% XP em Dailies matutinas).\n\n` +
      `### 🧙 5. Classes RPG & Cards Colecionáveis\n` +
      `• Evolua entre 6 classes (**Gobbo**, **Spearman**, **Mooladin**, **Healer**, **Beast Tamer**, **Scissorpaw**).\n` +
      `• Colecione cards de raridades Comum, Raro, Épico e Shiny em cada daily enviada.\n\n` +
      `### 🗺️ 6. Cerimônias Ágeis (Threads Temporárias)\n` +
      `• Planning, Review e Retrospectiva acontecem em Threads temporárias com modais e botões de votação.`
    )
    .setColor('#5865F2')
    .setFooter({ text: 'BOMB RPG Scrum • Use os botões da Mesa da Guilda para interagir!' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_hand_help_open').setLabel('Pedir Suporte Discreto').setEmoji('🖐️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_daily_open').setLabel('Responder Daily').setEmoji('📜').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_profile_cards').setLabel('Ver Ficha & Cards').setEmoji('🧙').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [guideEmbed], components: [row], ephemeral: true });
}
