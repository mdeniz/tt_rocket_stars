(function(){
 for(const stage of document.querySelectorAll('#launchSplash .launchJourney,.dashRocket .launchJourney,.garageFlightStage .launchJourney')){
   if(stage.querySelector('.journeyIgnition'))continue;
   const fx=document.createElement('div');fx.className='journeyIgnition';fx.setAttribute('aria-hidden','true');
   fx.innerHTML='<i class="launchDust"></i><i class="launchDust"></i><i class="launchDust"></i><i class="launchSteam"></i><i class="launchSteam"></i><i class="launchSteam"></i>';
   stage.appendChild(fx);
 }
})();
