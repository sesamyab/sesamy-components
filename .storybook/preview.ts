import '@sesamy/sesamy-components';
import type { Preview } from '@storybook/web-components';
import { restoreSesamy } from '../packages/lib/src/stories/fake-sesamy';

const preview: Preview = {
  // A story that fakes sesamy-js installs its fake inside this decorator, so
  // every story starts from the real API, even after visiting one that faked it.
  decorators: [
    (story) => {
      restoreSesamy();
      return story();
    }
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  }
};

export default preview;
