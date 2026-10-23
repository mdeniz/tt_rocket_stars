import fs from 'node:fs';
import { writeFileSync } from 'node:fs';
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
  let publicSupabaseConfig = { url: '', anonKey: '', siteUrl: '' };
  let cloudAccessEnabled = false;

  return {
    name: 'tt-inline-release-assets',
    enforce: 'post',
    configResolved(config) {
      isBuild = config.command === 'build';
      outDir = config.build.outDir;
      publicSupabaseConfig = {
        url: config.env.VITE_SUPABASE_URL || '',
        anonKey: config.env.VITE_SUPABASE_ANON_KEY || '',
        siteUrl: config.env.VITE_APP_SITE_URL || '',
      };
      cloudAccessEnabled = config.env.VITE_ENABLE_CLOUD_ACCESS === 'true';
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const read = file => fs.readFileSync(path.resolve(file), 'utf8');
        const cloudSync = read('src/lib/cloud-sync.js')
          .replace(/^export /gm, '')
          .replace(/\nexport \{ SYNC_METADATA_KEY \};\s*$/, '')
          + '\nwindow.TTCloudSync={createCloudSync,chooseSnapshot,serializePilot,SYNC_METADATA_KEY};';
        const telemetrySource = read('src/lib/telemetry.js')
          .replace(/^export /gm, '')
          .replace(/\nexport \{ DEFAULT_MAX_QUEUE_SIZE, DEFAULT_RETENTION_MS, EVENT_DEFINITIONS \};\s*$/, '');
        const telemetry = `(()=>{${telemetrySource}\nwindow.TTTelemetry=createTelemetryService({consent:false});})();`;
        let output = html.replace(
          '<!-- TT_CLOUD_SYNC_RUNTIME -->',
          `<script>${escapeClosingTag(cloudSync, 'script')}</script>`,
        );
        output = output.replace(
          '<!-- TT_TELEMETRY_RUNTIME -->',
          `<script>${escapeClosingTag(telemetry, 'script')}</script>`,
        );
        output = output.replace(
          '<!-- TT_FEATURE_FLAGS -->',
          `<script>window.__TT_FEATURES__=Object.assign(${JSON.stringify({ cloudAccess: cloudAccessEnabled })},window.__TT_FEATURES__||{});</script>`,
        );
        if (!isBuild) return output;

        const css = escapeClosingTag(read('src/styles/legacy.css'), 'style');
        output = output.replace(
          '<link rel="stylesheet" href="./src/styles/legacy.css">',
          `<style>${css}</style>`,
        );

        output = output.replace(
          '<!-- TT_SUPABASE_CONFIG -->',
          `<script>window.__TT_SUPABASE_CONFIG__=${JSON.stringify(publicSupabaseConfig)};</script>`,
        );

        output = output.replace(
          /<script src="\.\/legacy\/scripts\/([^\"]+)"><\/script>/g,
          (_, filename) => `<script>${escapeClosingTag(read(`public/legacy/scripts/${filename}`), 'script')}</script>`,
        );
        return output;
      },
    },
    closeBundle() {
      if (!isBuild) return;
      fs.rmSync(path.resolve(outDir, 'legacy'), { force: true, recursive: true });
      fs.renameSync(path.resolve(outDir, 'index.html'), path.resolve(outDir, 'index_next.html'));
      writeFileSync(path.resolve(outDir, 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./index_next.html"><title>TT Rocket Stars</title><script>location.replace("./index_next.html")</script>');
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
