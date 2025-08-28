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
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot({
      animations: 'disabled',
      fullPage: true
    });
  });
});
