
/* Dashboard cards: route clicks and keyboard activation without relying on
   listeners installed during initial boot (which can be lost on re-render). */
(function(){
  const destinations=new Set(['dashboard','home','insights','awards','garage','settings']);
  function activate(event){
    const card=event.target && event.target.closest && event.target.closest('#dashboard [data-go]');
    if(!card || card.classList.contains('hidden'))return;
    if(event.type==='keydown' && event.key!=='Enter' && event.key!==' ')return;
    const destination=card.getAttribute('data-go');
    if(!destinations.has(destination))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{
      if(typeof navigate==='function')navigate(destination);
      else console.error('Dashboard navigation is unavailable');
    }catch(error){console.error('Dashboard navigation failed:',destination,error)}
  }
  document.addEventListener('click',activate,true);
  document.addEventListener('keydown',activate,true);
})();

