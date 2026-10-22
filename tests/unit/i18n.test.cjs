const test=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{join}=require('node:path');
const {loadLocales,injectTranslations,escapeAttribute}=require('../../scripts/i18n.cjs');
test('every declarative UI key is translated',()=>{
 const html=readFileSync(join(__dirname,'../../index.html'),'utf8');
 const keys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(x=>x[1]);
 const locales=loadLocales(join(__dirname,'../..'));
 assert.ok(keys.length>50);assert.equal(new Set(keys).size,keys.length);
 assert.deepEqual(Object.keys(locales.es).sort(),Object.keys(locales.en).sort());
 for(const key of keys){assert.equal(typeof locales.es[key],'string');assert.equal(typeof locales.en[key],'string');}
 assert.equal((injectTranslations(html,locales).match(/data-es="/g)||[]).length,keys.length);
});
test('HTML attribute escaping',()=>assert.equal(escapeAttribute('a & "b" <c>'),'a &amp; &quot;b&quot; &lt;c&gt;'));
test('missing translations fail',()=>assert.throws(()=>injectTranslations('<p data-i18n="missing">',{es:{},en:{}}),/Missing es\/en/));
