
(function(){
 function init(){
  const settings=document.getElementById('settings');
  const stack=settings&&settings.querySelector('.settingsStack');
  const mount=document.getElementById('profilePanelMount');  if(!stack||!mount)return;
  const profileCard=document.getElementById('settingsPilotAvatar')?.closest('article');
  if(profileCard)mount.appendChild(profileCard);
  const sections=Array.from(stack.querySelectorAll(':scope > article'));
  const labels=[
   ['🎵','Audio','Sonido'],
   ['🌐','Language','Idioma'],
   ['🎨','Theme','Tema'],
   ['💾','Backups','Copias'],
   ['🗑️','Reset','Borrar']
  ];
  const nav=document.createElement('nav');
  nav.className='ttSettingsBottomNav';
  nav.setAttribute('aria-label','Settings sections');
  sections.forEach((section,i)=>{
   section.id=section.id||'ttSettingsSection'+i;
   const title=labels[i]||['⚙️','Section '+(i+1),'Sección '+(i+1)];
   const btn=document.createElement('button');
   btn.type='button';btn.className='ttSettingsTab';
   btn.dataset.target=section.id;
   btn.innerHTML='<span aria-hidden="true">'+title[0]+'</span><small data-en="'+title[1]+'" data-es="'+title[2]+'">'+(document.documentElement.lang==='es'?title[2]:title[1])+'</small>';
   btn.addEventListener('click',()=>{
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
    section.scrollIntoView({behavior:'smooth',block:'start'});
   });
   nav.appendChild(btn);
  });
  if(nav.firstElementChild)nav.firstElementChild.classList.add('active');
  settings.appendChild(nav);
  const observer=new IntersectionObserver(entries=>{
   if(settings.classList.contains('hidden'))return;
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(visible)nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.target===visible.target.id));
  },{root:null,rootMargin:'-12% 0px -42% 0px',threshold:[0,.25,.5]});
  sections.forEach(section=>observer.observe(section));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

