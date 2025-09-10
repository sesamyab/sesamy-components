import { test, expect } from '@playwright/test';
import { filterStories, navigate } from './utils';
import manifest from '../storybook-static/index.json' assert { type: 'json' };

const storybookUrl = 'localhost:8080';

test.beforeEach(async ({ page }, meta) => {
  /**
   * Set the viewport size and other global level browser settings here.
   */
  await page.setViewportSize({ width: 1280, height: 800 });
});

const visualStories = filterStories(Object.values(manifest.entries));

visualStories.forEach((story) => {
  test(story.id, async ({ page }, meta) => {
    await navigate(page, storybookUrl, meta.title);
    await expect(page).toHaveScreenshot({
      animations: 'disabled',
      fullPage: true
    });

    if (story.id === 'components-paywall--article') {
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.selectOption('select[name="country"]', { label: 'Sweden' });
      await expect(page.getByRole('button', { name: 'Pay now' })).toBeVisible();
      await expect(page).toHaveScreenshot(`${story.id}-step2.png`, {
        animations: 'disabled',
        fullPage: true
      });
    }
  });
});
