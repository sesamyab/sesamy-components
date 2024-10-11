import cs from './locales/cs/default.json';
import en from './locales/en/default.json';
import fi from './locales/fi/default.json';
import it from './locales/it/default.json';
import nb from './locales/nb/default.json';
import pl from './locales/pl/default.json';
import sv from './locales/sv/default.json';

export type Key = keyof typeof en;
type Languages = { [lang: string]: { [key in Key]: string } };

const languages: Languages = {
  cs,
  en,
  fi,
  it,
  nb,
  pl,
  sv
};

export interface TranslationFunction {
  (key: Key): string;
}

export default function init(language: string): TranslationFunction {
  return (key: Key) => languages[language][key];
}
