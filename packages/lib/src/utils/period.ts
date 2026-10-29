import type { TranslationFunction } from '../i18n';
import type { PaywallPeriod, PaywallSubscription } from '../types/Paywall';

// Worded as checkout-v3's getPeriodLabel: "month", "3 months", "quarter", "half year"
export const getPeriodLabel = ({ period, time }: PaywallPeriod, t: TranslationFunction) => {
  const unit = period === 'quarter' ? 'month' : period;
  const count = period === 'quarter' ? time * 3 : time;

  if (unit === 'month' && count === 3) return t('timeperiod_quarter');
  if (unit === 'month' && count === 6) return t('timeperiod_half_year');
  if (count > 1) return `${count} ${t(`timeperiod_${unit}s` as const)}`;
  return t(`timeperiod_${unit}` as const);
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
  if (headlinePeriod && hasDiscountPrice && discountMonths) {
    headline = `${headline}, ${t('timeperiod_first_months').replace('{{count}}', String(discountMonths))}`;
  }

  const regular =
    automatic && pricePeriod
      ? getPeriodLabel(pricePeriod, t)
      : (hasDiscountPrice && comparePeriodText) || periodText;

  return { headline, regular };
};
