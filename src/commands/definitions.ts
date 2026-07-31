import { 
  SlashCommandBuilder, 
  ContextMenuCommandBuilder, 
  ApplicationCommandType, 
  PermissionFlagsBits 
} from 'discord.js';

export const bombCommand = new SlashCommandBuilder()
  .setName('bomb')
  .setDescription('Mesa da Guilda e Painel de Controle Central do BOMB');

export const setupCommand = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Inicia o fluxo interativo de configuração inicial do projeto (Apenas Líderes)');

export const joinCommand = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Entra na guilda utilizando a senha do projeto')
  .addStringOption(opt => opt.setName('code').setDescription('Senha / código de acesso da guilda').setRequired(true));

export const classCommandDef = new SlashCommandBuilder()
  .setName('class')
  .setDescription('Exibe o Santuário e menu dropdown para escolher ou evoluir sua classe RPG')
  .addStringOption(opt => opt.setName('select').setDescription('Nome da classe desejada (opcional)').setRequired(false));

export const classeCommandDef = new SlashCommandBuilder()
  .setName('classe')
  .setDescription('Exibe o Santuário e menu dropdown para escolher ou evoluir sua classe RPG')
  .addStringOption(opt => opt.setName('select').setDescription('Nome da classe desejada (opcional)').setRequired(false));

export const dailyCommand = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Abre instantaneamente o formulário modal da sua Daily diária');

export const blockersCommandDef = new SlashCommandBuilder()
  .setName('blockers')
  .setDescription('Painel de acompanhamento e remoção de impedimentos da guilda')
  .addStringOption(opt => opt.setName('view').setDescription('Visão do painel').addChoices(
    { name: 'Líder', value: 'leader' },
    { name: 'Membro', value: 'member' }
  ));

export const tableCommand = new SlashCommandBuilder()
  .setName('table')
  .setDescription('Exibe ou afixa a Mesa da Guilda no canal do projeto');

export const profileCommandDef = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Exibe sua Ficha de Herói e Álbum de Cards Colecionáveis');

export const leaderboardCommandDef = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Exibe o ranking de XP e expedições da guilda');

export const statusCommand = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Exibe o status geral do projeto e integrantes ativos');

export const planningCommandDef = new SlashCommandBuilder()
  .setName('planning')
  .setDescription('Inicia a thread de Sprint Planning');

export const reviewCommandDef = new SlashCommandBuilder()
  .setName('review')
  .setDescription('Executa a cerimônia de Sprint Review');

export const retroCommand = new SlashCommandBuilder()
  .setName('retro')
  .setDescription('Inicia a thread de Retrospectiva da Guilda');

export const finishCommand = new SlashCommandBuilder()
  .setName('finish')
  .setDescription('Encerra e arquiva a expedição/projeto atual (Apenas Líderes)');

export const languageCommand = new SlashCommandBuilder()
  .setName('language')
  .setDescription('Define o idioma padrão das mensagens da guilda')
  .addStringOption(opt => opt.setName('language').setDescription('Código do idioma (pt, en, es, de-CH, no)').setRequired(false).addChoices(
    { name: '🇧🇷 Português', value: 'pt' },
    { name: '🇺🇸 English', value: 'en' },
    { name: '🇪🇸 Español', value: 'es' },
    { name: '🇨🇭 Schwiizertütsch', value: 'de-CH' },
    { name: '🇳🇴 Norsk', value: 'no' }
  ));

export const helpMeCommand = new SlashCommandBuilder()
  .setName('help_me')
  .setDescription('Guia de comandos da guilda e suporte discreto da Mão Amiga')
  .addBooleanOption(opt =>
    opt.setName('pedir_ajuda')
       .setDescription('Deseja enviar um pedido de ajuda aos companheiros de guilda? (Sim/Não)')
       .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('duvida')
       .setDescription('Descreva em que precisa de suporte (opcional caso peça ajuda)')
       .setRequired(false)
  );

export const messageHelpContextCommand = new ContextMenuCommandBuilder()
  .setName('🖐️ Solicitar Mão Amiga')
  .setType(ApplicationCommandType.Message);

export const userHelpContextCommand = new ContextMenuCommandBuilder()
  .setName('🖐️ Oferecer Mão Amiga')
  .setType(ApplicationCommandType.User);

export const allApplicationCommands = [
  bombCommand,
  setupCommand,
  joinCommand,
  classCommandDef,
  classeCommandDef,
  dailyCommand,
  blockersCommandDef,
  tableCommand,
  profileCommandDef,
  leaderboardCommandDef,
  statusCommand,
  planningCommandDef,
  reviewCommandDef,
  retroCommand,
  finishCommand,
  languageCommand,
  helpMeCommand,
  messageHelpContextCommand,
  userHelpContextCommand
];
