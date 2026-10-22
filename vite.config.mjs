import { defineConfig } from 'vite';
import i18n from './scripts/i18n.cjs';
export default defineConfig({
  base: './',
  plugins: [{ name: 'tt-locales', transformIndexHtml(html) {
    return i18n.injectTranslations(html, i18n.loadLocales());
  }}],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
});
