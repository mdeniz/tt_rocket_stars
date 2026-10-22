
(function(){
 function init(){
  const settings=document.getElementById('settings');
  const stack=settings?.querySelector('.settingsStack');
  const nav=settings?.querySelector('.ttSettingsBottomNav');
  if(!settings||!stack||!nav)return;
  const profileCard=document.getElementById('settingsPilotAvatar')?.closest('article');
  const profileMount=document.getElementById('profilePanelMount');
  if(profileCard&&profileMount&&profileCard.parentElement!==profileMount){
   profileMount.appendChild(profileCard);
   profileCard.classList.remove('ttSettingsActive');
  }
  const panels=Array.from(stack.querySelectorAll(':scope > article'));
  const resetPanel=panels.find(p=>p.classList.contains('settingsDanger'))||panels[panels.length-1];
  const danger=settings.querySelector(':scope > .pilotDangerZone');
  if(danger&&resetPanel)resetPanel.appendChild(danger);
  const labels=[['🎵','Sound','Sonido'],['🌐','Language','Idioma'],['🎨','Theme','Tema'],['💾','Backups','Copias'],['🗑️','Reset','Borrar']];
  nav.replaceChildren();
  nav.setAttribute('aria-label','Settings categories');
  panels.forEach((panel,i)=>{
   if(!panel.id)panel.id='ttSettingsFixedPanel'+i;
   const [emoji,en,es]=labels[i]||['⚙️','Settings','Ajustes'];
   const btn=document.createElement('button');btn.type='button';btn.className='ttSettingsTab';
   btn.dataset.target=panel.id;
   btn.innerHTML='<span aria-hidden="true">'+emoji+'</span><small data-en="'+en+'" data-es="'+es+'">'+(document.documentElement.lang==='es'?es:en)+'</small>';
   btn.addEventListener('click',()=>{
    panels.forEach(p=>p.classList.toggle('ttSettingsActive',p===panel));
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
    settings.scrollIntoView({behavior:'instant',block:'start'});
   });
   nav.appendChild(btn);
  });
  const current=panels.find(p=>p.classList.contains('ttSettingsActive'))||panels[0];
  panels.forEach(p=>p.classList.toggle('ttSettingsActive',p===current));
  nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.target===current?.id));
  const langObs=new MutationObserver(()=>{
   const spanish=document.documentElement.lang==='es';
   nav.querySelectorAll('small').forEach(el=>{el.textContent=el.dataset[spanish?'es':'en']});
  });
  langObs.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

