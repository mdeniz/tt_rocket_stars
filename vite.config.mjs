import fs from 'node:fs';
import { copyFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import * as i18n from './scripts/i18n.mjs';

const escapeInlineScriptMarkup = contents => contents
  .replace(/<script/gi, '\\x3cscript')
  .replace(/<\/script/gi, '\\x3c/script');

const escapeClosingTag = (contents, tagName) => contents.replace(
  new RegExp(`</${tagName}`, 'gi'),
  `\\x3c/${tagName}`,
);

function inlineReleaseAssets() {
  let isBuild = false;
  let outDir = '';
  let publicSupabaseConfig = { url: '', anonKey: '', siteUrl: '' };
  let cloudAccessEnabled = false;
  let reactCoreScreensEnabled = false;
  let appVersion = '';
  const inlinedScripts = new Map();

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
      reactCoreScreensEnabled = config.env.VITE_REACT_CORE_SCREENS === 'true';
      appVersion = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')).version;
    },
    renderChunk(code) {
      return { code: escapeInlineScriptMarkup(code), map: null };
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const read = file => fs.readFileSync(path.resolve(file), 'utf8');
        const cloudSync = read('src/lib/cloud-sync.js')
          .replace(/^export /gm, '')
          .replace(/\nexport \{ SYNC_METADATA_KEY \};\s*$/, '')
          + '\nwindow.TTCloudSync={createCloudSync,chooseSnapshot,serializePilot,SYNC_METADATA_KEY};';
        const persistence = read('src/lib/persistence-runtime.js');
        const telemetrySource = read('src/lib/telemetry.js')
          .replace(/^export /gm, '')
          .replace(/\nexport \{ DEFAULT_MAX_QUEUE_SIZE, DEFAULT_RETENTION_MS, EVENT_DEFINITIONS \};\s*$/, '');
        const telemetry = `(()=>{${telemetrySource}\nwindow.TTTelemetry=createTelemetryService({consent:false});})();`;
        let output = html.replace(
          '<!-- TT_PERSISTENCE_RUNTIME -->',
          `<script>${escapeInlineScriptMarkup(persistence)}</script>`,
        );
        output = output.replace(
          '<!-- TT_CLOUD_SYNC_RUNTIME -->',
          `<script>${escapeInlineScriptMarkup(cloudSync)}</script>`,
        );
        output = output.replace(
          '<!-- TT_TELEMETRY_RUNTIME -->',
          `<script>${escapeInlineScriptMarkup(telemetry)}</script>`,
        );
        output = output.replace(
          '<!-- TT_APP_VERSION -->',
          `<script>window.__TT_APP_VERSION__=${JSON.stringify(appVersion)};</script>`,
        );
        output = output.replace(
          '<!-- TT_FEATURE_FLAGS -->',
          `<script>window.__TT_FEATURES__=Object.assign(${JSON.stringify({ cloudAccess: cloudAccessEnabled, reactCoreScreens: reactCoreScreensEnabled })},window.__TT_FEATURES__||{});window.__TTFeatureFlags=Object.assign({reactCoreScreens:${reactCoreScreensEnabled}},window.__TTFeatureFlags||{});</script>`,
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
          (_, filename) => `<script>${escapeInlineScriptMarkup(read(`public/legacy/scripts/${filename}`))}</script>`,
        );
        return output;
      },
    },
    generateBundle(_, bundle) {
      if (!isBuild) return;
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk' || !fileName.endsWith('.js')) continue;
        inlinedScripts.set(fileName, output.code);
      }
    },
    writeBundle() {
      if (!isBuild) return;
      const htmlPath = path.resolve(outDir, 'index.html');
      let builtHtml = fs.readFileSync(htmlPath, 'utf8');
      for (const [fileName, script] of inlinedScripts) {
        const safeScript = escapeInlineScriptMarkup(script);
        const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        builtHtml = builtHtml.replace(
          new RegExp(`<script[^>]*src="[^"]*${escapedFileName}"[^>]*><\\/script>`, 'g'),
          () => `<script>${safeScript}</script>`,
        );
      }
      // Vite may append the original module tag after Rollup has emitted the
      // already-inlined chunk. Remove that duplicate external reference from
      // the final file, together with any modulepreload hint.
      builtHtml = builtHtml
        .replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/, '')
        .replace(/<link rel="modulepreload"[^>]*>/g, '');
      fs.writeFileSync(htmlPath, builtHtml);
      fs.rmSync(path.resolve(outDir, 'assets'), { force: true, recursive: true });
      fs.rmSync(path.resolve(outDir, 'legacy'), { force: true, recursive: true });
      fs.renameSync(htmlPath, path.resolve(outDir, 'index_next.html'));
      copyFileSync(path.resolve(outDir, 'index_next.html'), htmlPath);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [{ name: 'tt-locales', transformIndexHtml(html) {
    return i18n.injectTranslations(html, i18n.loadLocales());
  }}, inlineReleaseAssets()],
  build: { outDir: 'dist', emptyOutDir: true, modulePreload: false },
  server: { port: 5173 },
});
