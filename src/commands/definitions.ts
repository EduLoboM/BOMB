import { 
  SlashCommandBuilder, 
  ContextMenuCommandBuilder, 
  ApplicationCommandType, 
  PermissionFlagsBits 
} from 'discord.js';

export const bombCommand = new SlashCommandBuilder()
  .setName('bomb')
  .setDescription('Mesa da Guilda e Painel de Controle Central do BOMB')
  .addSubcommand(sub => 
    sub.setName('table')
       .setDescription('Exibe ou afixa a Mesa da Guilda no canal do projeto')
  )
  .addSubcommand(sub => 
    sub.setName('setup')
       .setDescription('Inicia o fluxo interativo de configuração inicial do projeto (Apenas Líderes)')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export const dailyCommand = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Abre instantaneamente o formulário modal da sua Daily diária');

export const helpMeCommand = new SlashCommandBuilder()
  .setName('help_me')
  .setDescription('Guia completo do BOMB e suporte discreto da Mão Amiga')
  .addStringOption(opt =>
    opt.setName('duvida')
       .setDescription('Descreva em que precisa de suporte (ou deixe em branco para ver o Guia Completo)')
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
  dailyCommand,
  helpMeCommand,
  messageHelpContextCommand,
  userHelpContextCommand
];
