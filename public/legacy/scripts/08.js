
(function(){
  const greeting=document.getElementById('greeting');
  if(!greeting)return;
  function update(){
    const p=window.TTProfiles?.active?.();
    if(!p?.name)return;
    const es=window.TTLocalStore.getItem('cosmotablas-language')==='es';
    let missions=0;
    try{const h=JSON.parse(window.TTLocalStore.getItem('cosmotablas-history-v1')||'[]');missions=Array.isArray(h)?h.length:0}catch(e){}
    const name=p.name;
    const text=es?(missions?'¡Sigue así, '+name+'!':'¡Bienvenido, '+name+'!'):(missions?'Keep going, '+name+'!':'Welcome, '+name+'!');
    if(greeting.textContent!==text)greeting.textContent=text;
  }
  // Update after existing startup/navigation and language rendering.
  document.addEventListener('DOMContentLoaded',update);
  window.addEventListener('pageshow',update);
  const originalNavigate=window.navigate;
  if(typeof originalNavigate==='function')window.navigate=function(...args){const r=originalNavigate.apply(this,args);update();return r};
  const originalSetLanguage=window.setLanguage;
  if(typeof originalSetLanguage==='function')window.setLanguage=function(...args){const r=originalSetLanguage.apply(this,args);update();return r};
  // Keep the greeting stable if the generic translation pass rewrites it.
  const observer=new MutationObserver(update);
  observer.observe(greeting,{subtree:true,characterData:true,childList:true});
  update();
})();

