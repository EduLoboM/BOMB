<div align="center">

# 💣 BOMB

**Zero-Friction Async Scrum & Passive RPG Gamification for Discord Teams.**

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Languages](https://img.shields.io/badge/i18n-PT--EN--ES--CH--NO-F59E0B?style=for-the-badge)](src/i18n)
[![License](https://img.shields.io/badge/License-GPL--3.0-EF4444?style=for-the-badge)](LICENSE)

---

**BOMB** automates daily standups, sprint tracking, and agile ceremonies for technology teams (junior enterprises, university projects, and squads) with a **passive RPG adventure system**. 

No text commands required during daily routines: members interact directly via **1-Click Buttons, Modals, and Interactive Messages**.

[Getting Started](#-getting-started) · [Commands & Context Menus](#-commands--context-menus) · [The Guild Table](#-the-guild-table-hub) · [RPG Gamification](#-passive-rpg-gamification) · [Languages](#-multi-language-support)

</div>

---

## 🎯 Why BOMB Exists (Zero-Friction UX)

Traditional agile tools introduce **bureaucratic friction**—developers have to remember command syntaxes, fill out tedious web forms, or engage in cold daily pings.

**BOMB eliminates psychological load:**
- **Zero-Command Routine:** Developers never type commands to submit dailies or check stats.
- **The Guild Table Hub:** A single fixed message in your server channel displays Sprint completion %, Boss HP, Mascot level, and member status (`🟢/🔴/🟡`).
- **Discreet Peer Support ("Mão Amiga"):** A safe environment to ask for help without public shame or fear tax.
- **Passive Gamification:** XP, Class Passives, Boss Damage, and Collectible Cards are awarded automatically upon daily submission.

---

## ⌨️ Commands & Context Menus

BOMB consolidates 15+ legacy commands into **3 core Slash Commands** and **2 Native Context Menus**:

```
                       ┌─────────────────────────────────────────┐
                       │          CORE APPLICATION ENTRY         │
                       └────────────────────┬────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
 ┌──────────────┐                   ┌──────────────┐                   ┌──────────────┐
 │    /bomb     │                   │    /daily    │                   │   /help_me   │
 ├──────────────┤                   ├──────────────┤                   ├──────────────┤
 │ Hub & Setup  │                   │ Direct Modal │                   │ Complete Guide│
 │ Guild Table  │                   │  Form Open   │                   │ & Support    │
 └──────────────┘                   └──────────────┘                   └──────────────┘
```

### Slash Commands

| Command | Subcommands / Options | Who | Description |
| :--- | :--- | :--- | :--- |
| `/bomb` | `table` | Anyone | Displays or pins the interactive **Guild Table** hub in the channel |
| `/bomb` | `setup` | Leader | Starts the 1-click **Setup Wizard** (Channel, Sprint, Mascot, Roles) |
| `/daily` | None | Anyone | Opens the native **Daily Standup Modal** form instantly |
| `/help_me` | `[duvida]` (optional) | Anyone | Displays the **Complete Guild Manual Guide** or requests discreet support |

### Native App Context Menus (Right-Click)

| Context Menu Name | Target | Action |
| :--- | :--- | :--- |
| `🖐️ Solicitar Mão Amiga` | Message / User | Right-click any message or user $\rightarrow$ `Apps` $\rightarrow$ Request discreet support |
| `🖐️ Oferecer Mão Amiga` | User | Right-click any teammate $\rightarrow$ `Apps` $\rightarrow$ Offer support (+25 Prosocial XP) |

---

## 🛡️ The Guild Table Hub

The **Guild Table** is a dynamic, persistent message pin in your project channel (`#bomb-guilda`) rendered with vibrant **ANSI color blocks**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 🛡️ BOMB - MESA DA GUILDA | SPRINT #04 - "CAVERNA DOS BUGS"                 │
├───────────────────────────────────────────────────────────────────────────┤
│ STATUS DA EXPEDIÇÃO (SPRINT #04)                                           │
│ [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░] 65% Coletivo                                     │
│                                                                           │
│ 👾 BOSS DE SPRINT: DRAGÃO DOS BUGS PENDENTES                               │
│ HP: [██████████████░░░░░░░░░░░░] 1.400 / 3.000 HP                         │
│                                                                           │
│ 🐾 MASCOTE DA GUILDA: FUSCA TRANSFORMER (Lv. 3)                            │
│ Aura Ativa: +25% XP em Dailies Matutinas                                  │
│                                                                           │
│ 📜 DAILIES DE HOJE (5/8 Concluídas)                                       │
│ 🟢 @lucas  🟢 @ana  🟢 @marcos  🟡 @pedro (Pendente)  🔴 @carla (Impedida) │
├───────────────────────────────────────────────────────────────────────────┤
│ [ 📜 Responder Daily ]  [ 🖐️ Mão Amiga ]  [ 🛡️ Blockers ]  [ 🧙 Ficha ]  │
├───────────────────────────────────────────────────────────────────────────┤
│ [ 🗺️ Selecionar Cerimônia / Atalho de Ação...                        ▼ ] │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Resilient Debounced Updates:** Built-in queue (`guildTableQueueService`) batches concurrent submissions to prevent Discord HTTP 429 Rate Limits.
- **Ephemeral Responses:** Clicking `[ 🧙 Ficha & Cards ]` or checking stats returns a private response only visible to you.

---

## 🎲 Passive RPG Gamification

Developers don't "play" the bot; **the bot plays around the developer's routine**:

1. **Adventurer Classes & Passives:** Choose from 6 base lines (**Gobbo**, **Spearman**, **Healer**, **Beast Tamer**, **Mooladin**, **Scissorpaw**) that unlock passives (Early Bird XP, Blocker Shields, Critical XP rolls).
2. **Guild Mascots & Auras:** Leaders equip team pets (e.g. *Fusca Transformer*, *Filhote de Esfinge*) that boost global server XP.
3. **Collectible Card Pack Drops:** Every daily submission awards a card envelope (Common, Rare, Epic, Shiny).
4. **Web Dashboard Ready (Supabase JSONB):** All submissions store raw JSON payloads (`raw_payload JSONB`) for future Web API integration.

---

## 🌐 Multi-Language Support

BOMB natively supports 5 languages with automatic project fallback:

- 🇧🇷 **Português** (`pt`)
- 🇺🇸 **English** (`en`)
- 🇪🇸 **Español** (`es`)
- 🇨🇭 **Schwiizertütsch** (`de-CH`)
- 🇳🇴 **Norsk** (`no`)

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** $\ge 18$
- A [Discord Bot Token](https://discord.com/developers/applications)
- A [Supabase](https://supabase.com) PostgreSQL database

### Environment Setup (`.env`)

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
```

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Apply database migrations & deploy slash commands
npm run migration
npm run deploy

# 3. Start development bot
npm run dev

# 4. Run unit tests
npm test
```

---

## 📜 License

Distributed under the [GPL-3.0 License](LICENSE).