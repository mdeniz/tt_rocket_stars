
(function(){
  // Use splash as canonical scene. Rebuild the other two using the same
  // background and foreground layers so future changes cannot diverge.
  function unify(stage){
    const splash=document.querySelector('#launchSplash');
    if(!splash||!stage)return;
    const sourceBackground=splash.querySelector(':scope > .launchJourney');
    const background=stage.querySelector(':scope > .launchJourney');
    if(sourceBackground&&background){
      background.innerHTML=sourceBackground.innerHTML;
    }
    const sourceBirds=splash.querySelector(':scope > .journeyFlyingActors');
    const oldBirds=stage.querySelector(':scope > .journeyFlyingActors');
    if(sourceBirds){
      const birds=sourceBirds.cloneNode(true);
      if(oldBirds)oldBirds.replaceWith(birds);
      else stage.appendChild(birds);
    }
    const oldClouds=stage.querySelector(':scope > .journeyCloudsFront');
    if(oldClouds)oldClouds.remove();
    const sourceClouds=splash.querySelector(':scope > .splashForegroundClouds');
    if(sourceClouds){
      const clouds=sourceClouds.cloneNode(true);
      clouds.classList.remove('splashForegroundClouds');
      stage.appendChild(clouds);
    }
  }
  function init(){
    unify(document.querySelector('#dashboard .dashRocket'));
    unify(document.querySelector('#garage .garageFlightStage'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

