import { countryCodes } from '../constants/countries';

function getCountryNameByCountryCode(countryCode: string, locale = 'en') {
  const countryName = new Intl.DisplayNames(locale, { type: 'region' });

  return countryName.of(countryCode.toUpperCase());
}

function getAvailableCountryCodes() {
  return countryCodes;
}

/**
 * It converts country codes to options ready to consume by a select input. It orders the countries
 * alphabetically by name.
 *
 */
function getCountriesOptions(locale = 'en'): { label: string; value: string }[] {
  return getAvailableCountryCodes()
    .map((countryCode) => ({
      value: countryCode,
      label: getCountryNameByCountryCode(countryCode, locale) || ''
    }))
    .sort((a, b) => {
      // Sort countries alphabetically by their label
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }

      return 0;
    });
}

export { getCountryNameByCountryCode, getAvailableCountryCodes, getCountriesOptions };
