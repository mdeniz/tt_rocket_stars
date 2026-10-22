
(function(){
 function init(){
  const sections=[['dashboard','🛰️','Control','Control'],['home','🚀','Misión','Mission'],['insights','📊','Progreso','Progress'],['awards','🏆','Logros','Awards'],['garage','🛠️','Garaje','Garage']];
  const nav=document.createElement('nav');nav.id='ttMainBottomNav';nav.setAttribute('aria-label','Navegación principal');
  for(const [id,emoji,es,en] of sections){
   const b=document.createElement('button');b.type='button';b.dataset.section=id;
   b.innerHTML='<span aria-hidden="true">'+emoji+'</span><small data-es="'+es+'" data-en="'+en+'">'+es+'</small>';
   b.addEventListener('click',()=>{if(typeof navigate==='function')navigate(id)});nav.appendChild(b);
  }
  document.body.appendChild(nav);
  const settings=document.getElementById('settings');const settingsNav=settings?.querySelector('.ttSettingsBottomNav');
  if(settingsNav){
   const stack=settings.querySelector('.settingsStack');
   const panels=Array.from(stack.querySelectorAll(':scope > article'));
   settings.insertBefore(settingsNav,stack);
   function activate(id){
    panels.forEach(p=>p.classList.toggle('ttSettingsActive',p.id===id));
    settingsNav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.target===id));
    window.scrollTo({top:0,behavior:'instant'});
   }
   settingsNav.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click',ev=>{ev.stopImmediatePropagation();activate(b.dataset.target)},true);
   });
   if(panels.length)activate(panels[0].id);
  }
  function sync(){
   const playing=!document.getElementById('play')?.classList.contains('hidden');
   const active=Array.from(document.querySelectorAll('.appscreen')).find(el=>!el.classList.contains('hidden'));
   const splash=document.getElementById('launchSplash');const splashVisible=!!splash&&getComputedStyle(splash).display!=='none'&&getComputedStyle(splash).visibility!=='hidden'&&Number(getComputedStyle(splash).opacity)>0;
   const show=!playing&&!!active&&!splashVisible;
   nav.hidden=!show;document.body.classList.toggle('ttMainNavReady',show);
   nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.section===active?.id));
   const isSpanish=typeof lang==='undefined'||lang==='es';
   nav.querySelectorAll('button small').forEach(b=>b.textContent=b.dataset[isSpanish?'es':'en']);
  }
  const obs=new MutationObserver(sync);
  document.querySelectorAll('.appscreen,#play,#launchSplash').forEach(el=>obs.observe(el,{attributes:true,attributeFilter:['class','style']}));
  sync();
  document.addEventListener('click',()=>requestAnimationFrame(sync));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

