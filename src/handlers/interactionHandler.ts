import { 
  Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
  EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, 
  TextChannel, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ApplicationCommandType
} from 'discord.js';
import { supabase } from '../supabase.js';
import { processDailySubmission } from '../services/passiveRewardService.js';
import { guildTableQueue } from '../services/guildTableQueueService.js';
import { Logger } from '../logger.js';
import { projectService } from '../services/projectService.js';
import { userService } from '../services/userService.js';
import { sprintService } from '../services/sprintService.js';
import { MascotService, MASCOT_REGISTRY } from '../services/mascotService.js';
import { gamificationService, CLASS_REGISTRY } from '../services/gamificationService.js';
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
import { setupSprint } from '../commands/setupSprint.js';
import { planningService } from '../services/planningService.js';
import { commands } from '../commands/index.js';
import type { MascotType, Language, RetroCategory } from '../types.js';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      let action = interaction.commandName === 'bomb' ? interaction.options.getSubcommand(false) || 'table' : interaction.commandName;

      if (action === 'setup' || action === 'setup_guild') {
        const channelSelect = new ChannelSelectMenuBuilder().setCustomId('setup_channel_select').setPlaceholder('Escolha o canal oficial da Mesa da Guilda').setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
        await interaction.reply({ content: '⚙️ **Wizard de Configuração do BOMB (Passo 1/3)**\nEscolha o canal onde a **Mesa da Guilda** será mantida fixada:', components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect)], ephemeral: true });
        return;
      }
      if (action === 'setup_sprint') return setupSprint.execute(interaction, interaction.client);
      if (action === 'join' || action === 'join_project') return joinProject.execute(interaction, interaction.client);
      if (action === 'classe' || action === 'class') return classCommand.execute(interaction, interaction.client);
      if (action === 'daily') return showDailyModal(interaction);
      if (action === 'blockers') return blockersCommand.execute(interaction, interaction.client);
      if (action === 'table') {
        let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
        if (!project) {
          const { data: newProj } = await supabase.from('projects').insert({ guild_id: interaction.guildId, name: interaction.guild?.name || 'Projeto Guilda', access_code: Math.random().toString(36).substring(2, 8).toUpperCase() }).select().single();
          project = newProj;
        }
        await interaction.deferReply({ ephemeral: true });
        guildTableQueue.enqueueUpdate(interaction.client, project.id, interaction.guildId!, interaction.channelId!);
        await interaction.editReply({ content: '✅ **Mesa da Guilda** atualizada e afixada neste canal com sucesso!' });
        return;
      }
      if (action === 'profile') return profileCommand.execute(interaction, interaction.client);
      if (action === 'leaderboard') return leaderboardCommand.execute(interaction, interaction.client);
      if (action === 'status' || action === 'project_status') return projectStatus.execute(interaction, interaction.client);
      if (action === 'planning') return planningCommand.execute(interaction, interaction.client);
      if (action === 'review') return reviewCommand.execute(interaction, interaction.client);
      if (action === 'retro' || action === 'retrospective') return retrospectiveCommand.execute(interaction, interaction.client);
      if (action === 'finish' || action === 'finish_project') return finishProject.execute(interaction, interaction.client);
      if (action === 'help_me') {
        const pedirAjuda = interaction.options.getBoolean?.('pedir_ajuda') ?? false;
        const duvida = interaction.options.getString?.('duvida');
        if (pedirAjuda || (duvida && duvida.trim().length > 0)) {
          return showDiscreetHelpModal(interaction, duvida || undefined);
        }
        return showFullGuideEmbed(interaction);
      }

      const cmd = commands.get(interaction.commandName);
      if (cmd) return cmd.execute(interaction, interaction.client);
    }

    if (interaction.isContextMenuCommand()) {
      if (interaction.commandName === '🖐️ Solicitar Mão Amiga') {
        const targetMsg = interaction.commandType === ApplicationCommandType.Message ? interaction.options.getMessage('message') : null;
        return showDiscreetHelpModal(interaction, targetMsg?.content);
      }
      if (interaction.commandName === '🖐️ Oferecer Mão Amiga') {
        const targetUser = (interaction as any).targetUser || interaction.user;
        await interaction.reply({ content: `🤝 Você ofereceu apoio a **@${targetUser?.username}**! Um aviso discreto foi enviado. (+25 XP Prosocial)`, ephemeral: true });
        return;
      }
    }

    if (interaction.isButton()) {
      const { customId } = interaction;
      if (customId === 'btn_daily_open') return showDailyModal(interaction);
      if (customId === 'btn_hand_help_open') return showDiscreetHelpModal(interaction);
      if (customId === 'btn_blockers_view' || customId === 'blockers_view_leader') return showBlockersDashboard(interaction, 'leader');
      if (customId === 'blockers_view_member') return showBlockersDashboard(interaction, 'member');
      if (customId === 'blockers_add_btn') return showAddBlockerModal(interaction);
      if (customId === 'blockers_offer_help_btn') return showOfferHelpSelectMenu(interaction);
      if (customId === 'blockers_resolve_btn') return showResolveBlockerSelectMenu(interaction);
      if (customId === 'btn_profile_cards') return showUserProfileAndCards(interaction);
      if (customId === 'retro_add_went_well_btn' || customId === 'btn_retro_good') return showRetroAddModal(interaction, 'went_well');
      if (customId === 'retro_add_to_improve_btn' || customId === 'btn_retro_bad') return showRetroAddModal(interaction, 'to_improve');
      if (customId === 'retro_add_action_item_btn' || customId === 'btn_retro_idea') return showRetroAddModal(interaction, 'action_item');
      if (customId === 'planning_add_task_btn') return showPlanningAddTaskModal(interaction);
      if (customId === 'planning_offer_help_btn') return handlePlanningOfferHelp(interaction);
      if (customId === 'planning_request_help_btn') return handlePlanningRequestHelp(interaction);
      if (customId.startsWith('btn_kudos_')) {
        await interaction.reply({ content: '👏 **Kudos Enviado!** Você concedeu +10 XP para o autor desta daily.', ephemeral: true });
        return;
      }
      if (customId.startsWith('btn_hand_help_offer_')) {
        await interaction.reply({ content: '🤝 **Mão Amiga Estendida!** Você ofereceu suporte ao dev. XP Prosocial concedido!', ephemeral: true });
        return;
      }
    }

    if (interaction.isChannelSelectMenu() && interaction.customId === 'setup_channel_select') {
      const selectedChannelId = interaction.values[0];
      const createInput = (id: string, label: string, val: string, place: string, req: boolean) =>
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setValue(val).setPlaceholder(place).setStyle(TextInputStyle.Short).setRequired(req));

      const modal = new ModalBuilder().setCustomId(`modal_setup_daily_${selectedChannelId}`).setTitle('⚙️ Configurações da Daily & Guilda (2/3)').addComponents(
        createInput('daily_time', 'Horário de Abertura da Daily (HH:MM)', '09:00', 'Ex: 09:00', true),
        createInput('timezone', 'Time Zone do Projeto', 'America/Sao_Paulo', 'Ex: America/Sao_Paulo ou UTC', true),
        createInput('sprint_duration', 'Duração da Expedição/Sprint (em Dias)', '14', 'Ex: 7, 14 ou 15', true),
        createInput('weekdays', 'Dias da Semana Abertos (1=Seg ... 7=Dom)', '1,2,3,4,5', 'Ex: 1,2,3,4,5 (1=Seg, 2=Ter... 7=Dom)', true),
        createInput('access_code', 'Senha de Acesso do Projeto (opcional)', '', 'Deixe em branco para gerar automaticamente', false)
      );
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('setup_mascot_select_')) {
        const projectId = interaction.customId.replace('setup_mascot_select_', '');
        const selectedMascot = interaction.values[0] as MascotType;
        await interaction.deferReply({ ephemeral: true });

        const project = await supabase.from('projects').select('*').eq('id', projectId).single().then(r => r.data);
        if (!project) return void await interaction.editReply({ content: '❌ Projeto não encontrado.' });

        await MascotService.setMascotType(projectId, selectedMascot);
        const lang: Language = (project.language as Language) || 'pt';
        const { sprintName, bossName } = getRandomSprintAndBoss(lang);

        const sprintDuration = project.sprint_duration || 14;
        const latestSprintNum = await sprintService.getLatestSprintNumber(projectId);
        const nextSprintNum = latestSprintNum + 1;
        const today = new Date().toISOString().split('T')[0]!;
        const endDate = new Date(Date.now() + sprintDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

        await sprintService.createSprint(projectId, nextSprintNum, today, endDate);
        await projectService.updateProjectSprintSettings(projectId, true, sprintDuration);
        guildTableQueue.enqueueUpdate(interaction.client, projectId, interaction.guildId!, project.channel_id!);

        const mascotDef = MASCOT_REGISTRY[selectedMascot] || MASCOT_REGISTRY['Fusca Transformer'];
        const embed = new EmbedBuilder().setTitle('🏰 GUILDA CONFIGURADA COM SUCESSO!').setDescription(
          `**Projeto:** ${project.name}\n**Canal Oficial:** <#${project.channel_id}>\n**Senha de Acesso:** \`${project.access_code}\` *(Use \`/bomb join ${project.access_code}\` para entrar)*\n\n` +
          `⏰ **Configurações da Delia:**\n• **Horário de Abertura:** ${project.daily_time || '09:00'}\n• **Fuso Horário:** ${project.timezone || 'America/Sao_Paulo'}\n• **Tempo Aberta:** ${project.daily_period || 2} hora(s)\n• **Dias de Funcionamento:** ${project.weekdays || '1,2,3,4,5'}\n\n` +
          `🐾 **God Beast (Mascote):** ${mascotDef.icon} **${mascotDef.name}**\n*Aura Ativa:* ${mascotDef.auraInfo}\n\n` +
          `⚔️ **Expedição #${nextSprintNum} Inicializada:**\n• **Sprint:** "${sprintName}"\n• **Chefão da Sprint:** 👾 **${bossName}**`
        ).setColor('#2ECC71');

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (interaction.customId === 'class_select_menu') {
        await interaction.deferReply({ ephemeral: true });
        const selectedClass = interaction.values[0]!;
        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        await gamificationService.changeUserClass(user, selectedClass);
        const classDef = CLASS_REGISTRY[selectedClass] || CLASS_REGISTRY['Gobbo']!;
        await interaction.editReply({ content: `🎉 **Classe Alterada com Sucesso!**\nAgora você é um ${classDef.icon} **${classDef.name}**!\n\n⚡ **Passiva:** ${classDef.passiveInfo}` });
        return;
      }

      if (interaction.customId === 'select_help_blocker') {
        await interaction.deferReply({ ephemeral: true });
        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        const updated = await impedimentService.assignHelper(interaction.values[0]!, user.id);
        await interaction.editReply({ content: updated ? `🤝 **Mão Amiga Concedida!** Você ofereceu suporte a **<@${updated.user.discord_id}>**. (+25 XP Prosocial)` : '❌ Não foi possível atribuir ajuda a este impedimento.' });
        return;
      }

      if (interaction.customId === 'select_resolve_blocker') {
        await interaction.deferReply({ ephemeral: true });
        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        const resolved = await impedimentService.resolveImpediment(interaction.values[0]!, user.id);
        await interaction.editReply({ content: resolved ? '✅ **Obstáculo Resolvido!** Você ajudou a desobstruir a expedição da guilda.' : '❌ Não foi possível resolver este impedimento.' });
        return;
      }

      if (interaction.customId === 'select_guild_menu') {
        const val = interaction.values[0];
        if (val === 'ceremony_planning') return startPlanningThread(interaction);
        if (val === 'ceremony_review') return showSprintReviewModal(interaction);
        if (val === 'ceremony_retro') return startRetroThread(interaction);
        if (val === 'view_leaderboard') return showLeaderboard(interaction);
        if (val === 'view_mascot') return showMascotStatus(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_daily_form') {
        await interaction.deferReply({ ephemeral: true });
        const done = interaction.fields.getTextInputValue('daily_done');
        const todo = interaction.fields.getTextInputValue('daily_todo');
        const blockers = interaction.fields.getTextInputValue('daily_blockers');

        const { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();
        if (!project) return void await interaction.editReply({ content: '❌ **Nenhum projeto encontrado!** O líder precisa configurar o servidor com `/bomb setup` primeiro.' });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        if (!(await userService.isMemberOfProject(user.id, project.id))) {
          return void await interaction.editReply({ content: `🔒 **Acesso Negado!** Você ainda não faz parte da guilda **${project.name}**.\nEntre utilizando o comando \`/bomb join <senha>\` com a senha fornecida pelo líder!` });
        }

        const result = await processDailySubmission({ client: interaction.client, projectId: project.id, guildId: interaction.guildId!, channelId: interaction.channelId!, discordUserId: interaction.user.id, userDisplayName: displayName, done, todo, blockers });
        await interaction.editReply({ content: `🎉 **Daily Enviada com Sucesso!**\n⚡ **+${result.earnedXp} XP** | 🎴 Card: **${result.drawnCard.name}** | Streak: 🔥 **${result.newStreak} dias**` });
        return;
      }

      if (interaction.customId.startsWith('modal_setup_daily_')) {
        const channelId = interaction.customId.replace('modal_setup_daily_', '');
        const dailyTime = interaction.fields.getTextInputValue('daily_time') || '09:00';
        const timezone = interaction.fields.getTextInputValue('timezone') || 'America/Sao_Paulo';
        const sprintDuration = parseInt(interaction.fields.getTextInputValue('sprint_duration')) || 14;
        const weekdays = interaction.fields.getTextInputValue('weekdays') || '1,2,3,4,5';
        const rawCode = interaction.fields.getTextInputValue('access_code');
        const accessCode = rawCode?.trim() ? rawCode.trim().toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();

        await interaction.deferReply({ ephemeral: true });
        let { data: project } = await supabase.from('projects').select('*').eq('guild_id', interaction.guildId).maybeSingle();

        if (!project) {
          const { data: newP } = await supabase.from('projects').insert({ guild_id: interaction.guildId, name: interaction.guild?.name || 'Projeto Guilda', channel_id: channelId, daily_time: dailyTime, timezone, daily_period: 2, sprint_duration: sprintDuration, weekdays, access_code: accessCode }).select().single();
          project = newP;
        } else {
          await supabase.from('projects').update({ channel_id: channelId, daily_time: dailyTime, timezone, daily_period: 2, sprint_duration: sprintDuration, weekdays, access_code: accessCode }).eq('id', project.id);
        }

        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        await userService.addMemberToProject(user.id, project.id).catch(() => {});

        const mascotSelect = new StringSelectMenuBuilder().setCustomId(`setup_mascot_select_${project.id}`).setPlaceholder('Escolha a God Beast (Mascote da Guilda)').addOptions(
          (Object.values(MASCOT_REGISTRY) as any[]).map((m: any) => new StringSelectMenuOptionBuilder().setLabel(`${m.icon} ${m.name}`).setDescription(`${m.auraInfo}`).setValue(m.type))
        );

        await interaction.editReply({ content: '⚙️ **Wizard de Configuração do BOMB (Passo 3/3)**\nAgora escolha qual é a **God Beast** (Mascote) oficial do projeto:', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(mascotSelect)] });
        return;
      }

      if (interaction.customId.startsWith('modal_retro_add_')) {
        const category = interaction.customId.replace('modal_retro_add_', '') as RetroCategory;
        const content = interaction.fields.getTextInputValue('retro_content').trim();

        await interaction.deferReply({ ephemeral: true });
        const project = await projectService.getProjectByGuild(interaction.guildId!);
        if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda encontrada neste servidor.' });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const activeSprint = await sprintService.getActiveSprint(project.id);
        const sprintId = activeSprint?.id;

        await planningService.addRetroItem(project.id, user.id, category, content, sprintId);
        const xpEarned = category === 'action_item' ? 25 : 15;

        await interaction.editReply({ content: `✅ **Item adicionado à Retrospectiva com sucesso!** 💡\n⚡ **+${xpEarned} XP** concedidos pela sua contribuição!` });
        return;
      }

      if (interaction.customId === 'modal_planning_add_task') {
        await interaction.deferReply({ ephemeral: true });
        const title = interaction.fields.getTextInputValue('task_title').trim();
        const points = parseInt(interaction.fields.getTextInputValue('task_points')) || 1;
        const description = interaction.fields.getTextInputValue('task_desc') || undefined;

        const project = await projectService.getProjectByGuild(interaction.guildId!);
        if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda encontrada neste servidor.' });

        const displayName = interaction.user.displayName || interaction.user.username;
        const { user } = await userService.getOrCreateUser(interaction.user.id, displayName);

        const activeSprint = await sprintService.getActiveSprint(project.id);
        const sprintId = activeSprint?.id;

        const task = await planningService.createTask(project.id, user.id, title, description, points, undefined, sprintId);
        await interaction.editReply({ content: `📌 **Tarefa Criada com Sucesso!**\n**${task.title}** (${task.points} pts)` });
        return;
      }

      if (interaction.customId.startsWith('finish_project_modal_')) {
        const projectId = interaction.customId.replace('finish_project_modal_', '');
        const description = interaction.fields.getTextInputValue('description');
        const icon = interaction.fields.getTextInputValue('icon') || '🏆';

        await interaction.deferReply();
        const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
        if (!project) return void await interaction.editReply({ content: '❌ Projeto não encontrado.' });

        const members = await userService.getProjectMembers(projectId);
        for (const member of members) {
          await userService.awardBadge(member.id, project.name, description, icon).catch(() => {});
        }

        const embed = new EmbedBuilder().setTitle(`🏆 EXPEDIÇÃO CONCLUÍDA COM SUCESSO: ${project.name.toUpperCase()}`).setDescription(
          `🎉 **A expedição foi oficialmente encerrada com louvor!**\n\n📜 **Relatório das Conquistas da Guilda:**\n*${description}*\n\n🏅 **Troféu Concedido:** ${icon} a todos os **${members.length}** integrante(s)!\n*As insígnias de honra já estão disponíveis nos perfis dos aventureiros (\`/bomb profile\`).*`
        ).setColor('#F1C40F');

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (interaction.customId === 'modal_add_blocker') {
        await interaction.deferReply({ ephemeral: true });
        const blockerDesc = interaction.fields.getTextInputValue('blocker_desc');
        const project = await projectService.getProjectByGuild(interaction.guildId!);
        if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda ativa encontrada.' });

        const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
        await impedimentService.recordStandupBlocker(user.id, project.id, null, blockerDesc);
        await interaction.editReply({ content: '🚧 **Obstáculo Registrado!** Seu impedimento foi adicionado ao Painel de Blockers da guilda.' });
        return;
      }

      if (interaction.customId === 'modal_discreet_help') {
        const note = interaction.fields.getTextInputValue('help_note');
        await interaction.reply({ content: `🖐️ **Mão Amiga Solicitada!** Seu pedido de suporte foi cadastrado discretamente ("${note}"). Um companheiro de guilda responderá em breve! (+15 XP de Resiliência)`, ephemeral: true });
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
  const createInput = (id: string, label: string, place: string, req: boolean) =>
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(place).setStyle(TextInputStyle.Paragraph).setRequired(req));

  const modal = new ModalBuilder().setCustomId('modal_daily_form').setTitle('📜 Daily Assíncrona — Relatório Diário').addComponents(
    createInput('daily_done', 'O que você fez desde a última daily?', 'Ex: Concluí o layout da Dashboard e testes unitários...', true),
    createInput('daily_todo', 'O que você pretende fazer hoje?', 'Ex: Integrar API de autenticação no backend...', true),
    createInput('daily_blockers', 'Existe algum impedimento / blocker?', 'Ex: Nenhum (ou descreva o problema se estiver travado)...', false)
  );

  await interaction.showModal(modal);
}

async function showDiscreetHelpModal(interaction: any, prefilledContent?: string) {
  const noteInput = new TextInputBuilder().setCustomId('help_note').setLabel('Descreva brevemente em que precisa de ajuda').setValue(prefilledContent ? `Relacionado a: ${prefilledContent.substring(0, 80)}` : '').setPlaceholder('Ex: Estou com dúvidas na configuração da rota no backend...').setStyle(TextInputStyle.Paragraph).setRequired(true);
  const modal = new ModalBuilder().setCustomId('modal_discreet_help').setTitle('🖐️ Mão Amiga — Pedido de Suporte Discreto').addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
  await interaction.showModal(modal);
}

async function showAddBlockerModal(interaction: any) {
  const descInput = new TextInputBuilder().setCustomId('blocker_desc').setLabel('Descreva o que está travando o seu avanço').setPlaceholder('Ex: Aguardando liberação de acesso às chaves de API...').setStyle(TextInputStyle.Paragraph).setRequired(true);
  const modal = new ModalBuilder().setCustomId('modal_add_blocker').setTitle('🚧 Relatar Novo Obstáculo / Blocker').addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(descInput));
  await interaction.showModal(modal);
}

async function showOfferHelpSelectMenu(interaction: any) {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.reply({ content: '❌ Projeto não encontrado neste servidor.', ephemeral: true });

  const activeImpediments = await impedimentService.getActiveImpediments(project.id);
  const helpCandidates = activeImpediments.filter(i => i.status === 'active');
  if (helpCandidates.length === 0) return void await interaction.reply({ content: '✨ Nenhum obstáculo ativo precisando de ajuda no momento!', ephemeral: true });

  const select = new StringSelectMenuBuilder().setCustomId('select_help_blocker').setPlaceholder('Escolha um obstáculo para ajudar...').addOptions(
    helpCandidates.map(imp => new StringSelectMenuOptionBuilder().setLabel(`🔴 ${imp.user?.display_name || 'Membro'}: "${imp.description.substring(0, 50)}"`).setDescription(`Block streak: ${imp.block_streak} dia(s)`).setValue(imp.id))
  );

  await interaction.reply({ content: '🤝 **Escolha qual obstáculo você deseja assumir para ajudar:**', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
}

async function showResolveBlockerSelectMenu(interaction: any) {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.reply({ content: '❌ Projeto não encontrado neste servidor.', ephemeral: true });

  const activeImpediments = await impedimentService.getActiveImpediments(project.id);
  if (activeImpediments.length === 0) return void await interaction.reply({ content: '✨ Nenhum obstáculo ativo para resolver!', ephemeral: true });

  const select = new StringSelectMenuBuilder().setCustomId('select_resolve_blocker').setPlaceholder('Escolha o obstáculo resolvido...').addOptions(
    activeImpediments.map(imp => new StringSelectMenuOptionBuilder().setLabel(`🚧 ${imp.user?.display_name || 'Membro'}: "${imp.description.substring(0, 50)}"`).setDescription(`Status: ${imp.status}`).setValue(imp.id))
  );

  await interaction.reply({ content: '✅ **Selecione qual obstáculo foi desbloqueado/resolvido:**', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)], ephemeral: true });
}

async function showBlockersDashboard(interaction: any, viewOption: 'leader' | 'member' = 'leader') {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.reply({ content: '❌ Nenhuma guilda foi fundada neste servidor ainda.', ephemeral: true });

  const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
  const impediments = await impedimentService.getActiveImpediments(project.id);
  const stats = await impedimentService.getProjectImpedimentStats(project.id, impediments);

  const embed = viewOption === 'member' ? buildMemberViewEmbed(project, user, impediments) : buildLeaderViewEmbed(project, impediments, stats);
  const components = buildDashboardActionRows(viewOption, impediments, user.id);

  if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [embed], components });
  else await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

async function showUserProfileAndCards(interaction: any) {
  const { data: dbUser } = await supabase.from('users').select('*').eq('discord_id', interaction.user.id).maybeSingle();
  const embed = new EmbedBuilder().setTitle(`🧙 FICHA DE HERÓI: ${interaction.user.username}`).setDescription(
    `**Classe RPG:** 🍀 ${dbUser?.character_class || 'Gobbo'}\n**Nível:** Lv. ${dbUser?.level || 1}\n**XP Acumulado:** ⚡ ${dbUser?.xp || 0} XP\n**Sequência Ativa:** 🔥 ${dbUser?.streak || 0} dias`
  ).setColor('#9B59B6');

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function startPlanningThread(interaction: any) {
  const channel = interaction.channel as TextChannel;
  if (channel?.threads) {
    const thread = await channel.threads.create({ name: `🗺️-sprint-planning-${Date.now().toString().slice(-4)}`, autoArchiveDuration: 60, reason: 'Thread de Sprint Planning do BOMB' });
    await thread.send('🗺️ **Sprint Planning Iniciado!** Adicionem as tarefas e estimativas da expedição nesta thread.');
    await interaction.reply({ content: `✅ Thread de Planning criada: <#${thread.id}>`, ephemeral: true });
  } else {
    await interaction.reply({ content: '❌ As threads não estão habilitadas neste canal.', ephemeral: true });
  }
}

async function startRetroThread(interaction: any) {
  const channel = interaction.channel as TextChannel;
  if (channel?.threads) {
    const thread = await channel.threads.create({ name: `💡-retrospectiva-${Date.now().toString().slice(-4)}`, autoArchiveDuration: 60, reason: 'Thread de Retrospectiva do BOMB' });
    const retroEmbed = new EmbedBuilder().setTitle('💡 MURAL DE RETROSPECTIVA DA GUILDA').setDescription('Clique nos botões abaixo para enviar seus pontos de feedback!').setColor('#F1C40F');
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

async function showRetroAddModal(interaction: any, category: RetroCategory) {
  const titles: Record<string, string> = {
    went_well: '🟢 Retrospectiva — O que funcionou?',
    to_improve: '🔴 Retrospectiva — O que ajustar?',
    action_item: '💡 Retrospectiva — Nova Ação / Ideia'
  };
  const placeholders: Record<string, string> = {
    went_well: 'Ex: As dailies assíncronas ajudaram o time a manter foco...',
    to_improve: 'Ex: Precisamos organizar melhor os testes antes da entrega...',
    action_item: 'Ex: Criar um template padrão para PRs...'
  };

  const modal = new ModalBuilder()
    .setCustomId(`modal_retro_add_${category}`)
    .setTitle(titles[category] || '💡 Retrospectiva da Expedição')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('retro_content')
          .setLabel('Seu feedback para a Retrospectiva')
          .setPlaceholder(placeholders[category] || 'Escreva aqui seu ponto de vista...')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);
}

async function showPlanningAddTaskModal(interaction: any) {
  const modal = new ModalBuilder()
    .setCustomId('modal_planning_add_task')
    .setTitle('📌 Criar Nova Tarefa de Expedição')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('task_title').setLabel('Título da Tarefa').setPlaceholder('Ex: Implementar autenticação via OAuth2').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('task_points').setLabel('Pontos de História (1-13)').setValue('1').setPlaceholder('Ex: 1, 2, 3, 5, 8').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('task_desc').setLabel('Descrição da Tarefa (Opcional)').setPlaceholder('Detalhes adicionais ou critérios de aceite...').setStyle(TextInputStyle.Paragraph).setRequired(false)
      )
    );

  await interaction.showModal(modal);
}

async function handlePlanningOfferHelp(interaction: any) {
  await interaction.deferReply({ ephemeral: true });
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda encontrada neste servidor.' });

  const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
  await planningService.offerDiscreetHelp(project.id, user.id);
  await interaction.editReply({ content: '🖐️ **Mão amiga estendida!** (+25 XP Prosocial concedidos). Seus companheiros podem solicitar seu suporte!' });
}

async function handlePlanningRequestHelp(interaction: any) {
  await interaction.deferReply({ ephemeral: true });
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda encontrada neste servidor.' });

  const { user } = await userService.getOrCreateUser(interaction.user.id, interaction.user.displayName || interaction.user.username);
  const helpers = (await planningService.getActiveHelpers(project.id)).filter(h => h.helper_id !== user.id);
  if (!helpers.length) return void await interaction.editReply({ content: '❌ Nenhum companheiro com a mão estendida no momento.' });

  const chosen = helpers[Math.floor(Math.random() * helpers.length)]!;
  await planningService.requestDiscreetHelp(chosen.id, user.id);
  await interaction.editReply({ content: `🤝 **Matching de Suporte Realizado!**\n<@${chosen.helper.discord_id}> (${chosen.helper.display_name}) está disponível para te ajudar!` });
}

async function showSprintReviewModal(interaction: any) {
  await interaction.deferReply({ ephemeral: true });
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.editReply({ content: '❌ Nenhuma guilda encontrada.' });

  const activeSprint = await sprintService.getActiveSprint(project.id);
  const sprintId = activeSprint?.id, sprintNum = activeSprint ? activeSprint.number : "Geral";

  const result = await planningService.concludeSprintReview(project.id, sprintId, "Revisão efetuada via Mesa da Guilda");
  const xpLines = result.awardedUsers.length > 0
      ? result.awardedUsers.map(u => `⭐ **${u.name}:** +${u.xp} XP acumulados`)
      : ["*Nenhum XP de tarefa atribuído nesta revisão.*"];

  const embed = new EmbedBuilder()
      .setTitle(`🎉  Revisão de Expedição Concluída (Sprint #${sprintNum})!`)
      .setDescription([
          `📊 **Resumo da Revisão de Entregas & Rituais** — **${project.name}**`, "",
          `• Tarefas Concluídas: **${result.summary.completedTasks}/${result.summary.totalTasks}** (${result.summary.taskCompletionRate}%)`,
          `• Pontos de História: **${result.summary.completedPoints}/${result.summary.totalPoints} pts**`, "",
          `🌟 **XP Concedido aos Aventureiros:**`, ...xpLines, "",
          `✨ *Parabéns à guilda pelas entregas!*`
      ].join("\n"))
      .setColor('#F1C40F');

  await interaction.editReply({ embeds: [embed] });
}

async function showLeaderboard(interaction: any) {
  const { data: topUsers } = await supabase.from('users').select('*').order('xp', { ascending: false }).limit(5);
  let leaderboardText = '🏆 **RANKING DA GUILDA (TOP 5):**\n\n';
  if (topUsers?.length) {
    topUsers.forEach((u, idx) => {
      leaderboardText += `${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'} **${u.display_name}** — Lv. ${u.level} (⚡ ${u.xp} XP)\n`;
    });
  } else leaderboardText += 'Nenhum participante pontuou ainda.';

  await interaction.reply({ content: leaderboardText, ephemeral: true });
}

async function showMascotStatus(interaction: any) {
  const project = await projectService.getProjectByGuild(interaction.guildId!);
  if (!project) return void await interaction.reply({ content: '❌ Nenhuma guilda configurada.', ephemeral: true });

  const mascot = await MascotService.getOrCreateMascot(project.id);
  await interaction.reply({ content: MascotService.renderMascotBanner(mascot), ephemeral: true });
}

async function showFullGuideEmbed(interaction: any) {
  const guideEmbed = new EmbedBuilder().setTitle('💣 BOMB — GUIA DE COMANDOS & FLUXO DA GUILDA').setDescription(
    `O **BOMB** é o assistente gamificado de Scrum/XP no Discord. Confira a ordem recomendada de comandos para evoluir com seu time:\n\n` +
    `### 🔑 1. Entrar na Guilda (\`/bomb join <senha>\` ou \`/join\`)\n• Entre na guilda com a senha do projeto fornecida pelo seu líder.\n\n` +
    `### 🧪 2. Perfil Motivacional (\`/hexad\`)\n• Descubra seu perfil motivacional (Hexad) e receba a recomendação de classe RPG ideal.\n\n` +
    `### 🧙 3. Classe RPG & Passivas (\`/bomb class\` ou \`/classe\`)\n• Escolha ou evolua entre 6 classes (**Gobbo**, **Spearman**, **Mooladin**, **Healer**, **Beast Tamer**, **Scissorpaw**).\n\n` +
    `### 📜 4. Daily Assíncrona (\`/bomb daily\` ou \`/daily\`)\n• Envie seu relatório diário, ganhe **XP**, cause **Dano no Boss da Sprint** e colecione **Cards**.\n\n` +
    `### 🗺️ 5. Sprint Planning (\`/bomb planning\` ou \`/planning\`)\n• Crie tarefas, atribua estimativas de pontos e agende os rituais da expedição.\n\n` +
    `### 📊 6. Sprint Review (\`/bomb review\` ou \`/review\`)\n• Revise entregas e rituais ao final da expedição para distribuir bônus de XP.\n\n` +
    `### 💡 7. Retrospectiva (\`/bomb retro\` ou \`/retrospective\`)\n• Registre pontos positivos, melhorias e planos de ação para evoluir o time.\n\n` +
    `### ⚔️ 8. Outros Comandos Úteis\n` +
    `• **/bomb status** — Painel central e status da expedição ativa.\n` +
    `• **/bomb profile** — Ficha de herói, nível, XP e álbum de cards.\n` +
    `• **/leaderboard** — Hall dos Campeões da guilda.\n` +
    `• **/blockers** — Central de acompanhamento e resolução de impedimentos.`
  ).setColor('#5865F2').setFooter({ text: 'BOMB RPG Scrum • Use /help_me pedir_ajuda:true para solicitar suporte discreto aos teammates!' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_hand_help_open').setLabel('Pedir Suporte Discreto').setEmoji('🖐️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_daily_open').setLabel('Responder Daily').setEmoji('📜').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_profile_cards').setLabel('Ver Ficha & Cards').setEmoji('🧙').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [guideEmbed], components: [row], ephemeral: true });
}
