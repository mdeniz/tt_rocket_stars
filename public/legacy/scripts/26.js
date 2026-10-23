(function(){
 function init(){
  const settings=document.getElementById('settings');
  const stack=settings?.querySelector('.settingsStack');
  const nav=settings?.querySelector('.ttSettingsBottomNav');
  if(!settings||!stack||!nav)return;
  const profileCard=document.getElementById('settingsPilotAvatar')?.closest('article');
  const profileMount=document.getElementById('profilePanelMount');
  if(profileCard&&profileMount&&profileCard.parentElement!==profileMount){
   profileMount.appendChild(profileCard);profileCard.classList.remove('ttSettingsActive');
  }
  const cloudAccessEnabled=window.__TT_FEATURES__?.cloudAccess===true;
  const cloudPanel=settings.querySelector('#ttAuthPanel');
  if(cloudPanel&&!cloudAccessEnabled){cloudPanel.hidden=true;cloudPanel.classList.remove('ttSettingsActive');cloudPanel.setAttribute('aria-hidden','true');}
  const panelMap={
   ...(cloudAccessEnabled?{cloud:cloudPanel}:{}),audio:settings.querySelector('#ttAudioSettings'),
   profile:profileMount?.querySelector('article'),
   language:Array.from(stack.querySelectorAll(':scope > article')).find(p=>p.querySelector('.settingsLanguages')),
   theme:Array.from(stack.querySelectorAll(':scope > article')).find(p=>p.querySelector('#themeChoices')),
   backups:Array.from(stack.querySelectorAll(':scope > article')).find(p=>p.querySelector('#backupList')),
   reset:stack.querySelector('.settingsDanger')
  };
  const labels={
   cloud:['🔐','Cloud access','Acceso en la nube'],audio:['🎵','Sound','Sonido'],
   profile:['👩‍🚀','Pilot','Piloto'],language:['🌐','Language','Idioma'],
   theme:['🎨','Theme','Tema'],backups:['💾','Backups','Copias'],reset:['🗑️','Reset','Borrar']
  };
  nav.replaceChildren();nav.setAttribute('aria-label','Settings categories');
  const panels=[];
  Object.keys(labels).forEach(key=>{
   const panel=panelMap[key];if(!panel)return;
   panel.setAttribute('data-settings-panel',key);panel.id=panel.id||`ttSettingsPanel-${key}`;panels.push({key,panel});
   const [emoji,en,es]=labels[key];const btn=document.createElement('button');btn.type='button';btn.className='ttSettingsTab';
   btn.dataset.target=panel.id;btn.innerHTML='<span aria-hidden="true">'+emoji+'</span><small data-en="'+en+'" data-es="'+es+'">'+(document.documentElement.lang==='es'?es:en)+'</small>';
   btn.addEventListener('click',()=>activate(key));nav.appendChild(btn);
  });
  function activate(key){
   panels.forEach(({key:panelKey,panel})=>panel.classList.toggle('ttSettingsActive',panelKey===key));
   nav.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.target===panelMap[key]?.id));
   settings.scrollIntoView({behavior:'instant',block:'start'});
  }
  const current=panels.find(({panel})=>panel.classList.contains('ttSettingsActive'))?.key||panels[0]?.key;activate(current);
  const langObs=new MutationObserver(()=>{const spanish=document.documentElement.lang==='es';nav.querySelectorAll('small').forEach(el=>{el.textContent=el.dataset[spanish?'es':'en']})});
  langObs.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
