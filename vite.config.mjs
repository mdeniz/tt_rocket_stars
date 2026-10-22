import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import * as i18n from './scripts/i18n.mjs';

const escapeClosingTag = (contents, tagName) => contents.replace(
  new RegExp(`</${tagName}`, 'gi'),
  `<\\/${tagName}`,
);

function inlineReleaseAssets() {
  let isBuild = false;
  let outDir = '';

  return {
    name: 'tt-inline-release-assets',
    enforce: 'post',
    configResolved(config) {
      isBuild = config.command === 'build';
      outDir = config.build.outDir;
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!isBuild) return html;

        const read = file => fs.readFileSync(path.resolve(file), 'utf8');
        const css = escapeClosingTag(read('src/styles/legacy.css'), 'style');
        let output = html.replace(
          '<link rel="stylesheet" href="./src/styles/legacy.css">',
          `<style>${css}</style>`,
        );

        output = output.replace(
          /<script src="\.\/legacy\/scripts\/([^\"]+)"><\/script>/g,
          (_, filename) => `<script>${escapeClosingTag(read(`public/legacy/scripts/${filename}`), 'script')}</script>`,
        );
        return output;
      },
    },
    closeBundle() {
      if (isBuild) fs.rmSync(path.resolve(outDir, 'legacy'), { force: true, recursive: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [{ name: 'tt-locales', transformIndexHtml(html) {
    return i18n.injectTranslations(html, i18n.loadLocales());
  }}, inlineReleaseAssets()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
});
