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

const resolveKey = (obj: any, keys: string[]) => keys.reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);

export function t(
    keyPath: string,
    lang: Language = "pt",
    params?: Record<string, string | number>
): string {
    const keys = keyPath.split(".");
    let res = resolveKey(LOCALES[lang] || pt, keys) ?? resolveKey(pt, keys);
    if (typeof res !== "string") return keyPath;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            res = (res as string).replaceAll(`{${k}}`, String(v));
        });
    }
    return res;
}

