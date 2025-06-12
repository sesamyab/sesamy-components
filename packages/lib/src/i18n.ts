import cs from './locales/cs/default.json';
import en from './locales/en/default.json';
import fi from './locales/fi/default.json';
import it from './locales/it/default.json';
import nb from './locales/nb/default.json';
import pl from './locales/pl/default.json';
import sv from './locales/sv/default.json';
import da from './locales/da/default.json';

export type Key = keyof typeof en;
type Languages = { [lang: string]: { [key in Key]: string } };

const languages: Languages = {
  cs,
  en,
  fi,
  it,
  nb,
  pl,
  sv,
  da
};

export interface TranslationFunction {
  (key: Key): string;
  lang?: SupportedLanguage;
}

export type SupportedLanguage = keyof typeof languages;

export default function init(langAttribute: SupportedLanguage): TranslationFunction {
  const lang = languages[langAttribute] ? langAttribute : 'en';
  return (key: Key, language?: SupportedLanguage) => languages[language || lang]?.[key] || key;
}
