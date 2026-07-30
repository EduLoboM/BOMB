import { describe, it, expect, vi } from "vitest";
import { MascotService, MASCOT_REGISTRY } from "../src/services/mascotService.js";

describe("MascotService", () => {
    it("should contain registry for Fusca Transformer and Filhote de Esfinge", () => {
        expect(MASCOT_REGISTRY["Fusca Transformer"]).toBeDefined();
        expect(MASCOT_REGISTRY["Fusca Transformer"].name).toBe("Fusca Transformer");
        expect(MASCOT_REGISTRY["Filhote de Esfinge"]).toBeDefined();
        expect(MASCOT_REGISTRY["Filhote de Esfinge"].icon).toBe("👶");
    });

    it("should render mascot ANSI banner correctly", () => {
        const mockMascot = {
            id: "m1",
            project_id: "p1",
            type: "Fusca Transformer" as const,
            level: 1,
            xp: 20,
            name: "Fusca Enferrujado",
            current_mood: "Feliz",
            active_aura: "+25% XP em envios matutinos",
            updated_at: new Date().toISOString()
        };

        const banner = MascotService.renderMascotBanner(mockMascot);
        expect(banner).toContain("MASCOTE DA GUILDA: Fusca Enferrujado (Nível 1)");
        expect(banner).toContain("+25% XP em envios matutinos");
        expect(banner).toContain("20 / 100 XP (20%)");
    });
});
