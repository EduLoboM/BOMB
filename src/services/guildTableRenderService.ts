import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  codeBlock
} from 'discord.js';
import { supabase } from '../supabase.js';

interface ProjectGuildData {
  project: any;
  mascot: any;
  sprint: any;
  members: any[];
  todayDailies: any[];
  activeBlockers: any[];
}

export async function fetchGuildTableData(projectId: string): Promise<ProjectGuildData | null> {
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!project) return null;

  const { data: mascot } = await supabase.from('mascots').select('*').eq('project_id', projectId).maybeSingle();
  
  const { data: sprints } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('number', { ascending: false })
    .limit(1);
  const sprint = sprints && sprints.length > 0 ? sprints[0] : null;

  const { data: memberRel } = await supabase
    .from('project_members')
    .select('users(*)')
    .eq('project_id', projectId);
  const members = memberRel ? memberRel.map((m: any) => m.users).filter(Boolean) : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayDailies } = await supabase
    .from('dailies')
    .select('*')
    .eq('project_id', projectId)
    .gte('submitted_at', `${todayStr}T00:00:00.000Z`);

  const { data: activeBlockers } = await supabase
    .from('impediments')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active');

  return {
    project,
    mascot: mascot || { name: 'Fusca Transformer', level: 1, xp: 0, active_aura: '+25% XP Dailies Matutinas' },
    sprint: sprint || { number: 1, start_date: todayStr, end_date: todayStr },
    members,
    todayDailies: todayDailies || [],
    activeBlockers: activeBlockers || []
  };
}

export function renderGuildTableEmbed(data: ProjectGuildData) {
  const { project, mascot, sprint, members, todayDailies, activeBlockers } = data;

  const totalMembers = Math.max(members.length, 1);
  const totalTargetDailies = totalMembers * (project.sprint_duration || 10);
  const completedDailiesCount = todayDailies.length;
  const sprintProgressPercent = Math.min(Math.round((completedDailiesCount / totalTargetDailies) * 100), 100);

  const progressBarLength = 15;
  const filledBlocks = Math.round((sprintProgressPercent / 100) * progressBarLength);
  const sprintBar = '▓'.repeat(filledBlocks) + '░'.repeat(progressBarLength - filledBlocks);

  const totalBossHp = totalTargetDailies * 100;
  const currentDamage = completedDailiesCount * 100;
  const remainingHp = Math.max(totalBossHp - currentDamage, 0);
  const bossHpPercent = Math.round((remainingHp / Math.max(totalBossHp, 1)) * 100);
  const bossFilledBlocks = Math.round((bossHpPercent / 100) * progressBarLength);
  const bossBar = '█'.repeat(bossFilledBlocks) + '░'.repeat(progressBarLength - bossFilledBlocks);

  const ansiText = 
`\u001b[1;33mSTATUS DA EXPEDIÇÃO (SPRINT #${sprint.number || 1})\u001b[0m
\u001b[1;30m[${sprintBar}]\u001b[0m ${sprintProgressPercent}% Progresso Coletivo

\u001b[1;31m👾 BOSS DE SPRINT: DRAGÃO DOS BUGS PENDENTES\u001b[0m
HP: \u001b[1;31m[${bossBar}]\u001b[0m ${remainingHp.toLocaleString()} / ${totalBossHp.toLocaleString()} HP

\u001b[1;36m🐾 MASCOTE DA GUILDA: ${mascot.name || 'Mascote'} (Nível ${mascot.level || 1})\u001b[0m
Aura Ativa: \u001b[1;32m${mascot.active_aura || '+25% XP em Dailies'}\u001b[0m

\u001b[1;35m📜 STATUS DAS DAILIES DE HOJE (${completedDailiesCount}/${members.length})\u001b[0m`;

  const memberStatuses = members.map(m => {
    const hasSubmitted = todayDailies.some(d => d.user_id === m.id);
    const hasBlocker = activeBlockers.some(b => b.user_id === m.id);

    if (hasBlocker) return `🔴 ${m.display_name} (Impedimento Ativo 🖐️)`;
    if (hasSubmitted) return `🟢 ${m.display_name}`;
    return `🟡 ${m.display_name}`;
  });

  const memberStatusFormatted = memberStatuses.length > 0 
    ? memberStatuses.join('  •  ') 
    : 'Nenhum membro cadastrado ainda.';

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ BOMB — MESA DA GUILDA | ${project.name.toUpperCase()}`)
    .setDescription(codeBlock('ansi', ansiText) + `\n**Integrantes do Time:**\n${memberStatusFormatted}`)
    .setColor('#5865F2')
    .setFooter({ text: '💡 Dica: Clique nos botões abaixo para interagir sem digitar comandos!' })
    .setTimestamp();

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_daily_open')
      .setLabel('Responder Daily')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('btn_hand_help_open')
      .setLabel('Mão Amiga')
      .setEmoji('🖐️')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('btn_blockers_view')
      .setLabel('Blockers')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('btn_profile_cards')
      .setLabel('Ficha & Cards')
      .setEmoji('🧙')
      .setStyle(ButtonStyle.Secondary)
  );

  const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_guild_menu')
      .setPlaceholder('🗺️ Acessar Cerimônias & Recursos da Guilda...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Sprint Planning')
          .setDescription('Criar thread temporária e gerenciar tarefas da sprint')
          .setValue('ceremony_planning')
          .setEmoji('🗺️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Sprint Review')
          .setDescription('Finalizar entregas e calcular bônus da expedição')
          .setValue('ceremony_review')
          .setEmoji('📊'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Retrospectiva')
          .setDescription('Mural interativo de votação e melhorias da guilda')
          .setValue('ceremony_retro')
          .setEmoji('💡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Leaderboard & Conquistas')
          .setDescription('Ranking da guilda e insígnias da expedição')
          .setValue('view_leaderboard')
          .setEmoji('🏆'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Aura do Mascote')
          .setDescription('Ver status e evolução do Mascote da Guilda')
          .setValue('view_mascot')
          .setEmoji('🐾')
      )
  );

  return {
    embeds: [embed],
    components: [buttonRow, selectMenuRow]
  };
}
