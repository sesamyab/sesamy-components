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

export type TranslationComponents = {
  [key: string]: (text: string) => string;
};

export interface TranslationFunction {
  (key: Key, components?: TranslationComponents): string;
}

export type SupportedLanguage = keyof typeof languages;

function interpolateComponents(text: string, components?: TranslationComponents): string {
  if (!components) return text;

  // Replace component tags like <0>text</0> with the component wrapper
  return text.replace(/<(\d+)>(.*?)<\/\1>/g, (_, index, content) => {
    const componentKey = index.toString();
    if (components[componentKey]) {
      return components[componentKey](content);
    }
    return content;
  });
}

export default function init(langAttribute: SupportedLanguage): TranslationFunction {
  const lang = languages[langAttribute] ? langAttribute : 'en';
  return (key: Key, components?: TranslationComponents) => {
    const translation = languages[lang]?.[key] || key;
    return interpolateComponents(translation, components);
  };
}
