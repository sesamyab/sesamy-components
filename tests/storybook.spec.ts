import { test, expect } from '@playwright/test';
import { filterStories, navigate } from './utils';
import manifest from '../storybook-static/index.json' assert { type: 'json' };

const storybookUrl = 'localhost:8080';

test.beforeEach(async ({ page }, meta) => {
  /**
   * Set the viewport size and other global level browser settings here.
   * For example you may want to block certain resources, etc.
   */
  await page.setViewportSize({ width: 1280, height: 800 });

  await navigate(page, storybookUrl, meta.title);
  await page.screenshot({
    path: `tests/visual.spec.ts-snapshots/${meta.title}-upstream-${process.platform}.png`,
    animations: 'disabled',
    fullPage: true
  });
});

const visualStories = filterStories(Object.values(manifest.entries));

visualStories.forEach((story) => {
  test(story.id, async ({ page }, meta) => {
    await navigate(page, storybookUrl, meta.title);
    const upstreamScreenshot = `${meta.title}-upstream-${process.platform}.png`;

    await page.waitForTimeout(1000);

    const screenshot = await page.screenshot({
      path: `tests/${meta.title}-current-${process.platform}.png`,
      animations: 'disabled',
      fullPage: true
    });

    expect(screenshot).toMatchSnapshot(upstreamScreenshot);
  });
});
