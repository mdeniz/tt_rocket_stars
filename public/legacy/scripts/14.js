
(function(){
  const markup=`<div class="journeyUfo" aria-hidden="true"><svg viewBox="0 0 150 76" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="ufoMetal91" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e4faff"/><stop offset=".55" stop-color="#88a8c4"/><stop offset="1" stop-color="#3a5376"/></linearGradient></defs>
    <path d="M49 37C49 14 61 7 75 7S101 14 101 37" fill="#70d7f5" stroke="#e1faff" stroke-width="3"/>
    <ellipse cx="75" cy="45" rx="68" ry="22" fill="url(#ufoMetal91)" stroke="#e8faff" stroke-width="3"/>
    <ellipse cx="75" cy="51" rx="53" ry="11" fill="#304e72"/>
    <g class="ufoGlow" fill="#ffe986"><circle cx="31" cy="47" r="5"/><circle cx="54" cy="54" r="5"/><circle cx="78" cy="56" r="5"/><circle cx="102" cy="53" r="5"/><circle cx="123" cy="46" r="5"/></g>
    <path d="M5 50H-27M5 44H-15M5 57H-37" stroke="#b1eaff" stroke-width="3" stroke-linecap="round" opacity=".72"/>
  </svg></div>`;
  function add(){
    document.querySelectorAll('#launchSplash .launchJourney,#dashboard .dashRocket>.launchJourney,#garage .garageFlightStage>.launchJourney').forEach(scene=>{
      if(!scene.querySelector('.journeyUfo'))scene.insertAdjacentHTML('beforeend',markup);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
})();

