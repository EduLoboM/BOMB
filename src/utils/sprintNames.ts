import type { Language } from "../i18n/types.js";

export interface SprintBossPair {
    sprintName: string;
    bossName: string;
}

export const SPRINT_BOSS_PRESETS: Record<Language, SprintBossPair[]> = {
    pt: [
        { sprintName: "Caverna dos Bugs", bossName: "Dragão dos Bugs Pendentes" },
        { sprintName: "Pico do Legacy Code", bossName: "Golem de Código Espaguete" },
        { sprintName: "Abismo do Merge Conflict", bossName: "Hidra das Filas de PR" },
        { sprintName: "Vale do NullPointer", bossName: "Lich da Memória Vazada" },
        { sprintName: "Floresta da Dívida Técnica", bossName: "Besta da Refatoração" },
        { sprintName: "Masmorra do Deploy de Sexta", bossName: "Demônio da Quinta-Feira à Noite" }
    ],
    en: [
        { sprintName: "Bug Cave", bossName: "Pending Bugs Dragon" },
        { sprintName: "Legacy Code Peak", bossName: "Spaghetti Code Golem" },
        { sprintName: "Merge Conflict Abyss", bossName: "PR Queue Hydra" },
        { sprintName: "NullPointer Valley", bossName: "Memory Leak Lich" },
        { sprintName: "Technical Debt Forest", bossName: "Refactoring Beast" },
        { sprintName: "Friday Deploy Dungeon", bossName: "Thursday Night Demon" }
    ],
    es: [
        { sprintName: "Cueva de los Errores", bossName: "Dragón de Errores Pendientes" },
        { sprintName: "Cima del Código Legado", bossName: "Gólem de Código Espagueti" },
        { sprintName: "Abismo de Conflictos de Merge", bossName: "Hidra de la Cola de PR" },
        { sprintName: "Valle del NullPointer", bossName: "Lich de Fuga de Memoria" },
        { sprintName: "Bosque de la Deuda Técnica", bossName: "Bestia de la Refactorización" },
        { sprintName: "Mazmorra del Deploy de Viernes", bossName: "Demonio del Jueves por la Noche" }
    ],
    "de-CH": [
        { sprintName: "Bug-Höhle", bossName: "Drache der offene Bugs" },
        { sprintName: "Altcode-Gipfel", bossName: "Spaghetti-Code-Golem" },
        { sprintName: "Merge-Konflikt-Abgrund", bossName: "PR-Warteschlangen-Hydra" },
        { sprintName: "NullPointer-Tal", bossName: "Speicherleck-Lich" },
        { sprintName: "Tech-Schulden-Wald", bossName: "Refactoring-Bestie" },
        { sprintName: "Freitag-Deploy-Dungeon", bossName: "Donnerstag-Nacht-Dämon" }
    ],
    no: [
        { sprintName: "Bugg-hulen", bossName: "Dragen av Utestående Bugger" },
        { sprintName: "Gammelkode-toppen", bossName: "Spagettikode-Golem" },
        { sprintName: "Flette-konflikt-avgrunnen", bossName: "PR-kø-Hydra" },
        { sprintName: "NullPointer-dalen", bossName: "Minnedata-Lich" },
        { sprintName: "Teknisk gjeld-skogen", bossName: "Refaktorering-Beist" },
        { sprintName: "Fredag-Deploy-Fangehull", bossName: "Torsdagsnatt-Demon" }
    ]
};

export function getRandomSprintAndBoss(lang: Language = "pt"): SprintBossPair {
    const presets = SPRINT_BOSS_PRESETS[lang] || SPRINT_BOSS_PRESETS.pt;
    const randomIndex = Math.floor(Math.random() * presets.length);
    return presets[randomIndex]!;
}
