import { describe, it, expect } from "vitest";
import { getRandomSprintAndBoss, SPRINT_BOSS_PRESETS } from "../src/utils/sprintNames.js";
import type { Language } from "../src/i18n/types.js";

describe("Sprint Names & Boss Presets", () => {
    const languages: Language[] = ["pt", "en", "es", "de-CH", "no"];

    it("should contain non-empty presets for all supported languages", () => {
        for (const lang of languages) {
            const presets = SPRINT_BOSS_PRESETS[lang];
            expect(presets).toBeDefined();
            expect(presets.length).toBeGreaterThan(0);
            for (const pair of presets) {
                expect(pair.sprintName).toBeTruthy();
                expect(pair.bossName).toBeTruthy();
            }
        }
    });

    it("should return a valid random sprint and boss pair for Portuguese", () => {
        const pair = getRandomSprintAndBoss("pt");
        expect(pair).toBeDefined();
        expect(pair.sprintName).toBeTruthy();
        expect(pair.bossName).toBeTruthy();
        expect(SPRINT_BOSS_PRESETS.pt.some(p => p.sprintName === pair.sprintName)).toBe(true);
    });

    it("should return a valid random sprint and boss pair for English", () => {
        const pair = getRandomSprintAndBoss("en");
        expect(pair).toBeDefined();
        expect(pair.sprintName).toBeTruthy();
        expect(pair.bossName).toBeTruthy();
        expect(SPRINT_BOSS_PRESETS.en.some(p => p.sprintName === pair.sprintName)).toBe(true);
    });

    it("should fallback to Portuguese if language is invalid or undefined", () => {
        const pair = getRandomSprintAndBoss("invalid" as any);
        expect(pair).toBeDefined();
        expect(pair.sprintName).toBeTruthy();
        expect(pair.bossName).toBeTruthy();
        expect(SPRINT_BOSS_PRESETS.pt.some(p => p.sprintName === pair.sprintName)).toBe(true);
    });
});
