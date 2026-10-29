# SES-1751: render AUTOMATIC paywall periods from structured data

Tier: M. User-facing price display on every paywall; not money-moving (checkout charges from its own data), so not L.

## Requirement → mechanism

- AUTOMATIC subscriptions show periods in the paywall's language, worded as checkout → `utils/period.ts` `getPeriodLabel`, a port of checkout-v3 `getPeriodLabel` (month×3 → quarter, month×6 → half year, "N months"), plus `period: 'quarter'` normalised to months.
- Headline / struck-through lines → `getPeriodTexts`: headline = `discountPeriod ?? pricePeriod`, struck = `pricePeriod` (paywall-api.md consumer contract).
- Discount longer than one period (`discountMonths`) → ", first N months" suffix on the headline. New key in 8 languages.
- MANUAL / no priceMode / missing periods → unchanged typed `periodText` / `comparePeriodText`.
- Translations → flat `timeperiod_*` keys in `locales/*/default.json`, values copied from checkout-v3 `timeperiods.*`.

## Decisions (approved by manager)

- trialDays deferred: no wording exists in checkout or mailer.
- No shared package; copy the checkout formatter.

## Tests

`utils/period.test.ts` (labels sv/en, mode fallbacks), one AUTOMATIC case in `Subscriptions.test.ts`.

## Expected size

~40 production lines + 88 translation lines.
