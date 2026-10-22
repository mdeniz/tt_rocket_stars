const test=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{join}=require('node:path');
const i18n=import('../../scripts/i18n.mjs');
test('every declarative UI key is translated',async()=>{
 const {loadLocales,injectTranslations}=await i18n;
 const html=readFileSync(join(__dirname,'../../index.html'),'utf8');
 const keys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(x=>x[1]);
 const locales=loadLocales(join(__dirname,'../..'));
 assert.ok(keys.length>50);assert.equal(new Set(keys).size,keys.length);
 assert.deepEqual(Object.keys(locales.es).sort(),Object.keys(locales.en).sort());
 for(const key of keys){assert.equal(typeof locales.es[key],'string');assert.equal(typeof locales.en[key],'string');}
 assert.equal((injectTranslations(html,locales).match(/data-es="/g)||[]).length,keys.length);
});
test('HTML attribute escaping',async()=>{
 const {escapeAttribute}=await i18n;
 assert.equal(escapeAttribute('a & "b" <c>'),'a &amp; &quot;b&quot; &lt;c&gt;');
});
test('missing translations fail',async()=>{
 const {injectTranslations}=await i18n;
 assert.throws(()=>injectTranslations('<p data-i18n="missing">',{es:{},en:{}}),/Missing es\/en/);
});
