
(function(){
 const AVATARS=['🚀','🛸','🪐','🌟','👩‍🚀','🛰️','👨‍🚀','👽','🌙','☄️','🤖','🌈','🦄','🐱','🐶','🦊','🐼','🐲','🦁','🐸','🦋','🐙','⚡','🌞'];
 const profileKey='tt-rocket-profiles-v1';
 const activeKey='tt-rocket-active-profile-v1';
 function profileData(){try{return JSON.parse(window.TTLocalStore.getItem(profileKey)||'[]')}catch(e){return []}}
 function activeProfile(){return window.TTProfiles?.active?.()}
 function refreshPilotCustomizer(){
   const current=activeProfile();if(!current)return;
   const preview=document.getElementById('settingsPilotAvatar');
   const label=document.getElementById('settingsPilotName');
   const grid=document.getElementById('pilotAvatarChoices');
   if(!grid)return;
   const profiles=profileData();const index=Math.max(0,profiles.findIndex(p=>p.id===current.id));
   const avatar=current.avatar||['🚀','🛸','🪐','🌟','👩‍🚀','🛰️'][index%6];
   if(preview)preview.textContent=avatar;
   if(label)label.textContent=current.name;
   grid.replaceChildren();
   for(const symbol of AVATARS){
     const btn=document.createElement('button');btn.type='button';btn.className='pilotAvatarOption';btn.textContent=symbol;
     btn.setAttribute('aria-pressed',String(symbol===avatar));btn.setAttribute('aria-label',symbol);
     btn.onclick=()=>{
       const all=profileData();const selected=all.find(p=>p.id===current.id);if(!selected)return;
       selected.avatar=symbol;window.TTLocalStore.setItem(profileKey,JSON.stringify(all));
       refreshPilotCustomizer();
     };
     grid.append(btn);
   }
 }
 // Refresh after navigation, renaming or selecting another pilot, without reloading.
 const previousRename=window.TTProfiles?.renameActive;
 if(previousRename){window.TTProfiles.renameActive=function(...args){const result=previousRename.apply(this,args);refreshPilotCustomizer();return result}}
 const previousNavigate=window.navigate;
 if(typeof previousNavigate==='function')window.navigate=function(...args){const result=previousNavigate.apply(this,args);if(args[0]==='settings')refreshPilotCustomizer();return result};
 const previousSwitch=window.TTSwitchProfileInPlace;
 if(typeof previousSwitch==='function')window.TTSwitchProfileInPlace=function(...args){const result=previousSwitch.apply(this,args);refreshPilotCustomizer();return result};
 document.addEventListener('DOMContentLoaded',refreshPilotCustomizer);
 refreshPilotCustomizer();
})();

