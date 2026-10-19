import type { CountryCode } from 'libphonenumber-js/max';
import { phonePlans } from '../constants/phone-plans';
import type { PhoneLib } from './phone-lib';

export type ParsedPhoneNumber = {
  /** E.164 formatted number, e.g. `+46701234567`, or `null` when nothing was entered */
  value: string | null;
  /** Whether the number has a plausible length for its country. The server does full validation. */
  valid: boolean;
  /**
   * The country the number belongs to. The selected country, unless the number is typed in
   * international format with another calling code; then the main country for that code.
   */
  country: string;
};

export const phoneCountryCodes = Object.keys(phonePlans);

export function getCallingCode(country: string) {
  return phonePlans[country]?.[0] ?? '';
}

function isPossibleLength(country: string, nationalNumber: string) {
  return phonePlans[country]?.[2].includes(nationalNumber.length) ?? false;
}

/**
 * The digits after the exit code when the input is written in international format
 * (`+46 70…` or `0046 70…` gives `4670…`), or `null` for a national number.
 */
export function getInternationalDigits(input: string): string | null {
  const match = /^\s*(\+|00)(.*)$/.exec(input);
  return match ? match[2].replace(/\D/g, '') : null;
}

/**
 * The country for a number in international format: the selected country when the calling
 * code matches (so +1 keeps CA selected), otherwise the main country for the code, which
 * phonePlans lists first.
 */
function getInternationalCountry(digits: string, selectedCountry: string) {
  return (
    [selectedCountry, ...phoneCountryCodes].find((country) => {
      const callingCode = getCallingCode(country);
      return callingCode && digits.startsWith(callingCode);
    }) ?? selectedCountry
  );
}

function parseInternational(digits: string, selectedCountry: string): ParsedPhoneNumber {
  const country = getInternationalCountry(digits, selectedCountry);
  const callingCode = getCallingCode(country);
  return {
    value: `+${digits}`,
    valid:
      digits.startsWith(callingCode) && isPossibleLength(country, digits.slice(callingCode.length)),
    country
  };
}

/**
 * Turns what the user typed into an E.164 number. Accepts national format (`070-123 45 67`)
 * for the selected country, or international format (`+46 70 123 45 67`, `0046...`).
 *
 * Without `lib` only the length is checked. With libphonenumber-js loaded the number is
 * fully validated against the country's numbering plan.
 */
export function parsePhoneNumber(
  input: string,
  selectedCountry: string,
  lib?: typeof PhoneLib | null
): ParsedPhoneNumber {
  const basic = parseBasic(input, selectedCountry);
  if (!lib || !basic.value) return basic;

  // libphonenumber only accepts the selected country's own exit code (011 in the US), so pass
  // international numbers with + to treat `0046…` the same as without the library
  const internationalDigits = getInternationalDigits(input);
  const normalized = internationalDigits === null ? input : `+${internationalDigits}`;
  const phone = lib.parsePhoneNumberFromString(normalized, selectedCountry as CountryCode);
  // The country comes from the basic parse in both cases, so it doesn't depend on whether
  // the library has loaded (libphonenumber would e.g. move +1 416 numbers from US to CA)
  if (!phone) return { ...basic, valid: false };
  return { value: phone.number, valid: phone.isValid(), country: basic.country };
}

/** Formats a partially typed number the way it is usually written in the country. */
export function formatPhoneNumber(input: string, selectedCountry: string, lib: typeof PhoneLib) {
  return new lib.AsYouType(selectedCountry as CountryCode).input(input);
}

function parseBasic(input: string, selectedCountry: string): ParsedPhoneNumber {
  const digits = input.replace(/\D/g, '');
  if (!digits) return { value: null, valid: false, country: selectedCountry };

  const internationalDigits = getInternationalDigits(input);
  if (internationalDigits !== null) {
    return internationalDigits
      ? parseInternational(internationalDigits, selectedCountry)
      : { value: null, valid: false, country: selectedCountry };
  }

  const [callingCode = '', nationalPrefix = ''] = phonePlans[selectedCountry] ?? [];
  let nationalNumber = digits;
  if (nationalPrefix && digits.startsWith(nationalPrefix)) {
    const stripped = digits.slice(nationalPrefix.length);
    // Keep the digits as-is only when they form a complete number without the prefix
    // stripped, e.g. a Russian number starting with 8 typed without its national prefix
    const unstrippedIsNumber =
      isPossibleLength(selectedCountry, digits) && !isPossibleLength(selectedCountry, stripped);
    if (!unstrippedIsNumber) nationalNumber = stripped;
  }
  // Only the national prefix typed so far, e.g. `0`: there is no number yet
  if (!nationalNumber) return { value: null, valid: false, country: selectedCountry };

  return {
    value: `+${callingCode}${nationalNumber}`,
    valid: isPossibleLength(selectedCountry, nationalNumber),
    country: selectedCountry
  };
}
