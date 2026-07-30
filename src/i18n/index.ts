import type { Language, LanguageInfo } from "./types.js";
import { pt } from "./locales/pt.js";
import { en } from "./locales/en.js";
import { es } from "./locales/es.js";
import { deCH } from "./locales/de-CH.js";
import { no } from "./locales/no.js";

export type { Language, LanguageInfo };

export const SUPPORTED_LANGUAGES: Record<Language, LanguageInfo> = {
    pt: { code: "pt", name: "Português", flag: "🇧🇷" },
    en: { code: "en", name: "English", flag: "🇺🇸" },
    es: { code: "es", name: "Español", flag: "🇪🇸" },
    "de-CH": { code: "de-CH", name: "Schwiizertütsch (Suíço)", flag: "🇨🇭" },
    no: { code: "no", name: "Norsk (Norueguês)", flag: "🇳🇴" }
};

export const LOCALES = {
    pt,
    en,
    es,
    "de-CH": deCH,
    no
} as const;

export function isValidLanguage(lang: string): lang is Language {
    return Object.keys(SUPPORTED_LANGUAGES).includes(lang);
}

export function t(
    keyPath: string,
    lang: Language = "pt",
    params?: Record<string, string | number>
): string {
    const localeDict = LOCALES[lang] || pt;
    const keys = keyPath.split(".");
    
    let current: any = localeDict;
    for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
            current = current[key];
        } else {
            current = undefined;
            break;
        }
    }

    if (typeof current !== "string") {
        let fallback: any = pt;
        for (const key of keys) {
            if (fallback && typeof fallback === "object" && key in fallback) {
                fallback = fallback[key];
            } else {
                return keyPath;
            }
        }
        current = typeof fallback === "string" ? fallback : keyPath;
    }

    if (params) {
        let result = current as string;
        for (const [paramKey, paramVal] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        }
        return result;
    }

    return current;
}
