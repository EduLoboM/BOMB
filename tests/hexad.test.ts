import { vi, describe, it, expect } from "vitest";
import { gamificationService, HEXAD_REGISTRY, CLASS_REGISTRY } from "../src/services/gamificationService.js";
import type { HexadProfile } from "../src/types.js";

vi.mock("../src/supabase.js", () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

describe("Marczewski Hexad Gamification Science", () => {
    it("has valid mappings for all 6 Hexad player types in HEXAD_REGISTRY", () => {
        const profiles: HexadProfile[] = ["Philanthropist", "Socialiser", "FreeSpirit", "Achiever", "Player", "Disruptor"];
        for (const p of profiles) {
            const info = HEXAD_REGISTRY[p];
            expect(info).toBeDefined();
            expect(info.profile).toBe(p);
            expect(info.recommendedClass).toBeDefined();
            expect(CLASS_REGISTRY[info.recommendedClass]).toBeDefined();
        }
    });

    it("associates every RPG class in CLASS_REGISTRY with a valid Hexad profile", () => {
        for (const [className, classDef] of Object.entries(CLASS_REGISTRY)) {
            expect(classDef.hexadProfile).toBeDefined();
            expect(classDef.hexadIcon).toBeDefined();
            expect(classDef.hexadTitle).toBeDefined();
            expect(["Philanthropist", "Socialiser", "FreeSpirit", "Achiever", "Player", "Disruptor"]).toContain(classDef.hexadProfile);
        }
    });

    it("calculates correct top Hexad profile from quiz answers", () => {
        expect(gamificationService.calculateHexadFromAnswers("purpose", "purpose", "purpose")).toBe("Philanthropist");
        expect(gamificationService.calculateHexadFromAnswers("social", "social", "social")).toBe("Socialiser");
        expect(gamificationService.calculateHexadFromAnswers("autonomy", "autonomy", "autonomy")).toBe("FreeSpirit");
        expect(gamificationService.calculateHexadFromAnswers("mastery", "mastery", "mastery")).toBe("Achiever");
        expect(gamificationService.calculateHexadFromAnswers("rewards", "rewards", "rewards")).toBe("Player");
        expect(gamificationService.calculateHexadFromAnswers("disrupt", "disrupt", "disrupt")).toBe("Disruptor");
    });
});
