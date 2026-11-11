import { test, expect } from '@playwright/test';
import { getStoryUrl } from './utils';

const storybookUrl = 'http://localhost:8080';

/**
 * An offer page is a public article with the paywall inside it. Under unified
 * content access a public article always grants access, and from 2.31 until
 * 2.34.1 the paywall hid itself because of that and rendered empty. The story
 * fakes sesamy-js (public page, unified access, access granted) and serves the
 * paywall settings itself, so this needs no backend.
 */
test('the paywall shows its plans on a public page under unified access', async ({ page }) => {
  const hosts = new Set<string>();
  page.on('request', (request) => hosts.add(new URL(request.url()).host));

  await page.goto(getStoryUrl(storybookUrl, 'components-paywall--public-page-unified-access'));

  const paywall = page.locator('sesamy-paywall');
  await expect(paywall.getByText('Offer page monthly plan')).toBeVisible();
  await expect(paywall.getByText('Offer page yearly plan')).toBeVisible();
  await expect(paywall.getByRole('button').first()).toBeVisible();

  console.log(`hosts requested: ${[...hosts].sort().join(', ')}`);
});
