const {readdirSync}=require('node:fs');
const {join}=require('node:path');
const {spawnSync}=require('node:child_process');
const dir=join(__dirname,'../public/legacy/scripts');
const files=readdirSync(dir).filter(x=>x.endsWith('.js')).sort();
if(files.length!==32)throw Error('Expected 32 legacy scripts, got '+files.length);
for(const file of files){const r=spawnSync(process.execPath,['--check',join(dir,file)],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log('Checked '+files.length+' legacy scripts');
