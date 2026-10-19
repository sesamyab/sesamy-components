import type { CountryCode } from 'libphonenumber-js/max';
import { phonePlans } from '../constants/phone-plans';
import type { PhoneLib } from './phone-lib';

export type ParsedPhoneNumber = {
  /** E.164 formatted number, e.g. `+46701234567`, or `null` when nothing was entered */
  value: string | null;
  /** Whether the number has a plausible length for its country. The server does full validation. */
  valid: boolean;
  /** The country the number belongs to; differs from the selected one when typed in international format */
  country: string;
};

export const phoneCountryCodes = Object.keys(phonePlans);

export function getCallingCode(country: string) {
  return phonePlans[country]?.[0] ?? '';
}

function isPossibleLength(country: string, nationalNumber: string) {
  return phonePlans[country]?.[2].includes(nationalNumber.length) ?? false;
}

function parseInternational(digits: string, selectedCountry: string): ParsedPhoneNumber {
  const value = `+${digits}`;
  // Prefer the selected country when the calling code matches (e.g. +1 for both US and CA)
  const candidates = [selectedCountry, ...phoneCountryCodes];
  for (const country of candidates) {
    const callingCode = getCallingCode(country);
    if (!callingCode || !digits.startsWith(callingCode)) continue;
    if (isPossibleLength(country, digits.slice(callingCode.length))) {
      return { value, valid: true, country };
    }
  }
  const country =
    candidates.find((c) => getCallingCode(c) && digits.startsWith(getCallingCode(c))) ??
    selectedCountry;
  return { value, valid: false, country };
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

  const phone = lib.parsePhoneNumberFromString(input, selectedCountry as CountryCode);
  if (!phone) return { ...basic, valid: false };
  return {
    value: phone.number,
    valid: phone.isValid(),
    country: phone.country ?? basic.country
  };
}

/** Formats a partially typed number the way it is usually written in the country. */
export function formatPhoneNumber(input: string, selectedCountry: string, lib: typeof PhoneLib) {
  return new lib.AsYouType(selectedCountry as CountryCode).input(input);
}

function parseBasic(input: string, selectedCountry: string): ParsedPhoneNumber {
  const digits = input.replace(/\D/g, '');
  if (!digits) return { value: null, valid: false, country: selectedCountry };

  if (input.trim().startsWith('+')) return parseInternational(digits, selectedCountry);
  if (digits.startsWith('00')) return parseInternational(digits.slice(2), selectedCountry);

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

  return {
    value: `+${callingCode}${nationalNumber}`,
    valid: isPossibleLength(selectedCountry, nationalNumber),
    country: selectedCountry
  };
}
