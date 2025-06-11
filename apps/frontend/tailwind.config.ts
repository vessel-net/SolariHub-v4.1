// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'join'.
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
  content: [
    join(
      // @ts-expect-error TS(2304): Cannot find name '__dirname'.
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    // @ts-expect-error TS(2304): Cannot find name '__dirname'.
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
