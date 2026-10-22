import { defineConfig } from 'vite';
import * as i18n from './scripts/i18n.mjs';
export default defineConfig({
  base: './',
  plugins: [{ name: 'tt-locales', transformIndexHtml(html) {
    return i18n.injectTranslations(html, i18n.loadLocales());
  }}],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
});
