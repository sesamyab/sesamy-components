import { describe, it, expect } from 'vitest';
import init from '../i18n';
import { getPeriodLabel, getPeriodTexts } from './period';
import type { PaywallSubscription } from '../types/Paywall';

const en = init('en');
const sv = init('sv');
const cs = init('cs');
const pl = init('pl');

const subscription = (overrides: Partial<PaywallSubscription> = {}): PaywallSubscription => ({
  id: 'sub_1',
  sku: 'sku_1',
  poId: 'po_1',
  selected: true,
  price: 199,
  periodText: 'typed',
  comparePeriodText: 'typed compare',
  ...overrides
});

describe('getPeriodLabel', () => {
  it.each([
    [{ period: 'month', time: 1 }, 'month', 'månad'],
    [{ period: 'month', time: 2 }, '2 months', '2 månader'],
    [{ period: 'month', time: 3 }, 'quarter', 'kvartal'],
    [{ period: 'quarter', time: 1 }, 'quarter', 'kvartal'],
    [{ period: 'quarter', time: 2 }, 'half year', 'halvår'],
    [{ period: 'month', time: 6 }, 'half year', 'halvår'],
    [{ period: 'year', time: 1 }, 'year', 'år'],
    [{ period: 'week', time: 2 }, '2 weeks', '2 veckor'],
    [{ period: 'day', time: 30 }, '30 days', '30 dagar']
  ] as const)('%o → %s / %s', (period, enLabel, svLabel) => {
    expect(getPeriodLabel(period, en)).toBe(enLabel);
    expect(getPeriodLabel(period, sv)).toBe(svLabel);
  });

  it.each([
    [cs, 'year', 2, '2 roky'],
    [cs, 'year', 5, '5 let'],
    [cs, 'week', 2, '2 týdny'],
    [cs, 'week', 5, '5 týdnů'],
    [pl, 'month', 2, '2 miesiące'],
    [pl, 'month', 5, '5 miesięcy'],
    [pl, 'year', 2, '2 lata'],
    [pl, 'year', 5, '5 lat'],
    [pl, 'year', 12, '12 lat'],
    [pl, 'year', 22, '22 lata']
  ] as const)('%#: %s %i → %s', (t, period, time, label) => {
    expect(getPeriodLabel({ period, time }, t)).toBe(label);
  });
});

describe('getPeriodTexts', () => {
  it('keeps the typed texts for MANUAL and unset priceMode', () => {
    const periods = { pricePeriod: { period: 'year', time: 1 } } as const;
    for (const priceMode of ['MANUAL', undefined] as const) {
      expect(
        getPeriodTexts(subscription({ priceMode, discountPrice: 99, ...periods }), en)
      ).toEqual({ headline: 'typed', regular: 'typed compare' });
    }
  });

  it('formats AUTOMATIC discount and regular periods', () => {
    const texts = getPeriodTexts(
      subscription({
        priceMode: 'AUTOMATIC',
        discountPrice: 99,
        discountPeriod: { period: 'month', time: 3 },
        pricePeriod: { period: 'month', time: 1 }
      }),
      sv
    );
    expect(texts).toEqual({ headline: 'kvartal', regular: 'månad' });
  });

  it('appends the discount duration when it spans several periods', () => {
    const texts = getPeriodTexts(
      subscription({
        priceMode: 'AUTOMATIC',
        discountPrice: 99,
        discountPeriod: { period: 'month', time: 1 },
        discountMonths: 3,
        pricePeriod: { period: 'month', time: 1 }
      }),
      en
    );
    expect(texts).toEqual({ headline: 'month, first 3 months', regular: 'month' });
  });

  it('leaves out a one-month discount duration', () => {
    const texts = getPeriodTexts(
      subscription({
        priceMode: 'AUTOMATIC',
        discountPrice: 99,
        discountPeriod: { period: 'week', time: 1 },
        discountMonths: 1,
        pricePeriod: { period: 'week', time: 1 }
      }),
      en
    );
    expect(texts.headline).toBe('week');
  });

  it('uses the price period for both lines without a discount', () => {
    const texts = getPeriodTexts(
      subscription({ priceMode: 'AUTOMATIC', pricePeriod: { period: 'year', time: 1 } }),
      en
    );
    expect(texts).toEqual({ headline: 'year', regular: 'year' });
  });

  it('falls back to the typed texts when AUTOMATIC has no periods', () => {
    expect(getPeriodTexts(subscription({ priceMode: 'AUTOMATIC' }), en)).toEqual({
      headline: 'typed',
      regular: 'typed'
    });
  });
});
