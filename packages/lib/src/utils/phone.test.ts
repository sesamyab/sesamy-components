import { describe, expect, it } from 'vitest';
import { formatPhoneNumber, parsePhoneNumber } from './phone';

describe('parsePhoneNumber', () => {
  it('returns null for empty input', () => {
    expect(parsePhoneNumber('', 'SE')).toEqual({ value: null, valid: false, country: 'SE' });
    expect(parsePhoneNumber(' - ', 'SE')).toEqual({ value: null, valid: false, country: 'SE' });
  });

  it('strips the national prefix', () => {
    expect(parsePhoneNumber('070-123 45 67', 'SE')).toEqual({
      value: '+46701234567',
      valid: true,
      country: 'SE'
    });
    expect(parsePhoneNumber('07700 900123', 'GB')).toMatchObject({
      value: '+447700900123',
      valid: true
    });
  });

  it('accepts national numbers typed without the prefix', () => {
    expect(parsePhoneNumber('70 123 45 67', 'SE')).toMatchObject({
      value: '+46701234567',
      valid: true
    });
  });

  it('keeps the leading zero in countries without a national prefix', () => {
    expect(parsePhoneNumber('06 1234 5678', 'IT')).toMatchObject({
      value: '+390612345678',
      valid: true
    });
  });

  it('handles countries without a national prefix', () => {
    expect(parsePhoneNumber('412 34 567', 'NO')).toMatchObject({
      value: '+4741234567',
      valid: true
    });
    expect(parsePhoneNumber('20 12 34 56', 'DK')).toMatchObject({
      value: '+4520123456',
      valid: true
    });
  });

  it('flags numbers with an impossible length', () => {
    expect(parsePhoneNumber('070 12', 'SE')).toMatchObject({ value: '+467012', valid: false });
    expect(parsePhoneNumber('412 34 5678', 'NO')).toMatchObject({ valid: false });
  });

  it('parses international format and detects the country', () => {
    expect(parsePhoneNumber('+47 412 34 567', 'SE')).toEqual({
      value: '+4741234567',
      valid: true,
      country: 'NO'
    });
    expect(parsePhoneNumber('0046 70 123 45 67', 'NO')).toEqual({
      value: '+46701234567',
      valid: true,
      country: 'SE'
    });
  });

  it('prefers the selected country when calling codes are shared', () => {
    expect(parsePhoneNumber('+1 416 555 0123', 'CA')).toMatchObject({ country: 'CA', valid: true });
    expect(parsePhoneNumber('+1 212 555 0123', 'US')).toMatchObject({ country: 'US', valid: true });
  });

  it('keeps the detected country for an incomplete international number', () => {
    expect(parsePhoneNumber('+47 41', 'SE')).toEqual({
      value: '+4741',
      valid: false,
      country: 'NO'
    });
  });
});

describe('parsePhoneNumber for shared calling codes', () => {
  it('picks the main country, not the first alphabetically', () => {
    expect(parsePhoneNumber('+358 40 1234567', 'SE')).toMatchObject({ country: 'FI' });
    expect(parsePhoneNumber('+7 912 345 67 89', 'SE')).toMatchObject({ country: 'RU' });
    expect(parsePhoneNumber('+1 212 555 0123', 'SE')).toMatchObject({ country: 'US' });
  });

  it('has no value when only the national prefix is typed', () => {
    expect(parsePhoneNumber('0', 'SE')).toEqual({ value: null, valid: false, country: 'SE' });
  });
});

describe('parsePhoneNumber with libphonenumber-js', async () => {
  const lib = await import('libphonenumber-js/max');

  it('validates against the numbering plan, not just the length', () => {
    expect(parsePhoneNumber('070-123 45 67', 'SE', lib)).toEqual({
      value: '+46701234567',
      valid: true,
      country: 'SE'
    });
    // The right length for Sweden, but no Swedish numbers start with 99
    expect(parsePhoneNumber('099 999 99 99', 'SE')).toMatchObject({ valid: true });
    expect(parsePhoneNumber('099 999 99 99', 'SE', lib)).toMatchObject({ valid: false });
  });

  it('detects the country of an international number', () => {
    expect(parsePhoneNumber('+47 412 34 567', 'SE', lib)).toEqual({
      value: '+4741234567',
      valid: true,
      country: 'NO'
    });
  });

  it('accepts 00 as the exit code whatever the selected country', () => {
    // The US exit code is 011, so libphonenumber alone would read this as a national number
    expect(parsePhoneNumber('0046 70 123 45 67', 'US', lib)).toEqual({
      value: '+46701234567',
      valid: true,
      country: 'SE'
    });
  });

  it('falls back to the basic result for input it cannot parse', () => {
    expect(parsePhoneNumber('0', 'SE', lib)).toMatchObject({ valid: false });
    expect(parsePhoneNumber('', 'SE', lib)).toEqual({ value: null, valid: false, country: 'SE' });
  });
});

describe('formatPhoneNumber', async () => {
  const lib = await import('libphonenumber-js/max');

  it('formats as the number is typed', () => {
    expect(formatPhoneNumber('0701234567', 'SE', lib)).toBe('070-123 45 67');
    expect(formatPhoneNumber('+4741234567', 'SE', lib)).toBe('+47 41 23 45 67');
  });
});
