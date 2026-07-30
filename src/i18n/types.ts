export type Language = 'pt' | 'en' | 'es' | 'de-CH' | 'no';

export interface LanguageInfo {
    code: Language;
    name: string;
    flag: string;
}

export type TranslationKey = string;
