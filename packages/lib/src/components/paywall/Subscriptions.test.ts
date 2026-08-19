import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Subscriptions from './Subscriptions.svelte';
import type { PaywallSubscription } from '../../types/Paywall';

const subscription = (overrides: Partial<PaywallSubscription> = {}): PaywallSubscription => ({
  id: 'sub_1',
  sku: 'sku_1',
  poId: 'po_1',
  title: 'Premium',
  selected: true,
  price: 199,
  discountPrice: 99,
  periodText: '3 måneder',
  ...overrides
});

const renderSubscriptions = (subscriptions: PaywallSubscription[], horizontal: boolean) =>
  render(Subscriptions, {
    props: {
      t: (key: string) => key,
      horizontal,
      subscriptions,
      currency: 'NOK',
      selectProduct: () => {},
      redirectUrl: 'https://example.com'
    }
  });

afterEach(cleanup);

describe.each([
  { name: 'article template', horizontal: false },
  { name: 'boxes template', horizontal: true }
])('Subscriptions ($name)', ({ horizontal }) => {
  const priceLines = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('div'))
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim())
      .filter((text): text is string => !!text && /^\d+ NOK/.test(text));

  it('renders comparePeriodText on the struck-through regular price', () => {
    const { container } = renderSubscriptions(
      [subscription({ comparePeriodText: 'måned' })],
      horizontal
    );

    expect(priceLines(container)).toEqual(
      expect.arrayContaining(['99 NOK / 3 måneder', '199 NOK / måned'])
    );
  });

  it('falls back to periodText when comparePeriodText is not set', () => {
    const { container } = renderSubscriptions([subscription()], horizontal);

    expect(priceLines(container)).toEqual(
      expect.arrayContaining(['99 NOK / 3 måneder', '199 NOK / 3 måneder'])
    );
  });

  it('keeps periodText on the regular price when there is no discount', () => {
    const { container } = renderSubscriptions(
      [subscription({ discountPrice: undefined, comparePeriodText: 'måned' })],
      horizontal
    );

    const lines = priceLines(container);
    expect(lines).toEqual(expect.arrayContaining(['199 NOK / 3 måneder']));
    expect(lines.join(' | ')).not.toContain('/ måned');
  });
});
