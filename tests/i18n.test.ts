import { describe, it, expect } from "vitest";
import { t, isValidLanguage, SUPPORTED_LANGUAGES, LOCALES, Language } from "../src/i18n/index.js";

describe("i18n Internationalization System", () => {
    it("should support all required 5 languages (pt, en, es, de-CH, no)", () => {
        const languages: Language[] = ["pt", "en", "es", "de-CH", "no"];
        
        for (const lang of languages) {
            expect(SUPPORTED_LANGUAGES[lang]).toBeDefined();
            expect(SUPPORTED_LANGUAGES[lang].code).toBe(lang);
            expect(SUPPORTED_LANGUAGES[lang].name).toBeDefined();
            expect(SUPPORTED_LANGUAGES[lang].flag).toBeDefined();
            expect(LOCALES[lang]).toBeDefined();
        }
    });

    it("should correctly validate language codes", () => {
        expect(isValidLanguage("pt")).toBe(true);
        expect(isValidLanguage("en")).toBe(true);
        expect(isValidLanguage("es")).toBe(true);
        expect(isValidLanguage("de-CH")).toBe(true);
        expect(isValidLanguage("no")).toBe(true);

        expect(isValidLanguage("fr")).toBe(false);
        expect(isValidLanguage("invalid")).toBe(false);
    });

    it("should return correct translated strings for all 5 languages", () => {
        expect(t("common.success", "pt")).toBe("Sucesso");
        expect(t("common.success", "en")).toBe("Success");
        expect(t("common.success", "es")).toBe("Éxito");
        expect(t("common.success", "de-CH")).toBe("Erfolg");
        expect(t("common.success", "no")).toBe("Suksess");
    });

    it("should correctly interpolate parameters in translations across all languages", () => {
        const languages: Language[] = ["pt", "en", "es", "de-CH", "no"];
        const params = { language: "TestLang" };

        for (const lang of languages) {
            const res = t("language.updated", lang, params);
            expect(res).toContain("TestLang");
        }
    });

    it("should translate daily standup headers and titles in all 5 languages", () => {
        const date = "2026-07-30";
        
        expect(t("daily.journalTitle", "pt", { date })).toContain("Diário da Expedição");
        expect(t("daily.journalTitle", "en", { date })).toContain("Expedition Journal");
        expect(t("daily.journalTitle", "es", { date })).toContain("Diario de la Expedición");
        expect(t("daily.journalTitle", "de-CH", { date })).toContain("Expeditions-Tagebuch");
        expect(t("daily.journalTitle", "no", { date })).toContain("Ekspedisjonsdagbok");
    });

    it("should fallback gracefully for missing keys or invalid languages", () => {
        expect(t("non.existent.key", "pt")).toBe("non.existent.key");
        expect(t("common.success", "invalid" as any)).toBe("Sucesso");
    });
});
