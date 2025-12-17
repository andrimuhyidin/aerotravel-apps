module.exports = {
  // Lint & format TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  // Format other files (Prettier will auto-sort Tailwind classes)
  '*.{json,md,mdx,css,html,yml,yaml,scss}': [
    'prettier --write',
  ],
};

