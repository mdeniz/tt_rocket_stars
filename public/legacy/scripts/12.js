
(function(){
 function updateHeaderPilot(){
   const profile=window.TTProfiles?.active?.();
   const root=document.getElementById('headerPilot');
   const name=document.getElementById('headerPilotName');
   const avatar=document.getElementById('headerPilotAvatar');
   if(!root||!name||!avatar)return;
   root.style.display=profile?'flex':'none';
   if(!profile)return;
   name.textContent=profile.name||'Pilot';
   const profiles=window.TTProfiles?.read?.()||[];
   const index=Math.max(0,profiles.findIndex(p=>p.id===profile.id));
   avatar.textContent=profile.avatar||['🚀','🛸','🪐','🌟','👩‍🚀','🛰️'][index%6];
   root.setAttribute('aria-label',(window.TTLocalStore.getItem('cosmotablas-language')==='es'?'Cambiar piloto. Actual: ':'Switch pilot. Current: ')+name.textContent);
   root.setAttribute('title',window.TTLocalStore.getItem('cosmotablas-language')==='es'?'Cambiar piloto':'Switch pilot');
 }
 window.updateHeaderPilot=updateHeaderPilot;
 const oldSwitch=window.TTSwitchProfileInPlace;
 if(typeof oldSwitch==='function')window.TTSwitchProfileInPlace=function(...args){const result=oldSwitch.apply(this,args);updateHeaderPilot();return result};
 if(window.TTProfiles){
   for(const method of ['renameActive','saveAvatar','deleteActive']){
     const old=window.TTProfiles[method];
     if(typeof old==='function')window.TTProfiles[method]=function(...args){const result=old.apply(this,args);updateHeaderPilot();return result};
   }
 }
 // The avatar customizer updates the settings preview; observe that update as well.
 const preview=document.getElementById('settingsPilotAvatar');
 if(preview)new MutationObserver(updateHeaderPilot).observe(preview,{childList:true,characterData:true,subtree:true});
 document.addEventListener('click',()=>queueMicrotask(updateHeaderPilot));
 updateHeaderPilot();
})();

