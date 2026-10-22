
(function(){
  function replay(root){
    if(!root||root.closest('.hidden'))return;
    const scene=root.querySelector('.launchJourney');
    if(!scene)return;
    // Animations run while the splash or another page covers the scene.
    // Rewind the entire flight together: mountains, ground, rocket, birds and clouds.
    [root,...root.querySelectorAll('*')].forEach(el=>{
      if(typeof el.getAnimations!=='function')return;
      el.getAnimations({subtree:false}).forEach(a=>{
        try {if(a.playState!=='idle'){a.currentTime=0;a.play()}}catch(e){}
      });
    });
  }
  function init(){
    const splash=document.getElementById('launchSplash');
    const dashboard=document.getElementById('dashboard');
    const garage=document.getElementById('garage');
    function replayActive(){
      if(splash&&!splash.classList.contains('hidden'))return;
      if(dashboard&&!dashboard.classList.contains('hidden'))replay(dashboard.querySelector('.dashRocket'));
      if(garage&&!garage.classList.contains('hidden'))replay(garage.querySelector('.garageFlightStage'));
    }
    [splash,dashboard,garage].forEach(el=>{
      if(el)new MutationObserver(replayActive).observe(el,{attributes:true,attributeFilter:['class']});
    });
    if(splash&&splash.classList.contains('hidden'))replayActive();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

