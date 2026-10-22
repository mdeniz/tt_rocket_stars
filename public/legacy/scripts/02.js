
(function(){
 const KEY='tt-rocket-profiles-v1', ACTIVE='tt-rocket-active-profile-v1';
 const KEYS=['cosmotablas-v2','cosmotablas-history-v1','tt-rocket-garage-v1','tt-rocket-backups-v1'];
 const language=()=>window.TTLocalStore.getItem('cosmotablas-language')==='es'?'es':'en';
 const read=()=>{try{const v=JSON.parse(window.TTLocalStore.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
 const write=v=>window.TTLocalStore.setItem(KEY,JSON.stringify(v));
 const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 const capture=()=>Object.fromEntries(KEYS.map(k=>[k,window.TTLocalStore.getItem(k)]));
 const apply=payload=>{KEYS.forEach(k=>{if(typeof payload?.[k]==='string')window.TTLocalStore.setItem(k,payload[k]);else window.TTLocalStore.removeItem(k)})};
 const hasLegacy=()=>KEYS.slice(0,3).some(k=>window.TTLocalStore.getItem(k)!==null);
 let profiles=read();let active=window.TTLocalStore.getItem(ACTIVE);
 if(!profiles.length&&hasLegacy()){
   const legacy={id:id(),name:'Pilot 1',language:language(),createdAt:Date.now(),payload:capture()};profiles=[legacy];write(profiles);window.TTLocalStore.setItem(ACTIVE,legacy.id);active=legacy.id;
 }
 // Save the active profile at every change and before reload/closing.
 function sync(){const current=window.TTLocalStore.getItem(ACTIVE);if(!current)return;const all=read(),p=all.find(x=>x.id===current);if(!p)return;p.payload=capture();p.language=language();write(all)}
 function choose(profileId){
   if(window.TTLocalStore.getItem(ACTIVE)===profileId){document.getElementById('profileGate')?.classList.add('hidden');try{navigate('dashboard')}catch(e){}return}
   sync();const target=read().find(x=>x.id===profileId);if(!target)return;
   apply(target.payload);window.TTLocalStore.setItem('cosmotablas-language',target.language==='es'?'es':'en');window.TTLocalStore.setItem(ACTIVE,profileId);window.TTSwitchProfileInPlace();
 }
 function create(name){name=String(name||'').trim().replace(/\s+/g,' ').slice(0,24);if(!name)return (window.TTLocalStore.getItem('cosmotablas-language')==='es'?'Escribe un nombre':'Please enter a name');
   const all=read();if(all.length>=12)return (window.TTLocalStore.getItem('cosmotablas-language')==='es'?'Máximo 12 perfiles':'Maximum 12 profiles');
   if(all.some(p=>p.name.toLowerCase()===name.toLowerCase()))return (window.TTLocalStore.getItem('cosmotablas-language')==='es'?'Nombre repetido':'Name already used');
   sync();const profile={id:id(),name,language:language(),createdAt:Date.now(),payload:{}};all.push(profile);write(all);apply({});window.TTLocalStore.setItem(ACTIVE,profile.id);window.TTSwitchProfileInPlace();return '';
 }
 function remove(profileId){
   const all=read(),target=all.find(p=>p.id===profileId);if(!target)return;
   const es=window.TTLocalStore.getItem('cosmotablas-language')==='es';
   const message=es?`¿Eliminar el perfil de ${target.name}? Se borrarán definitivamente sus misiones, monedas, cohete y copias de seguridad guardadas en este navegador. Esta acción no se puede deshacer.`:`Delete ${target.name}'s profile? Their missions, coins, rocket and backups stored in this browser will be permanently erased. This cannot be undone.`;
   if(!confirm(message))return;
   const current=window.TTLocalStore.getItem(ACTIVE);
   // Save the current child before deleting another child, but never recreate the deleted one.
   if(current!==profileId)sync();
   const remaining=read().filter(p=>p.id!==profileId);
   write(remaining);
   if(current===profileId){
     const next=remaining[0];
     if(next){apply(next.payload);window.TTLocalStore.setItem('cosmotablas-language',next.language==='es'?'es':'en');window.TTLocalStore.setItem(ACTIVE,next.id)}
     else{apply({});window.TTLocalStore.removeItem(ACTIVE);window.TTLocalStore.removeItem('tt-profile-selected-once')}
     // Refresh the active pilot without reloading, preserving fullscreen.
     window.TTSwitchProfileInPlace(true);
   }else render();
 }
 function render(){const gate=document.getElementById('profileGate');if(!gate)return;const all=read();const current=window.TTLocalStore.getItem(ACTIVE);const title=document.getElementById('profileTitle');const list=document.getElementById('profileList');const input=document.getElementById('profileName');const err=document.getElementById('profileError');
   const es=window.TTLocalStore.getItem('cosmotablas-language')==='es';
   document.getElementById('profileLanguage').value=es?'es':'en';
   document.getElementById('profileLangLabel').textContent=es?'Idioma':'Language';const close=document.getElementById('profileClose');if(close){close.setAttribute('aria-label',es?'Cancelar selección de jugador':'Cancel player selection');close.title=es?'Cerrar':'Close';close.hidden=!all.some(p=>p.id===current)}
   document.getElementById('profileDescription').textContent=es?'Elige tu piloto o crea uno nuevo.':'Choose your pilot or create a new one.';
   document.getElementById('profileHint').textContent=es?'Cada piloto tiene sus propias misiones, monedas, piezas del cohete y copias de seguridad. Todo se guarda en este dispositivo.':'Each pilot has separate missions, coins, rocket parts and backups. Everything stays on this device.';
   document.getElementById('profileName').placeholder=es?'Nombre':'Name';
   document.querySelector('#profileCreateForm button').textContent=es?'+ Crear':'+ Create';
   title.textContent=all.length?(es?'¿Quién juega?':'Who is playing?'):(es?'¡Bienvenido!':'Welcome!');list.replaceChildren();
   all.forEach((p,i)=>{
     const tile=document.createElement('div');tile.className='profileTile'+(p.id===current?' isActiveProfile':'');tile.style.position='relative';tile.style.paddingBottom='12px';if(p.id===current){tile.setAttribute('aria-current','true')}
     const select=document.createElement('button');select.type='button';select.className='profileSelect';select.style.cssText='border:0;background:none;color:inherit;font:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;width:100%';
     const a=document.createElement('span');a.className='profileAvatar';a.textContent=p.avatar||['🚀','🛸','🪐','🌟','👩‍🚀','🛰️'][i%6];
     const n=document.createElement('span');n.textContent=p.name;select.append(a,n);if(p.id===current){const currentBadge=document.createElement('span');currentBadge.className='profileCurrentBadge';currentBadge.textContent=es?'✓ Jugador actual':'✓ Current player';select.append(currentBadge)}select.addEventListener('click',()=>choose(p.id));
     const del=document.createElement('button');del.type='button';del.className='profileDelete';del.textContent=es?'🗑 Eliminar':'🗑 Delete';del.setAttribute('aria-label',(es?'Eliminar perfil ':'Delete profile ')+p.name);del.addEventListener('click',()=>remove(p.id));
     tile.append(select);if(p.id===current)tile.style.borderColor='#ffd66c';list.appendChild(tile)
   });
   document.getElementById('profileCreateForm').onsubmit=e=>{e.preventDefault();err.textContent=create(input.value)};
   gate.classList.remove('hidden');
 }
 window.TTProfiles={show:render,sync,read,deleteActive(){const current=window.TTLocalStore.getItem(ACTIVE);if(current)remove(current)},renameActive(){
   const activeId=window.TTLocalStore.getItem(ACTIVE);const all=read();const profile=all.find(p=>p.id===activeId);if(!profile)return;
   const es=window.TTLocalStore.getItem('cosmotablas-language')==='es';
   const proposed=prompt(es?'Nuevo nombre del piloto':'New pilot name',profile.name);if(proposed===null)return;
   const clean=String(proposed).trim().replace(/\s+/g,' ').slice(0,24);
   if(!clean){alert(es?'Escribe un nombre':'Please enter a name');return}
   if(all.some(p=>p.id!==activeId&&p.name.toLowerCase()===clean.toLowerCase())){alert(es?'Ese nombre ya está en uso':'That name is already used');return}
   profile.name=clean;write(all);
   try{renderDashboard()}catch(e){}
   const label=document.getElementById('settingsPilotName');if(label)label.textContent=clean;
 },active:()=>read().find(p=>p.id===window.TTLocalStore.getItem(ACTIVE)),choose,create,remove,saveLanguage(value){const current=window.TTLocalStore.getItem(ACTIVE);if(!current)return;const all=read();const p=all.find(x=>x.id===current);if(p){p.language=value==='es'?'es':'en';write(all)}}};
 window.addEventListener('pagehide',sync);
 // Existing game code reads from its original window.TTLocalStore keys; these are always for the active child.
 if(active&&!profiles.some(p=>p.id===active))window.TTLocalStore.removeItem(ACTIVE);
 else if(active){const p=profiles.find(x=>x.id===active);if(p){if(p.language==='es'||p.language==='en')window.TTLocalStore.setItem('cosmotablas-language',p.language);else{p.language=language();write(profiles)}}}
})();

