// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'join'.
const { join } = require('path');

// Note: If you use library-specific PostCSS/Tailwind configuration then you should remove the `postcssConfig` build
// option from your application's configuration (i.e. project.json).
//
// See: https://nx.dev/guides/using-tailwind-css-in-react#step-4:-applying-configuration-to-libraries

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
  plugins: {
    tailwindcss: {
      // @ts-expect-error TS(2304): Cannot find name '__dirname'.
      config: join(__dirname, 'tailwind.config.ts'),
    },
    autoprefixer: {},
  },
};
