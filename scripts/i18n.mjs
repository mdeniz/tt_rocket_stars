import fs from 'node:fs';
import path from 'node:path';

const escapeAttribute = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function loadLocales(root = process.cwd()) {
  return Object.fromEntries(['es', 'en'].map(language => [
    language,
    JSON.parse(fs.readFileSync(
      path.join(root, 'src/locales', `${language}.json`),
      'utf8',
    )),
  ]));
}

function injectTranslations(html, locales) {
  return html.replace(/\bdata-i18n="([^"]+)"/g, (match, key) => {
    if (!(key in locales.es) || !(key in locales.en)) {
      throw Error(`Missing es/en translation for ${key}`);
    }
    return `${match} data-es="${escapeAttribute(locales.es[key])}" data-en="${escapeAttribute(locales.en[key])}"`;
  });
}

export { escapeAttribute, loadLocales, injectTranslations };
