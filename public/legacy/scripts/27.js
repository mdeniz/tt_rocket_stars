
(function(){
 function init(){
  const settings=document.getElementById('settings');
  const stack=settings?.querySelector('.settingsStack');
  const danger=settings?.querySelector('.pilotDangerZone');
  const reset=stack?.querySelector('.settingsDanger');
  if(!settings||!stack||!danger||!reset)return;
  // Keep Reset progress and Delete pilot profile as independent sibling cards.
  danger.classList.add('ttDeletePilotStandalone');
  stack.insertAdjacentElement('afterend',danger);
  const update=()=>danger.classList.toggle('ttDeletePilotVisible',reset.classList.contains('ttSettingsActive'));
  new MutationObserver(update).observe(reset,{attributes:true,attributeFilter:['class']});
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

