/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  printWidth: 110,
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  overrides: [
    { files: '*.astro', options: { parser: 'astro' } },
    // Each design draft has its own Tailwind theme, so its classes are sorted against that theme.
    { files: 'src/designs/a/**', options: { tailwindStylesheet: './src/designs/a/styles.css' } },
    { files: 'src/designs/b/**', options: { tailwindStylesheet: './src/designs/b/styles.css' } },
  ],
};
