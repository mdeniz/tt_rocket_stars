'use strict';
const fs = require('node:fs');
const path = require('node:path');
const escapeAttribute = v => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function loadLocales(root=process.cwd()) {
 return Object.fromEntries(['es','en'].map(lang=>[lang,JSON.parse(fs.readFileSync(path.join(root,'src/locales',lang+'.json'),'utf8'))]));
}
function injectTranslations(html,locales) {
 return html.replace(/\bdata-i18n="([^"]+)"/g,(match,key)=>{
   if(!(key in locales.es)||!(key in locales.en))throw Error('Missing es/en translation for '+key);
   return match+' data-es="'+escapeAttribute(locales.es[key])+'" data-en="'+escapeAttribute(locales.en[key])+'"';
 });
}
module.exports={escapeAttribute,loadLocales,injectTranslations};
