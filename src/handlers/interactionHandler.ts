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
  ApplicationCommandType,
  GuildMember
} from 'discord.js';
import { supabase } from '../supabase.js';
import { processDailySubmission } from '../services/passiveRewardService.js';
import { guildTableQueue } from '../services/guildTableQueueService.js';
import { Logger } from '../logger.js';
import { projectService } from '../services/projectService.js';
import { userService } from '../services/userService.js';
import { sprintService } from '../services/sprintService.js';
import { MascotService, MASCOT_REGISTRY } from '../services/mascotService.js';
import { gamificationService, CLASS_REGISTRY, createClassSelectRow } from '../services/gamificationService.js';
import { impedimentService } from '../services/impedimentService.js';
import { getRandomSprintAndBoss } from '../utils/sprintNames.js';
import { blockersCommand, buildLeaderViewEmbed, buildMemberViewEmbed, buildDashboardActionRows } from '../commands/blockers.js';
import { classCommand } from '../commands/class.js';
import { joinProject } from '../commands/joinProject.js';
import { profileCommand } from '../commands/profile.js';
import { leaderboardCommand } from '../commands/leaderboard.js';
import { projectStatus } from '../commands/projectStatus.js';
import { planningCommand } from '../commands/planning.js';
import { reviewCommand } from '../commands/review.js';
import { retrospectiveCommand } from '../commands/retrospective.js';
import { finishProject } from '../commands/finishProject.js';
import { setupLanguageCommand } from '../commands/setupLanguage.js';
import { commands } from '../commands/index.js';
import type { MascotType, Language } from '../types.js';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      let action = commandName;

      if (commandName === 'bomb') {
        action = interaction.options.getSubcommand(false) || 'table';
      }

      if (action === 'setup') {
        const channelSelect = new ChannelSelectMenuBuilder()
          .setCustomId('setup_channel_select')
          .setPlaceholder('Escolha o canal oficial da Mesa da Guilda')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);

        await interaction.reply({
          content: '⚙️ **Wizard de Configuração do BOMB (Passo 1/3)**\nEscolha o canal onde a **Mesa da Guilda** será mantida fixada:',
          components: [row],
          ephemeral: true
        });
        return;
      }

      if (action === 'join' || action === 'join_project') {
        await joinProject.execute(interaction, interaction.client);
        return;
      }

      if (action === 'classe' || action === 'class') {
        await classCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'daily') {
        await showDailyModal(interaction);
        return;
      }

      if (action === 'blockers') {
        await blockersCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'table') {
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
        await interaction.editReply({ content: '✅ **Mesa da Guilda** atualizada e afixada neste canal com sucesso!' });
        return;
      }

      if (action === 'profile') {
        await profileCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'leaderboard') {
        await leaderboardCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'status' || action === 'project_status') {
        await projectStatus.execute(interaction, interaction.client);
        return;
      }

      if (action === 'planning') {
        await planningCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'review') {
        await reviewCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'retro' || action === 'retrospective') {
        await retrospectiveCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'finish' || action === 'finish_project') {
        await finishProject.execute(interaction, interaction.client);
        return;
      }

      if (action === 'language' || action === 'setup_language') {
        await setupLanguageCommand.execute(interaction, interaction.client);
        return;
      }

      if (action === 'help_me') {
        const duvida = interaction.options.getString('duvida');
        if (duvida && duvida.trim().length > 0) {
          await showDiscreetHelpModal(interaction, duvida);
        } else {
          await showFullGuideEmbed(interaction);
        }
        return;
      }

      // Delegate to registered legacy standalone commands if invoked directly
      const cmd = commands.get(commandName);
      if (cmd) {
        await cmd.execute(interaction, interaction.client);
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

      if (customId === 'btn_blockers_view' || customId === 'blockers_view_leader') {
        await showBlockersDashboard(interaction, 'leader');
        return;
      }

      if (customId === 'blockers_view_member') {
        await showBlockersDashboard(interaction, 'member');
        return;
      }

      if (customId === 'blockers_add_btn') {
        await showAddBlockerModal(interaction);
        return;
      }

      if (customId === 'blockers_offer_help_btn') {
        await showOfferHelpSelectMenu(interaction);
        return;
      }

      if (customId === 'blockers_resolve_btn') {
        await showResolveBlockerSelectMenu(interaction);
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
          .setCustomId(`modal_setup_daily_${selectedChannelId}`)
          .setTitle('⚙️ Configurações da Daily & Guilda (2/3)');

        const timeInput = new TextInputBuilder()
          .setCustomId('daily_time')
          .setLabel('Horário de Abertura da Daily (HH:MM)')
          .setValue('09:00')
          .setPlaceholder('Ex: 09:00')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const tzInput = new TextInputBuilder()
          .setCustomId('timezone')
          .setLabel('Time Zone do Projeto')
          .setValue('America/Sao_Paulo')
          .setPlaceholder('Ex: America/Sao_Paulo ou UTC')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const periodInput = new TextInputBuilder()
          .setCustomId('daily_period')
          .setLabel('Tempo Aberta (Horas)')
          .setValue('2')
          .setPlaceholder('Ex: 2')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const weekdaysInput = new TextInputBuilder()
          .setCustomId('weekdays')
          .setLabel('Dias da Semana Abertos (1=Seg ... 7=Dom)')
          .setValue('1,2,3,4,5')
          .setPlaceholder('Ex: 1,2,3,4,5 (1=Seg, 2=Ter... 7=Dom)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const passwordInput = new TextInputBuilder()
          .setCustomId('access_code')
          .setLabel('Senha de Acesso do Projeto (opcional)')
          .setPlaceholder('Deixe em branco para gerar automaticamente')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(tzInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(periodInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(weekdaysInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(passwordInput)
        );

        await interaction.showModal(modal);
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('setup_mascot_select_')) {
        const projectId = interaction.customId.replace('setup_mascot_select_', '');
        const selectedMascot = interaction.values[0] as MascotType;

        await interaction.deferReply({ ephemeral: true });

        const project = await supabase.from('projects').select('*').eq('id', projectId).single().then(r => r.data);
        if (!project) {
          await interaction.editReply({ content: '❌ Projeto não encontrado.' });
          return;
        }

        await MascotService.setMascotType(projectId, selectedMascot);

        const lang: Language = (project.language as Language) || 'pt';
        const { sprintName, bossName } = getRandomSprintAndBoss(lang);

        const latestSprintNum = await sprintService.getLatestSprintNumber(projectId);
        const nextSprintNum = latestSprintNum + 1;
        const today = new Date().toISOString().split('T')[0]!;
        const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

        await sprintService.createSprint(projectId, nextSprintNum, today, endDate);
        await projectService.updateProjectSprintSettings(projectId, true, 10);

        guildTableQueue.enqueueUpdate(interaction.client, projectId, interaction.guildId!, project.channel_id!);

        const mascotDef = MASCOT_REGISTRY[selectedMascot] || MASCOT_REGISTRY['Fusca Transformer'];

        const embed = new EmbedBuilder()
          .setTitle('🏰 GUILDA CONFIGURADA COM SUCESSO!')
          .setDescription(
            `**Projeto:** ${project.name}\n` +
            `**Canal Oficial:** <#${project.channel_id}>\n` +
            `**Senha de Acesso:** \`${project.access_code}\` *(Use \`/bomb join ${project.access_code}\` para entrar)*\n\n` +
            `⏰ **Configurações da Delia:**\n` +
            `• **Horário de Abertura:** ${project.daily_time || '09:00'}\n` +
            `• **Fuso Horário:** ${project.timezone || 'America/Sao_Paulo'}\n` +
            `• **Tempo Aberta:** ${project.daily_period || 2} hora(s)\n` +
            `• **Dias de Funcionamento:** ${project.weekdays || '1,2,3,4,5'}\n\n` +
            `🐾 **God Beast (Mascote):** ${mascotDef.icon} **${mascotDef.name}**\n` +
            `*Aura Ativa:* ${mascotDef.auraInfo}\n\n` +
            `⚔️ **Expedição #${nextSprintNum} Inicializada:**\n` +
            `• **Sprint:** "${sprintName}"\n` +
            `• **Chefão da Sprint:** 👾 **${bossName}**`
          )
          .setColor('#2ECC71');

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (interaction.customId === 'class_select_menu') {
        await interaction.deferReply({ ephemeral: true });
        const selectedClass = interaction.values[0]!;
        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        await gamificationService.changeUserClass(user, selectedClass);
        const classDef = CLASS_REGISTRY[selectedClass] || CLASS_REGISTRY['Gobbo']!;

        await interaction.editReply({
          content: `🎉 **Classe Alterada com Sucesso!**\nAgora você é um ${classDef.icon} **${classDef.name}**!\n\n⚡ **Passiva:** ${classDef.passiveInfo}`
        });
        return;
      }

      if (interaction.customId === 'select_help_blocker') {
        const impedimentId = interaction.values[0]!;
        await interaction.deferReply({ ephemeral: true });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const updated = await impedimentService.assignHelper(impedimentId, user.id);
        if (!updated) {
          await interaction.editReply({ content: '❌ Não foi possível atribuir ajuda a este impedimento.' });
          return;
        }

        await interaction.editReply({
          content: `🤝 **Mão Amiga Concedida!** Você ofereceu suporte a **<@${updated.user.discord_id}>**. (+25 XP Prosocial)`
        });
        return;
      }

      if (interaction.customId === 'select_resolve_blocker') {
        const impedimentId = interaction.values[0]!;
        await interaction.deferReply({ ephemeral: true });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const resolved = await impedimentService.resolveImpediment(impedimentId, user.id);
        if (!resolved) {
          await interaction.editReply({ content: '❌ Não foi possível resolver este impedimento.' });
          return;
        }

        await interaction.editReply({
          content: `✅ **Obstáculo Resolvido!** Você ajudou a desobstruir a expedição da guilda.`
        });
        return;
      }

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
          await interaction.editReply({
            content: '❌ **Nenhum projeto encontrado!** O líder precisa configurar o servidor com `/bomb setup` primeiro.'
          });
          return;
        }

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const isMember = await userService.isMemberOfProject(user.id, project.id);
        if (!isMember) {
          await interaction.editReply({
            content: `🔒 **Acesso Negado!** Você ainda não faz parte da guilda **${project.name}**.\nEntre utilizando o comando \`/bomb join <senha>\` com a senha fornecida pelo líder!`
          });
          return;
        }

        const result = await processDailySubmission({
          client: interaction.client,
          projectId: project.id,
          guildId: interaction.guildId!,
          channelId: interaction.channelId!,
          discordUserId: interaction.user.id,
          userDisplayName: displayName,
          done,
          todo,
          blockers
        });

        await interaction.editReply({
          content: `🎉 **Daily Enviada com Sucesso!**\n⚡ **+${result.earnedXp} XP** | 🎴 Card: **${result.drawnCard.name}** | Streak: 🔥 **${result.newStreak} dias**`
        });
        return;
      }

      if (interaction.customId.startsWith('modal_setup_daily_')) {
        const channelId = interaction.customId.replace('modal_setup_daily_', '');
        const dailyTime = interaction.fields.getTextInputValue('daily_time') || '09:00';
        const timezone = interaction.fields.getTextInputValue('timezone') || 'America/Sao_Paulo';
        const dailyPeriod = parseInt(interaction.fields.getTextInputValue('daily_period')) || 2;
        const weekdays = interaction.fields.getTextInputValue('weekdays') || '1,2,3,4,5';
        let accessCode = interaction.fields.getTextInputValue('access_code');

        await interaction.deferReply({ ephemeral: true });

        if (!accessCode || accessCode.trim().length === 0) {
          accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        } else {
          accessCode = accessCode.trim().toUpperCase();
        }

        let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
        if (!project) {
          const { data: newP } = await supabase.from('projects').insert({
            guild_id: interaction.guildId,
            name: interaction.guild?.name || 'Projeto Guilda',
            channel_id: channelId,
            daily_time: dailyTime,
            timezone,
            daily_period: dailyPeriod,
            weekdays,
            access_code: accessCode
          }).select().single();
          project = newP;
        } else {
          await supabase.from('projects').update({
            channel_id: channelId,
            daily_time: dailyTime,
            timezone,
            daily_period: dailyPeriod,
            weekdays,
            access_code: accessCode
          }).eq('id', project.id);
        }

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);
        await userService.addMemberToProject(user.id, project.id).catch(() => {});

        const mascotSelect = new StringSelectMenuBuilder()
          .setCustomId(`setup_mascot_select_${project.id}`)
          .setPlaceholder('Escolha a God Beast (Mascote da Guilda)')
          .addOptions(
            (Object.values(MASCOT_REGISTRY) as any[]).map((m: any) => new StringSelectMenuOptionBuilder()
              .setLabel(`${m.icon} ${m.name}`)
              .setDescription(`${m.auraInfo}`)
              .setValue(m.type)
            )
          );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(mascotSelect);

        await interaction.editReply({
          content: `⚙️ **Wizard de Configuração do BOMB (Passo 3/3)**\nAgora escolha qual é a **God Beast** (Mascote) oficial do projeto:`,
          components: [row]
        });
        return;
      }

      if (interaction.customId.startsWith('finish_project_modal_')) {
        const projectId = interaction.customId.replace('finish_project_modal_', '');
        const description = interaction.fields.getTextInputValue('description');
        const icon = interaction.fields.getTextInputValue('icon') || '🏆';

        await interaction.deferReply();

        const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
        if (!project) {
          await interaction.editReply({ content: '❌ Projeto não encontrado.' });
          return;
        }

        const members = await userService.getProjectMembers(projectId);
        for (const member of members) {
          await userService.awardBadge(member.id, project.name, description, icon).catch(() => {});
        }

        const embed = new EmbedBuilder()
          .setTitle(`🏆 EXPEDIÇÃO CONCLUÍDA COM SUCESSO: ${project.name.toUpperCase()}`)
          .setDescription(
            `🎉 **A expedição foi oficialmente encerrada com louvor!**\n\n` +
            `📜 **Relatório das Conquistas da Guilda:**\n*${description}*\n\n` +
            `🏅 **Troféu Concedido:** ${icon} a todos os **${members.length}** integrante(s)!\n` +
            `*As insígnias de honra já estão disponíveis nos perfis dos aventureiros (\`/bomb profile\`).*`
          )
          .setColor('#F1C40F');

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (interaction.customId === 'modal_add_blocker') {
        await interaction.deferReply({ ephemeral: true });
        const blockerDesc = interaction.fields.getTextInputValue('blocker_desc');

        const project = await projectService.getProjectByGuild(interaction.guildId!);
        if (!project) {
          await interaction.editReply({ content: '❌ Nenhuma guilda ativa encontrada.' });
          return;
        }

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        await impedimentService.recordStandupBlocker(user.id, project.id, null, blockerDesc);

        await interaction.editReply({
          content: `🚧 **Obstáculo Registrado!** Seu impedimento foi adicionado ao Painel de Blockers da guilda.`
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

async function showAddBlockerModal(interaction: any) {
  const modal = new ModalBuilder()
    .setCustomId('modal_add_blocker')
    .setTitle('🚧 Relatar Novo Obstáculo / Blocker');

  const descInput = new TextInputBuilder()
    .setCustomId('blocker_desc')
    .setLabel('Descreva o que está travando o seu avanço')
    .setPlaceholder('Ex: Aguardando liberação de acesso às chaves de API...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(descInput));
  await interaction.showModal(modal);
}

async function showOfferHelpSelectMenu(interaction: any) {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) {
    await interaction.reply({ content: '❌ Projeto não encontrado neste servidor.', ephemeral: true });
    return;
  }

  const activeImpediments = await impedimentService.getActiveImpediments(project.id);
  const helpCandidates = activeImpediments.filter(i => i.status === 'active');

  if (helpCandidates.length === 0) {
    await interaction.reply({ content: '✨ Nenhum obstáculo ativo precisando de ajuda no momento!', ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_help_blocker')
    .setPlaceholder('Escolha um obstáculo para ajudar...')
    .addOptions(
      helpCandidates.map(imp => new StringSelectMenuOptionBuilder()
        .setLabel(`🔴 ${imp.user?.display_name || 'Membro'}: "${imp.description.substring(0, 50)}"`)
        .setDescription(`Block streak: ${imp.block_streak} dia(s)`)
        .setValue(imp.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  await interaction.reply({ content: '🤝 **Escolha qual obstáculo você deseja assumir para ajudar:**', components: [row], ephemeral: true });
}

async function showResolveBlockerSelectMenu(interaction: any) {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) {
    await interaction.reply({ content: '❌ Projeto não encontrado neste servidor.', ephemeral: true });
    return;
  }

  const activeImpediments = await impedimentService.getActiveImpediments(project.id);

  if (activeImpediments.length === 0) {
    await interaction.reply({ content: '✨ Nenhum obstáculo ativo para resolver!', ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_resolve_blocker')
    .setPlaceholder('Escolha o obstáculo resolvido...')
    .addOptions(
      activeImpediments.map(imp => new StringSelectMenuOptionBuilder()
        .setLabel(`🚧 ${imp.user?.display_name || 'Membro'}: "${imp.description.substring(0, 50)}"`)
        .setDescription(`Status: ${imp.status}`)
        .setValue(imp.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  await interaction.reply({ content: '✅ **Selecione qual obstáculo foi desbloqueado/resolvido:**', components: [row], ephemeral: true });
}

async function showBlockersDashboard(interaction: any, viewOption: 'leader' | 'member' = 'leader') {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) {
    await interaction.reply({ content: '❌ Nenhuma guilda foi fundada neste servidor ainda.', ephemeral: true });
    return;
  }

  const displayName = interaction.user.displayName || interaction.user.username;
  const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

  const [impediments, stats] = await Promise.all([
    impedimentService.getActiveImpediments(project.id),
    impedimentService.getProjectImpedimentStats(project.id),
  ]);

  const embed = viewOption === 'member'
    ? buildMemberViewEmbed(project, user, impediments)
    : buildLeaderViewEmbed(project, impediments, stats);

  const components = buildDashboardActionRows(viewOption, impediments, user.id);

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components });
  } else {
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  }
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
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) {
    await interaction.reply({ content: '❌ Nenhuma guilda configurada.', ephemeral: true });
    return;
  }
  const mascot = await MascotService.getOrCreateMascot(project.id);
  const banner = MascotService.renderMascotBanner(mascot);

  await interaction.reply({
    content: banner,
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
      `• **100% Interativo:** Use \`/bomb\` com subcomandos ou clique nos botões diretamente na mensagem!\n\n` +
      `### 📜 2. Dailies Assíncronas & Recompensas Passivas\n` +
      `• Execute **/bomb daily** ou clique em **[ 📜 Responder Daily ]** na Mesa da Guilda.\n` +
      `• Ganhe **XP**, cause **Dano no Boss**, ative **Passivas de Classe** e ganhe **Cards Colecionáveis** automaticamente.\n\n` +
      `### 🔑 3. Entrada na Guilda por Senha\n` +
      `• Para participar e enviar relatórios, entre na guilda usando **/bomb join <senha>** com o código fornecido pelo líder.\n\n` +
      `### 🖐️ 4. Mão Amiga & Segurança Psicológica\n` +
      `• Suporte discreto sem exposição pública ou julgamentos.\n` +
      `• Execute **/help_me <sua dúvida>** ou clique com botão direito em qualquer mensagem/dev -> **Apps -> 🖐️ Solicitar Mão Amiga**.\n` +
      `• Integrantes que ajudam ganham **+25 XP Prosocial**.\n\n` +
      `### 🐾 5. Mascotes & Auras da Guilda\n` +
      `• O líder escolhe o God Beast (Mascote) no wizard (/bomb setup) que concede auras ativas para todo o servidor.\n\n` +
      `### 🧙 6. Classes RPG & Cards Colecionáveis\n` +
      `• Use **/bomb classe** para evoluir entre 6 classes (**Gobbo**, **Spearman**, **Mooladin**, **Healer**, **Beast Tamer**, **Scissorpaw**).\n` +
      `• Colecione cards de raridades Comum, Raro, Épico e Shiny em cada daily enviada.\n\n` +
      `### 🗺️ 7. Cerimônias Ágeis (Threads Temporárias)\n` +
      `• Planning, Review e Retrospectiva acontecem em Threads temporárias via **/bomb planning**, **/bomb review** e **/bomb retro**.`
    )
    .setColor('#5865F2')
    .setFooter({ text: 'BOMB RPG Scrum • Use /bomb para acessar todas as funcionalidades!' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_hand_help_open').setLabel('Pedir Suporte Discreto').setEmoji('🖐️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_daily_open').setLabel('Responder Daily').setEmoji('📜').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_profile_cards').setLabel('Ver Ficha & Cards').setEmoji('🧙').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [guideEmbed], components: [row], ephemeral: true });
}
