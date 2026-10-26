import type { Preview } from '@storybook/angular-vite';
import '../src/styles.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    viewport: {
      options: {
        movil: { name: 'Móvil (390 px)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        tablet: { name: 'Tablet (834 px)', styles: { width: '834px', height: '1112px' }, type: 'tablet' },
        escritorio: { name: 'Escritorio (1280 px)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
