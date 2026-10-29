import type { Key, TranslationFunction } from '../i18n';
import type { PaywallPeriod, PaywallSubscription } from '../types/Paywall';

// Worded as checkout-v3's getPeriodLabel: "month", "3 months", "quarter", "half year"
export const getPeriodLabel = ({ period, time }: PaywallPeriod, t: TranslationFunction) => {
  const unit = period === 'quarter' ? 'month' : period;
  const count = period === 'quarter' ? time * 3 : time;

  if (unit === 'month' && count === 3) return t('timeperiod_quarter');
  if (unit === 'month' && count === 6) return t('timeperiod_half_year');
  if (count > 1) return `${count} ${getPluralUnit(unit, count, t)}`;
  return t(`timeperiod_${unit}` as const);
};

// cs and pl inflect 5+ differently from 2-4 ("2 roky", "5 let"); only they define the _many keys
const getPluralUnit = (unit: string, count: number, t: TranslationFunction) => {
  const category = new Intl.PluralRules(t.lang).select(count);
  const manyKey = `timeperiod_${unit}s_many` as Key;
  const many = category === 'many' || category === 'other' ? t(manyKey) : manyKey;
  return many !== manyKey ? many : t(`timeperiod_${unit}s` as Key);
};

// AUTOMATIC subscriptions get their periods from paywall-api; everything else keeps the typed text
export const getPeriodTexts = (subscription: PaywallSubscription, t: TranslationFunction) => {
  const { priceMode, pricePeriod, discountPeriod, discountMonths, discountPrice } = subscription;
  const { periodText, comparePeriodText } = subscription;
  const hasDiscountPrice = typeof discountPrice === 'number';
  const automatic = priceMode === 'AUTOMATIC';

  const headlinePeriod = automatic
    ? (hasDiscountPrice && discountPeriod) || pricePeriod
    : undefined;
  let headline = headlinePeriod ? getPeriodLabel(headlinePeriod, t) : periodText;
  if (headlinePeriod && hasDiscountPrice && (discountMonths ?? 0) > 1) {
    headline = `${headline}, ${t('timeperiod_first_months').replace('{{count}}', String(discountMonths))}`;
  }

  const regular =
    automatic && pricePeriod
      ? getPeriodLabel(pricePeriod, t)
      : (hasDiscountPrice && comparePeriodText) || periodText;

  return { headline, regular };
};
