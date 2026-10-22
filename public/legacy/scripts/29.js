
(function(){
'use strict';
var steps=[
 {view:'dashboard',target:'.dashhero',es:['👋 ¡Bienvenido, piloto!','Este es tu Centro de Mando. Aquí verás tu nivel, la experiencia que ganas y cómo va tu aventura.'],en:['👋 Welcome, pilot!','This is Mission Control. Here you can see your level, experience points and your adventure.']},
 {view:'dashboard',target:'.dashRocket',es:['🚀 Tu nave espacial','Toca tu cohete para entrar en el Garaje. Allí podrás cambiar sus piezas y crear una nave única.'],en:['🚀 Your spaceship','Tap your rocket to enter the Garage. There you can change its parts and build your own ship.']},
 {view:'dashboard',target:'.primaryLaunch',es:['🌟 ¡Empieza una misión!','Pulsa «Nueva misión» para elegir qué tablas quieres practicar y comenzar a jugar.'],en:['🌟 Start a mission!','Tap “New Mission” to choose which tables to practise and start playing.']},
 {view:'home',target:'.sectionintro',es:['🪐 Prepara tu aventura','Elige las tablas y el tipo de desafío. Puedes empezar con una sola tabla e ir aumentando la dificultad.'],en:['🪐 Prepare your adventure','Choose your tables and challenge type. Start with one table and increase the difficulty as you improve.']},
 {view:'insights',target:'#insightTotals',es:['📊 Tu progreso','Aquí puedes ver tus resultados, descubrir qué tablas dominas y revisar las misiones anteriores.'],en:['📊 Your progress','See your results, discover which tables you know well and revisit earlier missions.']},
 {view:'insights',target:'.actions',es:['🔁 Practica tus errores','Si te equivocas en alguna operación, podrás practicarla de nuevo hasta que te salga mejor.'],en:['🔁 Practise your mistakes','If you miss a question, you can practise it again until you get better.']},
 {view:'garage',target:'.sectionintro',es:['🔧 Garaje espacial','Gana monedas completando misiones y úsalas para conseguir nuevas piezas y personalizar tu cohete.'],en:['🔧 Rocket Garage','Earn coins by completing missions and use them to unlock new parts and customise your rocket.']},
 {view:'awards',target:'.sectionintro',es:['🏆 Tus logros','A medida que juegues y aprendas, desbloquearás insignias y nuevos retos. ¡Cada pequeño avance cuenta!'],en:['🏆 Your achievements','As you play and learn, you will unlock badges and new challenges. Every little step counts!']},
 {view:'settings',target:'.sectionintro',es:['⚙️ Ajustes y copias','Aquí puedes cambiar el idioma y el sonido, y guardar una copia de seguridad de tus avances.'],en:['⚙️ Settings and backups','Change the language and sound here, and save a backup of your progress.']},
 {view:'dashboard',target:'.primaryLaunch',es:['🎉 ¡Ya estás listo!','Puedes volver a ver esta guía cuando quieras tocando el botón «Guía». ¡Buen viaje, piloto!'],en:['🎉 You’re ready!','You can repeat this tour whenever you like by tapping “Guide”. Have a great flight, pilot!']}
];
var index=0,active=false,highlight=null,startedFor='',timer=null;
function es(){try{return window.TTLocalStore.getItem('cosmotablas-language')==='es'}catch(e){return true}}
function profile(){try{return window.TTProfiles&&window.TTProfiles.active()&&window.TTProfiles.active().id||''}catch(e){return ''}}
function key(){return 'tt-rocket-tour-done-v1:'+profile()}
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function go(view){try{if(typeof navigate==='function')navigate(view)}catch(e){}}
function unmark(){if(highlight){highlight.classList.remove('ttTourSpot');highlight=null}}
function show(){
 if(!active)return;
 unmark();
 var st=steps[index],lang=es()?'es':'en';
 go(st.view);
 var copy=st[lang];
 document.getElementById('ttTourProgress').textContent=(es()?'PASO ':'STEP ')+(index+1)+' / '+steps.length;
 document.getElementById('ttTourTitle').textContent=copy[0];
 document.getElementById('ttTourBody').textContent=copy[1];
 document.getElementById('ttTourSkip').textContent=es()?'Saltar guía':'Skip tour';
 document.getElementById('ttTourBack').textContent=es()?'← Atrás':'← Back';
 document.getElementById('ttTourBack').style.display=index===0?'none':'';
 document.getElementById('ttTourNext').textContent=index===steps.length-1?(es()?'¡A jugar! 🚀':'Let’s play! 🚀'):(es()?'Siguiente →':'Next →');
 document.getElementById('ttTourShade').classList.add('ttTourVisible');
 setTimeout(function(){var el=document.querySelector('#'+st.view+' '+st.target);if(visible(el)){highlight=el;el.classList.add('ttTourSpot');try{el.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}},90);
}
function finish(){
 active=false;unmark();document.getElementById('ttTourShade').classList.remove('ttTourVisible');
 if(profile())try{window.TTLocalStore.setItem(key(),'1')}catch(e){}
 go('dashboard');showHelp();
}
function start(){if(!profile())return;index=0;active=true;show()}
function showHelp(){var b=document.getElementById('ttTourHelp');b.classList.toggle('ttShow',!!profile());document.getElementById('ttTourHelpText').textContent=es()?'Guía':'Guide'}
document.getElementById('ttTourNext').addEventListener('click',function(){if(index===steps.length-1)finish();else{index++;show()}});
document.getElementById('ttTourBack').addEventListener('click',function(){if(index>0){index--;show()}});
document.getElementById('ttTourSkip').addEventListener('click',finish);
document.getElementById('ttTourHelp').addEventListener('click',start);
function check(){
 if(active)return;
 var id=profile();
 if(!id||!document.getElementById('launchSplash')||!document.getElementById('profileGate'))return;
 var splash=document.getElementById('launchSplash'),gate=document.getElementById('profileGate');
 if(visible(splash)||visible(gate))return;
 showHelp();
 if(id!==startedFor){
  startedFor=id;
  try{if(window.TTLocalStore.getItem(key())==='1')return}catch(e){}
  start();
 }
}
setInterval(check,1100);
window.TTRestartTour=start;
})();

