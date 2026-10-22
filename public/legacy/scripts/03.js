
/* Shared language state for the mission UI.
   Previously `lang` existed only inside the translation module's IIFE,
   causing renderPlanets() and renderMissionKeypad() to throw. */
var lang='en';
try { lang=window.TTLocalStore.getItem('cosmotablas-language')==='es'?'es':'en'; } catch(e) {}
const $=x=>document.getElementById(x);let chosen=new Set([1,2,5,10]),op='mul',mode='practice',reviewOnly=false,queue=[],index=0,correct=0,wrong=0,score=0,remaining=60,timer=null,active=null,answered=false,run=0,autoNextTimer=null,durationMinutes=5,deadline=0,questionNumber=0,exitPausedAt=0,autoNextDueAt=0;let history=[];try{history=JSON.parse(window.TTLocalStore.getItem('cosmotablas-history-v1'))||[]}catch{}let missionStartedAt=0;let data={};try{data=JSON.parse(window.TTLocalStore.getItem('cosmotablas-v2'))||{}}catch{}const id=q=>q.a+'-'+q.b+'-'+q.op;function save(){try{window.TTLocalStore.setItem('cosmotablas-v2',JSON.stringify(data))}catch{}renderStats();TTProfiles.sync()}function renderPlanets(){let colors=['#ffcf58','#75e2bf','#ff8f83','#a8a2ff','#f9b975','#a7e88a','#e9a4e6','#70d6e6','#ffc77b','#c0b4ff','#ff958a','#83e4bd'];$('planets').innerHTML=Array.from({length:12},(_,i)=>`<button class="planet ${chosen.has(i+1)?'on':''}" aria-pressed="${chosen.has(i+1)}" onclick="toggle(${i+1})"><span class="orb planet-art planet-art-${i+1}"></span>${lang==='es'?'Tabla':'Table'} ${i+1}</button>`).join('')}function toggle(n){chosen.has(n)?chosen.delete(n):chosen.add(n);reviewOnly=false;renderPlanets()}function pick(v){chosen=new Set(v==='all'?Array.from({length:12},(_,i)=>i+1):[1,2,5,10]);reviewOnly=false;renderPlanets()}function choose(kind,v){if(kind==='op'){op=v;document.querySelectorAll('#ops button').forEach(x=>x.classList.toggle('on',x.dataset.v===v))}else{mode=v;document.querySelectorAll('#modes button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));$('durationSelect').classList.toggle('hidden',v!=='timed')}}function chooseDuration(n){durationMinutes=n;document.querySelectorAll('#durations button').forEach(x=>x.classList.toggle('on',Number(x.dataset.min)===n))}function clockText(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}function updateClock(){if(exitPausedAt)return;remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('clock').textContent='⏱ '+clockText(remaining);if(mode==='timed')$('bar').style.width=((durationMinutes*60-remaining)/(durationMinutes*60)*100)+'%';if(remaining===0)finish()}function pool(){let p=[];for(let a of chosen)for(let b=1;b<=12;b++){if(op!=='div')p.push({a,b,op:'mul',result:a*b});if(op!=='mul')p.push({a,b,op:'div',result:b})}return reviewOnly?p.filter(q=>(data[id(q)]?.pending??data[id(q)]?.wrong??0)>0):p}function shuffle(p){p=p.slice();for(let i=p.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]]}return p}let missionMistakes=[],missionReviewKeys=null,missionReviewActive=false,ttArchivedResult=null,ttReplayQuestionSet=null,ttReplaySourceDate=null,ttMissionAttempts=[];
function start(){ttArchivedResult=null;ttToggleArchivedResult(false);window.TTAudio?.sfx('countdown');window.TTAudio?.sfx('missionStart');renderMissionKeypad();missionStartedAt=Date.now();exitPausedAt=0;autoNextDueAt=0;clearTimeout(autoNextTimer);let p=ttReplayQuestionSet?ttReplayQuestionSet.map(q=>({...q})):missionReviewActive&&missionReviewKeys?pool().filter(q=>missionReviewKeys.includes(id(q))):pool();if(!p.length){alert(lang==='es'?'Selecciona al menos una tabla con preguntas disponibles.':'Select at least one table with available questions.');return}run++;clearInterval(timer);queue=ttReplayQuestionSet?p:shuffle(p);ttMissionAttempts=[];missionMistakes=[];index=questionNumber=correct=wrong=score=0;remaining=mode==='timed'?durationMinutes*60:60;$('home').classList.add('hidden');$('dashboard').classList.add('hidden');$('insights').classList.add('hidden');$('awards').classList.add('hidden');$('garage').classList.add('hidden');$('results').classList.add('hidden');$('play').classList.remove('hidden');if(mode==='speed'||mode==='timed'){deadline=Date.now()+remaining*1000;timer=setInterval(updateClock,250)}nextQuestion()}function nextQuestion(){window.TTAudio?.sfx('question');autoNextDueAt=0;clearTimeout(autoNextTimer);$('next').classList.remove('autoplay');if((mode==='speed'||mode==='timed')&&deadline&&Date.now()>=deadline){finish();return}if((missionReviewActive||ttReplayQuestionSet)&&index>=queue.length){finish();return}if(mode==='exam'&&questionNumber>=20){finish();return}if(index>=queue.length)queue=shuffle(pool()),index=0;active=queue[index++];questionNumber++;answered=false;$('answer').value='';$('answer').disabled=false;$('feedback').textContent='';$('feedback').className='feedback';$('next').classList.add('hidden');$('question').innerHTML=active.op==='mul'?`${active.a} <em>×</em> ${active.b} <em>= ?</em>`:`${active.a*active.b} <em>÷</em> ${active.a} <em>= ?</em>`;$('count').textContent=(lang==='es'?'Reto ':'Challenge ')+questionNumber+(mode==='exam'?'/20':'');$('clock').textContent=(mode==='speed'||mode==='timed')?'⏱ '+clockText(remaining):(lang==='es'?'🌟 ¡Tú puedes!':'🌟 You can do it!');$('score').textContent='⭐ '+score;$('missionCoinsLive').textContent='🪙 '+correct;$('bar').style.width=mode==='exam'?((questionNumber-1)*5)+'%':(mode==='speed'||mode==='timed')?((mode==='timed'?durationMinutes*60-remaining:60-remaining)/(mode==='timed'?durationMinutes*60:60)*100)+'%':'0%';}function press(k){if(answered)return;window.TTAudio?.sfx(k==='del'?'delete':'key');let a=$('answer');if(k==='del')a.value=a.value.slice(0,-1);else if(a.value.length<3)a.value+=k;}function ttAnswerBurst(ok){
 const check=Array.from(document.querySelectorAll('#keys button')).find(b=>b.getAttribute('aria-label')==='Comprobar'||b.getAttribute('aria-label')==='Check'||b.textContent.trim()==='✓');
 const r=check?.getBoundingClientRect();
 const burst=document.createElement('div');burst.className='ttAnswerBurst '+(ok?'ttAnswerBurstOk':'ttAnswerBurstBad');
 burst.textContent=ok?'✓':'✕';burst.setAttribute('aria-hidden','true');
 burst.style.left=(r?r.left+r.width/2:innerWidth/2)+'px';
 burst.style.top=(r?r.top+r.height/2:innerHeight/2)+'px';
 document.body.appendChild(burst);setTimeout(()=>burst.remove(),760);
}
function ttCorrectAnswerOverlay(value){
 const answer=$('answer'),rect=answer.getBoundingClientRect();
 const el=document.createElement('div');
 el.className='ttCorrectAnswerOverlay';
 el.textContent=(lang==='es'?'La respuesta correcta era ':'The correct answer was ')+value;
 el.style.left=Math.min(innerWidth-12,Math.max(12,rect.left+rect.width/2))+'px';
 el.style.top=Math.max(55,rect.top+rect.height/2)+'px';
 document.body.appendChild(el);
 setTimeout(()=>el.remove(),1650);
}
function submit(){
 if(answered||!active||!/^[0-9]{1,3}$/.test($('answer').value))return;
 answered=true;
 ttMissionAttempts.push({a:active.a,b:active.b,op:active.op,result:active.result,given:Number($('answer').value)});
 let ok=Number($('answer').value)===active.result,k=id(active);
 window.TTAudio?.sfx(ok?'correct':'wrong');ttAnswerBurst(ok);
 data[k]??={right:0,wrong:0};
 if(ok){data[k].pending=0}else{
  data[k].pending=(data[k].pending??data[k].wrong??0)+1;
  missionMistakes.push({a:active.a,b:active.b,op:active.op,result:active.result,given:Number($('answer').value),key:k});
 }
 data[k][ok?'right':'wrong']++;
 if(!ok)ttCorrectAnswerOverlay(active.result);
 if(ok){correct++;score+=10}else{wrong++}
 $('feedback').textContent='';$('feedback').className='feedback';
 $('score').textContent='⭐ '+score;$('missionCoinsLive').textContent='🪙 '+correct;$('answer').disabled=true;$('next').classList.add('hidden');save();
 let r=run;autoNextDueAt=Date.now()+(ok?750:1700);
 autoNextTimer=setTimeout(()=>{if(r===run&&answered&&!$('play').classList.contains('hidden')&&!$('exitDialog').open)nextQuestion()},ok?750:1700);
}
function requestExit(){if($('play').classList.contains('hidden'))return;exitPausedAt=Date.now();clearTimeout(autoNextTimer);$('next').style.animationPlayState='paused';const style=document.createElement('style');style.id='pauseAutoStyle';style.textContent='#next.autoplay::before{animation-play-state:paused!important}';document.head.appendChild(style);$('exitDialog').showModal()}
function cancelExit(){if(!$('exitDialog').open)return;let pause=Date.now()-exitPausedAt;exitPausedAt=0;if(mode==='speed'||mode==='timed')deadline+=pause;if(autoNextDueAt&&answered&&$('next').classList.contains('autoplay')){autoNextDueAt+=pause;let r=run;autoNextTimer=setTimeout(()=>{if(r===run&&answered&&!$('play').classList.contains('hidden'))nextQuestion()},Math.max(0,autoNextDueAt-Date.now()))}document.getElementById('pauseAutoStyle')?.remove();$('exitDialog').close()}
function confirmExit(){exitPausedAt=0;autoNextDueAt=0;document.getElementById('pauseAutoStyle')?.remove();$('exitDialog').close();finish()}
$('exitDialog').addEventListener('cancel',e=>{e.preventDefault();cancelExit()});

const ROCKET_KEY='tt-rocket-garage-v1';
const rocketParts=[
{id:'body_red',cat:'body',name:'Classic Red',es:'Rojo clásico',price:0,color:'#f05d63'},
{id:'body_blue',cat:'body',name:'Ocean Blue',es:'Azul océano',price:100,color:'#55c9ff'},
{id:'body_purple',cat:'body',name:'Cosmic Purple',es:'Morado cósmico',price:220,color:'#ad8bff'},
{id:'body_gold',cat:'body',name:'Golden Rocket',es:'Cohete dorado',price:450,color:'#ffd46d'},
{id:'nose_classic',cat:'nose',name:'Classic Nose',es:'Punta clásica',price:0,color:'#ffd56f'},
{id:'nose_sky',cat:'nose',name:'Sky Nose',es:'Punta celeste',price:100,color:'#6bdaf5'},
{id:'nose_star',cat:'nose',name:'Star Nose',es:'Punta estelar',price:260,color:'#f8b0eb'},
{id:'nose_gold',cat:'nose',name:'Golden Nose',es:'Punta dorada',price:400,color:'#ffdf65'},
{id:'wings_classic',cat:'wings',name:'Classic Fins',es:'Aletas clásicas',price:0,color:'#65d6c2'},
{id:'wings_red',cat:'wings',name:'Turbo Fins',es:'Aletas turbo',price:130,color:'#ff8782'},
{id:'wings_blue',cat:'wings',name:'Sky Wings',es:'Alas celestes',price:240,color:'#72b6ff'},
{id:'wings_gold',cat:'wings',name:'Golden Wings',es:'Alas doradas',price:380,color:'#ffcf62'},
{id:'flame_orange',cat:'flame',name:'Orange Flame',es:'Llama naranja',price:0,color:'#ff9b45'},
{id:'flame_blue',cat:'flame',name:'Blue Flame',es:'Llama azul',price:180,color:'#6be5ff'},
{id:'flame_pink',cat:'flame',name:'Pink Flame',es:'Llama rosa',price:260,color:'#ff87c5'},
{id:'flame_rainbow',cat:'flame',name:'Rainbow Flame',es:'Llama arcoíris',price:450,color:'#b18aff'},
{id:'window_round',cat:'window',name:'Round Window',es:'Ventana redonda',price:0,color:'#a8e8ff'},
{id:'window_heart',cat:'window',name:'Heart Window',es:'Ventana corazón',price:130,color:'#ffb3d7'},
{id:'window_star',cat:'window',name:'Star Window',es:'Ventana estrella',price:230,color:'#ffe58a'},
{id:'window_space',cat:'window',name:'Space Window',es:'Ventana espacial',price:340,color:'#a6a4ff'},
{id:'extra_none',cat:'extra',name:'No Extra',es:'Sin accesorio',price:0,color:'#a5b4d4'},
{id:'extra_star',cat:'extra',name:'Star Badge',es:'Insignia estrella',price:80,color:'#ffdd77'},
{id:'extra_bolt',cat:'extra',name:'Lightning Badge',es:'Insignia rayo',price:170,color:'#89e7fa'},
{id:'extra_planet',cat:'extra',name:'Planet Badge',es:'Insignia planeta',price:280,color:'#ff9fca'},{"id":"body_v5","cat":"body","name":"Armored Shell","es":"Casco blindado","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor"]},{"id":"body_v6","cat":"body","name":"Twin Tanks","es":"Depósitos dobles","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["interceptor","heavy"]},{"id":"body_v7","cat":"body","name":"Speedster","es":"Aerodinámico","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["heavy"]},{"id":"body_v8","cat":"body","name":"Segmented","es":"Segmentado","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","heavy"]},{"id":"body_v9","cat":"body","name":"Crystal Core","es":"Núcleo cristalino","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor"]},{"id":"body_v10","cat":"body","name":"Alien Vessel","es":"Nave alienígena","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["interceptor","heavy"]},{"id":"body_v11","cat":"body","name":"Reactor Hull","es":"Casco reactor","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["heavy"]},{"id":"body_v12","cat":"body","name":"Orbital Frame","es":"Estructura orbital","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","heavy"]},{"id":"nose_v5","cat":"nose","name":"Needle Tip","es":"Punta aguja","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor"]},{"id":"nose_v6","cat":"nose","name":"Twin Spikes","es":"Puntas dobles","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["interceptor","heavy"]},{"id":"nose_v7","cat":"nose","name":"Radar Dome","es":"Cúpula radar","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["heavy"]},{"id":"nose_v8","cat":"nose","name":"Drill Head","es":"Cabezal taladro","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","heavy"]},{"id":"nose_v9","cat":"nose","name":"Energy Crystal","es":"Cristal energético","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor"]},{"id":"nose_v10","cat":"nose","name":"Orbital Crown","es":"Corona orbital","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["interceptor","heavy"]},{"id":"nose_v11","cat":"nose","name":"Floating Core","es":"Núcleo flotante","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["heavy"]},{"id":"nose_v12","cat":"nose","name":"Quantum Antenna","es":"Antena cuántica","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","heavy"]},{"id":"wings_v5","cat":"wings","name":"Delta Wings","es":"Alas delta","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor"]},{"id":"wings_v6","cat":"wings","name":"Double Fins","es":"Aletas dobles","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["interceptor","heavy"]},{"id":"wings_v7","cat":"wings","name":"Reverse Wings","es":"Alas invertidas","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["heavy"]},{"id":"wings_v8","cat":"wings","name":"Mechanical Wings","es":"Alas mecánicas","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","heavy"]},{"id":"wings_v9","cat":"wings","name":"Energy Wings","es":"Alas energéticas","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor"]},{"id":"wings_v10","cat":"wings","name":"Floating Fins","es":"Aletas flotantes","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["interceptor","heavy"]},{"id":"wings_v11","cat":"wings","name":"Solar Wings","es":"Alas solares","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["heavy"]},{"id":"wings_v12","cat":"wings","name":"Orbital Rings","es":"Anillos orbitales","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","heavy"]},{"id":"flame_v5","cat":"flame","name":"Twin Flames","es":"Llamas dobles","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor","heavy"]},{"id":"flame_v6","cat":"flame","name":"Triple Thrusters","es":"Tres propulsores","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["compact","interceptor","heavy"]},{"id":"flame_v7","cat":"flame","name":"Cold Jet","es":"Chorro frío","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["compact","interceptor","heavy"]},{"id":"flame_v8","cat":"flame","name":"Pulse Burn","es":"Combustión pulsante","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","interceptor","heavy"]},{"id":"flame_v9","cat":"flame","name":"Plasma Drive","es":"Motor de plasma","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor","heavy"]},{"id":"flame_v10","cat":"flame","name":"Ion Engine","es":"Motor iónico","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["compact","interceptor","heavy"]},{"id":"flame_v11","cat":"flame","name":"Energy Vortex","es":"Vórtice energético","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["compact","interceptor","heavy"]},{"id":"flame_v12","cat":"flame","name":"Antimatter","es":"Antimateria","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","interceptor","heavy"]},{"id":"window_v5","cat":"window","name":"Panorama","es":"Panorámica","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor","heavy"]},{"id":"window_v6","cat":"window","name":"Hexagon","es":"Hexágono","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["compact","interceptor","heavy"]},{"id":"window_v7","cat":"window","name":"Bubble Canopy","es":"Cúpula burbuja","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["compact","interceptor","heavy"]},{"id":"window_v8","cat":"window","name":"Robot Visor","es":"Visor robótico","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","interceptor","heavy"]},{"id":"window_v9","cat":"window","name":"Holographic","es":"Holográfica","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor","heavy"]},{"id":"window_v10","cat":"window","name":"Liquid Crystal","es":"Cristal líquido","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["compact","interceptor","heavy"]},{"id":"window_v11","cat":"window","name":"Orbital Cockpit","es":"Cabina orbital","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["compact","interceptor","heavy"]},{"id":"window_v12","cat":"window","name":"Clear Core","es":"Núcleo transparente","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","interceptor","heavy"]},{"id":"extra_v5","cat":"extra","name":"Radar","es":"Radar","price":290,"color":"#79bfff","tier":2,"variant":4,"compat":["compact","interceptor","heavy"]},{"id":"extra_v6","cat":"extra","name":"Solar Panel","es":"Panel solar","price":350,"color":"#f9ae74","tier":2,"variant":5,"compat":["compact","interceptor","heavy"]},{"id":"extra_v7","cat":"extra","name":"Fuel Tank","es":"Depósito lateral","price":420,"color":"#8fe0c2","tier":2,"variant":6,"compat":["compact","interceptor","heavy"]},{"id":"extra_v8","cat":"extra","name":"Robot Arm","es":"Brazo robótico","price":500,"color":"#c7a3ff","tier":2,"variant":7,"compat":["compact","interceptor","heavy"]},{"id":"extra_v9","cat":"extra","name":"Mini Satellite","es":"Mini satélite","price":780,"color":"#6edbf4","tier":3,"variant":8,"compat":["compact","interceptor","heavy"]},{"id":"extra_v10","cat":"extra","name":"Energy Shield","es":"Escudo energético","price":930,"color":"#f8c76a","tier":3,"variant":9,"compat":["compact","interceptor","heavy"]},{"id":"extra_v11","cat":"extra","name":"Orbital Rings","es":"Anillos orbitales","price":1100,"color":"#f48fae","tier":3,"variant":10,"compat":["compact","interceptor","heavy"]},{"id":"extra_v12","cat":"extra","name":"Companion Drone","es":"Dron acompañante","price":1450,"color":"#92a3ff","tier":3,"variant":11,"compat":["compact","interceptor","heavy"]},{"id":"support_0","cat":"support","name":"Mini Rocket","es":"Minicohete","price":100,"color":"#79bfff","tier":1,"variant":0,"compat":["compact","interceptor","heavy"]},{"id":"support_1","cat":"support","name":"Scout Drone","es":"Dron explorador","price":140,"color":"#f9ae74","tier":1,"variant":1,"compat":["compact","interceptor","heavy"]},{"id":"support_2","cat":"support","name":"Tiny Satellite","es":"Minisatélite","price":180,"color":"#8fe0c2","tier":1,"variant":2,"compat":["compact","interceptor","heavy"]},{"id":"support_3","cat":"support","name":"Space Buddy","es":"Amigo espacial","price":220,"color":"#c7a3ff","tier":1,"variant":3,"compat":["compact","interceptor","heavy"]},{"id":"support_4","cat":"support","name":"Twin Fighter","es":"Caza doble","price":350,"color":"#6edbf4","tier":2,"variant":4,"compat":["compact","interceptor","heavy"]},{"id":"support_5","cat":"support","name":"Cargo Drone","es":"Dron de carga","price":450,"color":"#f8c76a","tier":2,"variant":5,"compat":["compact","interceptor","heavy"]},{"id":"support_6","cat":"support","name":"UFO Scout","es":"OVNI explorador","price":550,"color":"#f48fae","tier":2,"variant":6,"compat":["compact","interceptor","heavy"]},{"id":"support_7","cat":"support","name":"Mini Interceptor","es":"Miniinterceptor","price":680,"color":"#92a3ff","tier":2,"variant":7,"compat":["compact","interceptor","heavy"]},{"id":"support_8","cat":"support","name":"Plasma Guardian","es":"Guardián de plasma","price":850,"color":"#d5a6fa","tier":3,"variant":8,"compat":["compact","interceptor","heavy"]},{"id":"support_9","cat":"support","name":"Crystal Ship","es":"Nave cristalina","price":1050,"color":"#78efc5","tier":3,"variant":9,"compat":["compact","interceptor","heavy"]},{"id":"support_10","cat":"support","name":"Alien Escort","es":"Escolta alienígena","price":1300,"color":"#fbdc84","tier":3,"variant":10,"compat":["compact","interceptor","heavy"]},{"id":"support_11","cat":"support","name":"Quantum Drone","es":"Dron cuántico","price":1600,"color":"#a5d8ff","tier":3,"variant":11,"compat":["compact","interceptor","heavy"]}];
const rocketCats=['body','nose','wings','flame','window','extra','support'];
const catLabels={body:['🎨 Body','🎨 Cuerpo'],nose:['🔺 Nose','🔺 Punta'],wings:['🪽 Wings','🪽 Alas'],flame:['🔥 Flame','🔥 Fuego'],window:['🪟 Window','🪟 Ventana'],extra:['✨ Extras','✨ Extras'],support:['🛸 Support Ships','🛸 Naves de apoyo']};
let rocketState={coins:0,owned:['body_red','nose_classic','wings_classic','flame_orange','window_round','extra_none'],equipped:{body:'body_red',nose:'nose_classic',wings:'wings_classic',flame:'flame_orange',window:'window_round',extra:'extra_none'},rewardedAchievements:[],rewardedMissions:[],family:'compact',fleet:[],designs:{}};
try{let v=JSON.parse(window.TTLocalStore.getItem(ROCKET_KEY));if(v&&typeof v==='object'){rocketState={...rocketState,...v,equipped:{...rocketState.equipped,...v.equipped}}}}catch{}
rocketState.family='compact';
let garageCategory='body',garageTier=1,garagePreviewId=null,pendingPurchase=null;
function rocketLang(){return window.TTLocalStore.getItem('cosmotablas-language')==='es'?'es':'en'}
function rocketText(en,es){return rocketLang()==='es'?es:en}
function persistRocket(){try{window.TTLocalStore.setItem(ROCKET_KEY,JSON.stringify(rocketState))}catch{}TTProfiles.sync()}
function part(id){return rocketParts.find(p=>p.id===id)||rocketParts[0]}
rocketParts.forEach((p,i)=>{p.tier??=1;p.variant??=i%4;p.compat??=['compact','interceptor','heavy']});
function ensureExtraBodyParts(){
 const extras=[
  {id:'body_v13',cat:'body',name:'Twin Catamaran',es:'Catamarán doble',price:1650,color:'#7dd9ff',tier:3,variant:12,compat:['compact','interceptor','heavy']},
  {id:'body_v14',cat:'body',name:'Wide Saucer',es:'Platillo ancho',price:1820,color:'#f7c86f',tier:3,variant:13,compat:['compact','interceptor','heavy']},
  {id:'body_v15',cat:'body',name:'Hammerhead Hull',es:'Casco martillo',price:1960,color:'#88e2b1',tier:3,variant:14,compat:['compact','interceptor','heavy']},
  {id:'body_v16',cat:'body',name:'Twin Deck',es:'Doble cubierta',price:2140,color:'#f38fb0',tier:3,variant:15,compat:['compact','interceptor','heavy']},
  {id:'body_v17',cat:'body',name:'Orbital Saucer',es:'Platillo orbital',price:2320,color:'#a8a7ff',tier:3,variant:16,compat:['compact','interceptor','heavy']},
  {id:'body_v18',cat:'body',name:'Beetle Cruiser',es:'Crucero escarabajo',price:2500,color:'#8fe8d3',tier:3,variant:17,compat:['compact','interceptor','heavy']},
  {id:'body_v19',cat:'body',name:'Bridge Catamaran',es:'Catamarán espacial',price:2650,color:'#75d8f3',tier:3,variant:18,compat:['compact','interceptor','heavy']},
  {id:'body_v20',cat:'body',name:'Delta Spear',es:'Nave delta',price:2800,color:'#e9ae75',tier:3,variant:19,compat:['compact','interceptor','heavy']},
  {id:'body_v21',cat:'body',name:'Sidewinder',es:'Nave asimétrica',price:2950,color:'#a8e09d',tier:3,variant:20,compat:['compact','interceptor','heavy']},
  {id:'body_v22',cat:'body',name:'Orbital Ring',es:'Nave anular',price:3150,color:'#bba3fb',tier:3,variant:21,compat:['compact','interceptor','heavy']},
  {id:'body_v23',cat:'body',name:'Stellar Manta',es:'Mantarraya estelar',price:3300,color:'#8fd7d0',tier:3,variant:22,compat:['compact','interceptor','heavy']},
  {id:'body_v24',cat:'body',name:'Twin Fork',es:'Nave horquilla',price:3450,color:'#f7a9b6',tier:3,variant:23,compat:['compact','interceptor','heavy']}
 ];
 extras.forEach(p=>{if(!rocketParts.some(x=>x.id===p.id))rocketParts.push(p)});
}
ensureExtraBodyParts();

// Attachment positions are measured in the body SVG's shared 180 x 270 coordinate system.
// Every body supplies its own anchor and scale. Arrays: [x, y, scale].
const ROCKET_BODY_ANCHORS = {
 0:{nose:[90,94,.96],windows:[[90,122,.86]],left:[68,170,.93],right:[112,170,.93],engines:[[90,199,.88]],extra:[90,169,.86]},
 1:{nose:[90,92,.88],windows:[[90,123,.76]],left:[73,167,.82],right:[107,167,.82],engines:[[90,201,.83]],extra:[90,170,.76]},
 2:{nose:[90,91,1.02],windows:[[90,124,.98]],left:[62,172,.98],right:[118,172,.98],engines:[[90,200,.93]],extra:[90,169,.90]},
 3:{nose:[90,96,.92],windows:[[90,128,.84]],left:[65,168,.89],right:[115,168,.89],engines:[[90,198,.84]],extra:[90,171,.84]},
 4:{nose:[90,94,.97],windows:[[90,124,.87]],left:[64,170,.88],right:[116,170,.88],engines:[[90,198,.86]],extra:[90,173,.86]},
 5:{nose:[90,91,.91],windows:[[90,127,.88]],left:[59,171,.94],right:[121,171,.94],engines:[[76,199,.64],[104,199,.64]],extra:[90,171,.82]},
 6:{nose:[90,95,.92],windows:[[90,125,.82]],left:[69,168,.86],right:[111,168,.86],engines:[[90,199,.84]],extra:[90,171,.78]},
 7:{nose:[90,95,.94],windows:[[90,125,.87]],left:[66,168,.93],right:[114,168,.93],engines:[[90,200,.85]],extra:[90,172,.85]},
 8:{nose:[90,96,.91],windows:[[90,126,.85]],left:[65,169,.88],right:[115,169,.88],engines:[[90,203,.85]],extra:[90,169,.85]},
 9:{nose:[90,92,.90],windows:[[90,130,.87]],left:[57,166,.87],right:[123,166,.87],engines:[[77,199,.63],[103,199,.63]],extra:[90,175,.80]},
10:{nose:[90,98,.90],windows:[[90,133,.95]],left:[59,170,.94],right:[121,170,.94],engines:[[90,201,.92]],extra:[90,179,.84]},
11:{nose:[90,87,.85],windows:[[90,127,.82]],left:[67,172,.91],right:[113,172,.91],engines:[[76,198,.66],[104,198,.66]],extra:[90,176,.82]},
12:{nose:[90,133,.36],noses:[[64,103,.39],[116,103,.39]],windows:[[90,145,.38],[64,160,.30],[116,160,.30]],left:[54,163,.38],right:[126,163,.38],engines:[[64,205,.49],[116,205,.49]],extra:[90,155,.35]},
13:{nose:[90,105,.68],windows:[[90,145,.84]],left:[48,164,.60],right:[132,164,.60],engines:[[74,197,.59],[106,197,.59]],extra:[90,179,.66]},
14:{nose:[90,105,.82],windows:[[90,148,.77]],left:[71,164,.76],right:[109,164,.76],engines:[[76,198,.60],[104,198,.60]],extra:[90,180,.71]},
15:{nose:[90,88,.91],windows:[[90,166,.60]],left:[64,167,.79],right:[116,167,.79],engines:[[90,196,.82]],extra:[90,186,.55]},
16:{nose:[90,108,.40],windows:[[90,134,.53]],left:[45,150,.46],right:[135,150,.46],engines:[[72,179,.48],[108,179,.48]],extra:[90,161,.48]},
17:{nose:[90,85,.92],windows:[[90,126,.83]],left:[62,165,.91],right:[118,165,.91],engines:[[90,205,.91]],extra:[90,175,.79]},
 18:{nose:[90,111,.47],noses:[[62,102,.44],[118,102,.44]],windows:[[90,147,.43],[62,157,.34],[118,157,.34]],left:[52,165,.42],right:[128,165,.42],engines:[[62,203,.52],[118,203,.52]],extra:[90,169,.45]},
 19:{nose:[90,105,.60],windows:[[90,146,.60],[90,172,.47]],left:[48,163,.38],right:[132,163,.38],engines:[[64,185,.50],[90,201,.48],[116,185,.50]],extra:[90,185,.48]},
 20:{nose:[73,98,.56],windows:[[73,139,.50],[73,167,.44]],left:[53,156,.46],right:[120,170,.54],engines:[[70,205,.61],[114,186,.42]],extra:[92,182,.45]},
 21:{nose:[90,113,.40],windows:[[90,151,.49],[90,178,.40]],left:[45,154,.35],right:[135,154,.35],engines:[[62,191,.46],[118,191,.46]],extra:[90,190,.42]},
 22:{nose:[90,109,.50],windows:[[70,146,.42],[90,135,.44],[110,146,.42]],left:[45,150,.30],right:[135,150,.30],engines:[[61,178,.44],[90,188,.45],[119,178,.44]],extra:[90,177,.39]},
 23:{nose:[90,130,.36],noses:[[57,102,.37],[123,102,.37]],windows:[[90,151,.47],[90,177,.40]],left:[48,157,.35],right:[132,157,.35],engines:[[62,202,.47],[118,202,.47]],extra:[90,188,.43]}
};
rocketParts.filter(p=>p.cat==='body').forEach(p=>{
 p.anchors=ROCKET_BODY_ANCHORS[p.variant]||ROCKET_BODY_ANCHORS[0];
});

function fits(p){return true}
function selectFamily(f){if(f===rocketState.family)return;window.TTAudio?.sfx('equip');rocketState.designs??={};rocketState.designs[rocketState.family]={...rocketState.equipped};rocketState.family=f;let saved=rocketState.designs[f];if(saved)rocketState.equipped={...rocketState.equipped,...saved};for(let c of rocketCats.filter(c=>c!=='support')){let p=part(rocketState.equipped[c]);if(!fits(p)){let first=rocketParts.find(x=>x.cat===c&&rocketState.owned.includes(x.id)&&fits(x));if(first)rocketState.equipped[c]=first.id}}garagePreviewId=null;persistRocket();renderGarage()}
function setTier(n){garageTier=n;garagePreviewId=null;renderGarage()}
function setGarageCat(c){garageCategory=c;garagePreviewId=null;renderGarage()}
function previewPart(id){garagePreviewId=id;renderGarage()}
function shipSVG(p,x,y,scale=1){const c=p.color,v=p.variant;return `<g transform="translate(${x} ${y}) scale(${scale})" class="supportShip"><path d="M-7 10L0 24L7 10" fill="${v>=8?'#8ff8ff':'#ffb75c'}"/><path d="${['M0 -21L14 5L0 16L-14 5Z','M0 -18L20 0L13 14L-13 14L-20 0Z','M-21 -6L21 -6L13 12L-13 12Z','M0 -23L22 10L0 14L-22 10Z'][v%4]}" fill="${c}" stroke="#223b65" stroke-width="3"/><path d="M-12 3L-26 13L-11 12M12 3L26 13L11 12" fill="${v%2?'#ffc777':'#9ee8fa'}" stroke="#223b65" stroke-width="2"/><path d="M-13 -2L-8 -9M13 -2L8 -9" stroke="#e5f9ff" stroke-width="2"/><circle cx="-15" cy="10" r="2" fill="#ffe6a1"/><circle cx="15" cy="10" r="2" fill="#ffe6a1"/><circle r="${v>=8?8:6}" fill="#c7f4ff" stroke="#264c75" stroke-width="2"/><path d="M-3 -3L1 -6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>${v>=8?'<circle r="17" fill="none" stroke="#d9b8ff" stroke-width="2" stroke-dasharray="5 4"/>':''}</g>`}

function rocketSVG(equipped=rocketState.equipped,small=false){
 const get=c=>part(equipped[c]);
 const body=get('body'),nose=get('nose'),wings=get('wings'),flame=get('flame'),win=get('window'),extra=get('extra');
 const b=body.variant||0,n=nose.variant||0,w=wings.variant||0,f=flame.variant||0,v=win.variant||0,e=extra.variant||0;
 const baseBodyPaths=['M68 94Q90 78 112 94L110 194Q90 208 70 194Z','M75 91Q90 78 105 91L103 199Q90 207 77 199Z','M61 94Q90 77 119 94L116 195Q90 210 64 195Z','M70 94Q90 81 110 94L119 174L107 201H73L61 174Z','M64 91L116 91L119 193L90 208L61 193Z','M70 89L110 89L122 155L108 200H72L58 155Z','M65 96Q90 72 115 96L106 199H74Z','M66 89H114L109 112H118L110 140H115L109 169H113L105 201H75L67 169H71L65 140H72L62 112Z','M90 78L116 103L114 183L90 209L66 183L64 103Z','M90 78Q127 91 116 137Q126 177 90 210Q54 177 64 137Q53 91 90 78Z','M63 92H117L122 183L104 207H76L58 183Z','M75 82H105L122 110L113 188L90 211L67 188L58 110Z'];
 const nosePath=['M62 96Q68 48 90 24Q112 48 118 96Z','M65 96Q68 58 90 39Q112 58 115 96Z','M61 96L90 24L119 96Z','M61 96H119V66Q90 48 61 66Z','M65 96L90 14L115 96Z','M61 96L77 43L90 67L103 43L119 96Z','M62 96Q57 50 90 49Q123 50 118 96Z','M62 96L90 31L118 96Z','M65 96L90 9L115 96Z','M62 96L76 43L90 21L104 43L118 96Z','M62 96L90 39L118 96Z','M63 96L90 18L117 96Z'];
 const wingPaths=['M68 146Q42 152 32 203L70 187Z','M68 143L26 180L34 214L71 187Z','M69 150L18 201L72 190Z','M67 150Q30 144 34 214L71 187Z','M67 145L18 204L71 194Z','M68 145L33 173L22 213L73 195Z','M68 145L24 159L42 218L72 191Z','M68 150L21 167L27 211L70 196Z','M68 141L16 203L73 191Z','M67 147L24 164L31 203L72 192Z','M67 145L14 184L33 216L71 191Z','M67 146L21 164L18 207L72 190Z'];
 const windowShape=v===1?'<ellipse cx="90" cy="122" rx="16" ry="22"/>':v===2?'<rect x="73" y="105" width="34" height="34" rx="5"/>':v===3?'<circle cx="80" cy="121" r="12"/><circle cx="102" cy="121" r="12"/>':v===4?'<rect x="65" y="108" width="50" height="27" rx="12"/>':v===5?'<path d="M75 104H105L117 121L105 138H75L63 121Z"/>':v===6?'<ellipse cx="90" cy="121" rx="28" ry="24"/>':v===7?'<rect x="65" y="110" width="50" height="23" rx="5"/>':v===8?'<path d="M67 114L90 99L113 114L107 139H73Z"/>':v===9?'<path d="M90 98L114 121L90 144L66 121Z"/>':v===10?'<ellipse cx="90" cy="121" rx="30" ry="17"/>':v===11?'<circle cx="90" cy="121" r="25"/>':'<circle cx="90" cy="121" r="19"/>';
 const emblem=e===0?'':e===1?'<path d="m90 150 5 9 10 2-8 7 2 11-9-5-9 5 2-11-8-7 10-2Z"/>':e===2?'<path d="M96 148L81 164H91L85 180L103 160H93Z"/>':e===3?'<circle cx="90" cy="162" r="10"/><ellipse cx="90" cy="162" rx="18" ry="5" fill="none" stroke="#ffec9a" stroke-width="3"/>':e===4?'<path d="M80 148H100V167H80Z"/>':e===5?'<path d="M72 158H108L90 176Z"/>':e===6?'<path d="M80 149L100 149L108 166L90 177L72 166Z"/>':e===7?'<path d="M79 151H101V176H79Z"/>':e===8?'<path d="M90 148L105 160L90 178L75 160Z"/>':e===9?'<circle cx="90" cy="162" r="17" fill="none" stroke="#bbf9ff" stroke-width="4"/>':e===10?'<ellipse cx="90" cy="161" rx="26" ry="10" fill="none" stroke="#d7b4ff" stroke-width="4"/>':'<path d="M76 154L90 143L104 154V174L90 181L76 174Z"/>';
 function flameShape(){
  let exhaust='';
  if(f<4){let col=flame.color;exhaust=`<path d="M76 197Q${f===2?55:68} 225 90 ${f===3?261:246}Q${f===3?126:113} 225 104 197Z" fill="${col}"/><path d="M84 203Q78 228 90 239Q102 228 96 203Z" fill="#fff1a4"/>`}
  else if(f<8){let count=f===4?2:f===5?3:1;for(let k=0;k<count;k++){let x=90+(k-(count-1)/2)*18;exhaust+=`<path d="M${x-9} 198Q${x-14} 221 ${x} ${f===7?258:241}Q${x+14} 221 ${x+9} 198Z" fill="${flame.color}"/><path d="M${x-3} 205L${x} 229L${x+3} 205" fill="#e8fbff"/>`}}
  else{exhaust=`<ellipse cx="90" cy="225" rx="${f===10?22:13}" ry="${f===11?33:29}" fill="${flame.color}" opacity=".45"/><path d="M78 197Q${f===10?46:72} 226 90 259Q${f===10?134:108} 226 102 197Z" fill="${flame.color}"/><path d="M86 204Q80 227 90 245Q100 227 94 204Z" fill="#e5ffff"/>${f>=10?'<circle cx="90" cy="241" r="17" fill="none" stroke="#b7faff" stroke-width="3"/>':''}`}
  return exhaust;
 }
 function bodyMarkupForVariant(variant,color){
  if(variant===12){
   return `<g class="rocketBody hullTwinCatamaran">
     <path d="M55 101Q64 89 72 101L76 189Q74 207 65 209Q54 207 53 189Z" fill="${color}" stroke="#354565" stroke-width="3"/>
     <path d="M108 101Q116 89 125 101L127 189Q126 207 115 209Q106 207 104 189Z" fill="${color}" stroke="#354565" stroke-width="3"/>
     <path d="M70 133H110L110 157H70Z" fill="${color}" stroke="#354565" stroke-width="3"/>
     <path d="M58 116V190M122 116V190M75 138H105" stroke="#fff" stroke-width="2" opacity=".55"/>
   </g>`;
  }
  if(variant===13){
   return `
   <g class="rocketBody hullWideSaucer">
    <ellipse cx="90" cy="151" rx="44" ry="55" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <ellipse cx="90" cy="136" rx="27" ry="20" fill="#ffffff" opacity=".18"/>
    <path d="M46 151H134M56 176Q90 189 124 176" stroke="#e8faff" stroke-width="2.1" opacity=".55"/>
    <path d="M55 118Q71 103 90 103Q109 103 125 118" fill="none" stroke="#fff3c0" stroke-width="2.6" opacity=".65"/>
    <circle cx="61" cy="152" r="2.1" fill="#dceeff"/><circle cx="119" cy="152" r="2.1" fill="#dceeff"/>
   </g>`;
  }
  if(variant===14){
   return `
   <g class="rocketBody hullHammerhead">
    <path d="M58 101H122L118 132H108L111 192Q90 212 69 192L72 132H62Z" fill="${color}" stroke="#354565" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M78 101H102V194H78Z" fill="#ffffff" opacity=".08"/>
    <path d="M64 115H116M70 146H110M72 178H108" stroke="#e7faff" stroke-width="2" opacity=".55"/>
    <circle cx="75" cy="146" r="2" fill="#dceeff"/><circle cx="105" cy="146" r="2" fill="#dceeff"/>
   </g>`;
  }
  if(variant===15){
   return `
   <g class="rocketBody hullTwinDeck">
    <path d="M69 93Q90 74 111 93L108 140Q90 156 72 140Z" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <path d="M62 138Q90 122 118 138L114 196Q90 210 66 196Z" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <path d="M72 102Q90 92 108 102" stroke="#fff3c0" stroke-width="2.2" opacity=".7"/>
    <path d="M69 151H111M71 182H109" stroke="#e7faff" stroke-width="2" opacity=".55"/>
    <path d="M70 100Q74 96 79 98L77 135Q74 139 70 136Z" fill="#ffffff" opacity=".16"/>
   </g>`;
  }
  if(variant===16){
   return `
   <g class="rocketBody hullOrbitalSaucer">
    <ellipse cx="90" cy="150" rx="48" ry="35" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <ellipse cx="90" cy="123" rx="24" ry="18" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <ellipse cx="90" cy="150" rx="62" ry="10" fill="none" stroke="#d7b4ff" stroke-width="4" opacity=".85"/>
    <ellipse cx="90" cy="150" rx="34" ry="4" fill="none" stroke="#ffffff" stroke-width="1.8" opacity=".5"/>
    <path d="M58 150H122" stroke="#e7faff" stroke-width="2" opacity=".55"/>
   </g>`;
  }
  if(variant===17){
   return `
   <g class="rocketBody hullBeetle">
    <path d="M90 82Q120 87 121 118Q124 126 119 137L116 191Q106 207 90 211Q74 207 64 191L61 137Q56 126 59 118Q60 87 90 82Z" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <path d="M68 112Q90 100 112 112" stroke="#fff3c0" stroke-width="2.2" opacity=".72"/>
    <path d="M73 138Q90 148 107 138M73 170Q90 180 107 170" fill="none" stroke="#e7faff" stroke-width="2" opacity=".55"/>
    <path d="M71 104Q78 92 88 91L80 196Q74 191 70 180Z" fill="#ffffff" opacity=".16"/>
    <circle cx="90" cy="190" r="7" fill="#dceeff" stroke="#405675" stroke-width="1.1"/>
   </g>`;
  }
  if(variant===18){
   return `<g class="rocketBody hullBridgeCatamaran">
    <path d="M47 108Q56 92 68 108L72 190Q66 211 55 210Q44 209 44 190Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M112 108Q124 92 133 108L136 190Q136 209 125 210Q114 211 108 190Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M63 135L117 135L117 160L63 160Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M66 139H114M51 170V192M129 170V192" stroke="#fff" stroke-width="2" opacity=".52"/>
    <rect x="83" y="140" width="14" height="15" rx="4" fill="#264663" opacity=".26"/>
   </g>`;
  }
  if(variant===19){
   return `<g class="rocketBody hullDelta">
    <path d="M90 90L146 185L108 180L90 206L72 180L34 185Z" fill="${color}" stroke="#354565" stroke-width="3" stroke-linejoin="round"/>
    <path d="M90 105L108 176L90 191L72 176Z" fill="#fff" opacity=".15"/>
    <path d="M51 175L90 112L129 175M90 112V192" fill="none" stroke="#eafaff" stroke-width="2" opacity=".65"/>
   </g>`;
  }
  if(variant===20){
   return `<g class="rocketBody hullSidewinder">
    <path d="M57 93L92 99L101 181L81 209L51 194L48 114Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M88 148L135 128L143 146L137 190L109 196L95 180Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M93 152L119 147L120 157L94 169Z" fill="#354565"/>
    <path d="M57 112L81 116M58 184L80 194M117 162L134 158" stroke="#fff" stroke-width="2" opacity=".55"/>
   </g>`;
  }
  if(variant===21){
   return `<g class="rocketBody hullRing">
    <path fill-rule="evenodd" d="M90 97C120 97 143 122 143 151C143 184 121 204 90 204C59 204 37 184 37 151C37 122 60 97 90 97ZM90 124C73 124 65 135 65 151C65 167 75 178 90 178C105 178 115 167 115 151C115 135 107 124 90 124Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M60 147H120M83 122V181M97 122V181" stroke="#d8f6ff" stroke-width="2" opacity=".45"/>
    <rect x="77" y="143" width="26" height="16" rx="7" fill="${color}" stroke="#354565" stroke-width="2"/>
   </g>`;
  }
  if(variant===22){
   return `<g class="rocketBody hullManta">
    <path d="M90 100Q113 111 126 128L155 145Q140 169 122 173L112 187L90 198L68 187L58 173Q40 169 25 145L54 128Q67 111 90 100Z" fill="${color}" stroke="#354565" stroke-width="3"/>
    <path d="M90 108L90 192M44 146Q70 141 90 129Q110 141 136 146" stroke="#e8ffff" stroke-width="2.5" fill="none" opacity=".6"/>
    <path d="M58 157Q76 169 90 169Q104 169 122 157" fill="none" stroke="#354565" stroke-width="2" opacity=".4"/>
   </g>`;
  }
  if(variant===23){
   return `<g class="rocketBody hullFork">
    <path d="M48 105L60 94L73 108L72 170L90 180L108 170L107 108L120 94L132 105L137 189L118 208L90 194L62 208L43 189Z" fill="${color}" stroke="#354565" stroke-width="3" stroke-linejoin="round"/>
    <path d="M73 159L107 159L111 187L90 195L69 187Z" fill="${color}" stroke="#354565" stroke-width="2.5"/>
    <path d="M53 118V181M127 118V181M75 170H105" stroke="#fff" stroke-width="2" opacity=".55"/>
   </g>`;
  }
  const p=baseBodyPaths[variant%12];
  const width=variant===4?1.48:variant===5?1.56:variant===6?1.34:variant===7?1.41:variant===8?1.38:variant===9?1.44:variant===10?1.52:variant===11?1.47:variant===2?1.43:variant===3?1.4:1.36;
  const hullTransform=`translate(90 0) scale(${width} 1) translate(-90 0)`;
  return `
   <path transform="${hullTransform}" d="${p}" fill="${color}" stroke="#354565" stroke-width="2.5" stroke-linejoin="round"/>
   <g transform="${hullTransform}" pointer-events="none">
    <path d="M73 103Q77 96 82 96L79 185Q78 193 84 198L74 193Z" fill="#ffffff" opacity=".22"/>
    <path d="M107 101Q112 105 112 115L108 184Q107 193 100 199L105 184Z" fill="#14294a" opacity=".27"/>
    <path d="M73 145Q90 151 107 145M74 181Q90 187 106 181" fill="none" stroke="#253e60" stroke-width="2.4" opacity=".62"/>
    <path d="M76 148Q90 152 104 148M77 184Q90 188 103 184" fill="none" stroke="#e5f8ff" stroke-width="1.1" opacity=".65"/>
    <g fill="#dceeff" stroke="#405675" stroke-width=".9"><circle cx="75" cy="151" r="1.9"/><circle cx="105" cy="151" r="1.9"/><circle cx="77" cy="182" r="1.9"/><circle cx="103" cy="182" r="1.9"/></g>
    <rect x="83" y="187" width="14" height="5" rx="1.8" fill="#223a60" opacity=".8"/><path d="M86 189H94" stroke="#78d9f6" stroke-width="1.5"/>
    ${variant>=4?'<path d="M75 137L70 144L75 151M105 137L110 144L105 151" fill="none" stroke="#d9f3ff" stroke-width="2"/>':''}
    ${variant>=8?'<path d="M81 165L90 158L99 165L90 175Z" fill="#a2eaff" opacity=".65" stroke="#ffffff" stroke-width="1.4"/>':''}
   </g>`;
 }
 
 // Assemble every part around an explicit body anchor instead of scaling around the SVG origin.
 const mounts=body.anchors||ROCKET_BODY_ANCHORS[0];
 function attach(anchor,rx,ry,scaleY){
   const [x,y,s]=anchor;
   return `translate(${x} ${y}) scale(${s} ${scaleY??s}) translate(${-rx} ${-ry})`;
 }
 const wingLeft=wingPaths[w%12];
 function wingAt(anchor,rightSide){
   const [x,y,s]=anchor;
   // Both wings use the same root at (69,168), with the right wing reflected.
   const transform=`translate(${x} ${y}) scale(${rightSide?-s:s} ${s}) translate(-69 -168)`;
   return `<g transform="${transform}" class="rocketWingAttached"><g class="rocketWings"><path d="${wingLeft}" fill="${wings.color}" stroke="#20345e" stroke-width="4" stroke-linejoin="round"/><path d="M58 160L44 185" stroke="#e6f8ff" stroke-width="2.4" opacity=".75"/></g></g>`;
 }
 const wingMarkup=wingAt(mounts.left,false)+wingAt(mounts.right,true);
 function engineAt(anchor){
  return `<g transform="${attach(anchor,90,197)}" class="rocketEngineAttached"><g class="rocketFlame">${flameShape()}</g><path d="M77 196H103L100 207H80Z" fill="#627b99" stroke="#263b5b" stroke-width="3"/><path d="M82 200H98" stroke="#e3efff" stroke-width="2"/></g>`;
 }
 const flameMarkup=mounts.engines.map(engineAt).join('');
 // One nose always has its bottom edge seated on the body's top attachment.
 const noseMarkup=(mounts.noses||[mounts.nose]).map(a=>`<g transform="${attach(a,90,96)}" class="rocketNoseAttached"><path d="${nosePath[n%12]}" fill="${nose.color}" stroke="#354565" stroke-width="3" stroke-linejoin="round"/><path d="M89 37Q79 56 75 86" stroke="#ffffff" stroke-width="3" opacity=".54" fill="none" stroke-linecap="round"/><path d="M67 93H113" stroke="#223a58" stroke-width="2.4"/>${n>=8?'<circle cx="90" cy="42" r="6" fill="#e5ffff"/>':''}</g>`).join('');
 const occupantType=v%3;
 const occupantSide=occupantType===0
  ? `<path d="M-5 -9Q-7 -16 -1 -17Q5 -18 6 -13L10 -11L6 -8L4 -4L-4 -4Z"/><path d="M-2 -17L-5 -23L-3 -23L1 -17"/><path d="M-4 -3Q2 -5 5 1L5 11L-5 11Z"/><circle cx="5.7" cy="-12" r="1" fill="#b3c4d1"/>`
  : occupantType===1
  ? `<path d="M-6 -11Q-7 -18 -1 -19Q6 -19 6 -12L10 -9L5 -7L4 -4L-4 -4Q-7 -7 -6 -11Z"/><path d="M-4 -3Q1 -5 5 -2L5 10H-5Z"/><path d="M-4 10L-5 16M3 10L5 16" stroke="#515b67" stroke-width="3" fill="none"/>`
  : `<path d="M-7 -10L-9 -21L-2 -17L3 -21L5 -14L9 -10L12 -7L7 -4L5 -2L-5 -2Z"/><path d="M-5 -2Q3 -5 6 1L8 11H-7Z"/><path d="M-4 11L-5 17M5 11L6 17" stroke="#515b67" stroke-width="3" fill="none"/>`;
 function windowAt(anchor,i){
  const id='ttCockpit'+Math.random().toString(36).slice(2,11);
  // All glass, details and the animated occupant inherit the same anchor transform.
  const windowFit=[1,1,1,.85,.80,.80,.70,.80,.88,.85,.68,.78][v%12];
  const fitted=[anchor[0],anchor[1],anchor[2]*windowFit];
  return `<g transform="${attach(fitted,90,121)}" class="rocketWindowAttached">
   <defs><clipPath id="${id}">${windowShape}</clipPath></defs>
   <g class="rocketWindow"><g fill="${win.color}" stroke="#29436d" stroke-width="5">${windowShape}</g></g>
   <g clip-path="url(#${id})" pointer-events="none">
    <g transform="translate(90 127) scale(.72)" fill="#536375" stroke="none" opacity=".9">
     <g>${occupantSide}<animateTransform attributeName="transform" type="translate" values="-4 0;4 0;4 0;-4 0;-4 0" keyTimes="0;.4;.5;.9;1" dur="9s" begin="${i*-1.3}s" repeatCount="indefinite"/></g>
    </g>
   </g>
   <g class="rocketWindowGlint"><path d="M77 110Q85 104 95 108" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".72"/><path d="M102 115L104 119" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".43"/></g>
   <path d="M76 132Q90 138 104 132" fill="none" stroke="#163b5b" stroke-width="1.5" opacity=".45"/>
   </g>`;
 }
 const windowsMarkup=mounts.windows.map(windowAt).join('');
 const extraMarkup=e===0?'':`<g transform="${attach(mounts.extra,90,162)}" fill="${extra.color}" stroke="#273c65" stroke-width="2">${emblem}</g>`;
 let fleet=(rocketState.fleet||[]).map((id,i)=>{let p=part(id),pos=[[28,89],[235,125],[35,219]][i];return shipSVG(p,pos[0],pos[1],i===2?.6:.78)}).join('');
 const smallScale=small?.84:1;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 285" role="img" aria-label="Custom rocket">
 <circle cx="24" cy="30" r="2.5" fill="#fff9c0"/><circle cx="237" cy="49" r="2" fill="#fff9c0"/>
 <path d="m235 199 4 7 7 4-7 4-4 7-4-7-7-4 7-4Z" fill="#b8d7ff"/>
 ${fleet}<g transform="translate(45 2) translate(90 140) scale(${smallScale}) translate(-90 -140)">
 ${flameMarkup}<g class="rocketWingGroup">${wingMarkup}</g>
 <g class="ttRocketHull">${bodyMarkupForVariant(b,body.color)}</g>
 ${noseMarkup}${windowsMarkup}${extraMarkup}
 </g></svg>`;
}
function updateCoins(){if($('coinHeader'))$('coinHeader').textContent=rocketState.coins;if($('garageBalance'))$('garageBalance').textContent=rocketState.coins;if($('homeRocket'))$('homeRocket').innerHTML=rocketSVG()}
let garageAffordableOnly=false;function setGaragePurchaseFilter(affordable){garageAffordableOnly=affordable;renderGarage()}
function renderGarage(){document.querySelector('#garage .sectionintro p').textContent=rocketText('Build your own space fleet. Parts are cosmetic only.','Construye tu flota espacial. Las piezas son decorativas.');document.querySelector('.garagePreview>small').textContent=rocketText('Preview before buying. Owned parts stay in your collection.','Prueba antes de comprar. Conservas las piezas adquiridas.');updateCoins();let eq={...rocketState.equipped};if(garagePreviewId){let p=part(garagePreviewId);if(p.cat!=='support')eq[p.cat]=p.id}let savedFleet=rocketState.fleet;if(garagePreviewId&&part(garagePreviewId).cat==='support'&&!savedFleet.includes(garagePreviewId))rocketState.fleet=[...savedFleet.slice(0,2),garagePreviewId];$('garageRocket').innerHTML=rocketSVG(eq);rocketState.fleet=savedFleet;$('garageEquipped').textContent=rocketText('Your custom rocket · '+(rocketState.fleet||[]).length+'/3 support ships','Tu cohete · '+(rocketState.fleet||[]).length+'/3 naves de apoyo');
$('garageTabs').innerHTML=rocketCats.map(c=>`<button class="garageTab ${c===garageCategory?'selected':''}" onclick="setGarageCat('${c}')">${catLabels[c][rocketLang()==='es'?1:0]}</button>`).join('');
$('garageTierTabs').innerHTML='';
$('garagePurchaseFilters').innerHTML=`<button type="button" class="garageTab ${!garageAffordableOnly?'selected':''}" onclick="setGaragePurchaseFilter(false)">${rocketText('All','Todos')}</button><button type="button" class="garageTab ${garageAffordableOnly?'selected':''}" onclick="setGaragePurchaseFilter(true)">${rocketText('What I can buy','Lo que puedo comprar')}</button>`;
const tierNames=['Explorer','Advanced','Legendary'];
$('garageItems').innerHTML=[1,2,3].map(n=>{
 const visibleParts=rocketParts.filter(p=>p.cat===garageCategory&&p.tier===n&&(!garageAffordableOnly||(!rocketState.owned.includes(p.id)&&p.price<=rocketState.coins&&fits(p))));
 const cards=visibleParts.map(p=>{let owned=rocketState.owned.includes(p.id),equipped=p.cat==='support'?(rocketState.fleet||[]).includes(p.id):rocketState.equipped[p.cat]===p.id,compatible=fits(p),canAfford=rocketState.coins>=p.price,preview=garagePreviewId===p.id;return `<div class="garageItem ${preview?'previewing':''}"><div class="garageThumb" onclick="previewPart('${p.id}')" role="button" tabindex="0" aria-label="Preview ${p.name}">${p.cat==='support'?`<svg viewBox="-40 -40 80 80">${shipSVG(p,0,0,1)}</svg>`:rocketSVG({...rocketState.equipped,[p.cat]:p.id})}</div><strong>${rocketLang()==='es'?p.es:p.name}</strong><small>${p.price?'🪙 '+p.price:rocketText('Free starter','Inicial gratis')} · ${rocketText('Universal','Universal')}</small><div class="ttGarageIconActions"><button type="button" class="previewBtn ttGarageIconBtn ${preview?'ttPreviewActive':''}" onclick="previewPart('${p.id}')" aria-label="${rocketText('Preview','Previsualizar')}: ${rocketLang()==='es'?p.es:p.name}" title="${rocketText('Preview','Previsualizar')}" aria-pressed="${preview}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12 C5 8 8.5 6 12 6 C15.5 6 19 8 22 12 C19 16 15.5 18 12 18 C8.5 18 5 16 2 12 Z"/><circle cx="12" cy="12" r="3"/></svg></button><button type="button" class="ttGarageIconBtn ttGarageEquipBtn ${equipped?'equipped':''}" ${!compatible||(!owned&&!canAfford)?'disabled':''} onclick="garageAction('${p.id}')" aria-label="${!compatible?rocketText('Incompatible','Incompatible'):equipped?rocketText('Equipped','Equipado'):owned?rocketText('Equip','Equipar'):canAfford?rocketText('Buy for','Comprar por')+' '+p.price+' Rocket Coins':rocketText('Not enough coins','Faltan monedas')}" title="${!compatible?rocketText('Incompatible','Incompatible'):equipped?rocketText('Equipped','Equipado'):owned?rocketText('Equip','Equipar'):canAfford?rocketText('Buy','Comprar'):rocketText('Not enough coins','Faltan monedas')}">${equipped?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 12 5 5 10-11"/></svg>':owned?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg>':canAfford?'<span aria-hidden="true">🪙</span>':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'}</button></div></div>`}).join('');
 return `<section class="garageTierSection"><h3 class="garageTierHeading"><span>${tierNames[n-1]}</span><span class="garageTierCount">${visibleParts.length}</span></h3><div class="garageTierGrid">${cards||`<p class="garageNoAffordable">${rocketText('No parts available here with this filter.','No hay piezas disponibles con este filtro.')}</p>`}</div></section>`;
}).join('');
}
function garageAction(id){let p=part(id);if(!fits(p))return;if(rocketState.owned.includes(id)){if(p.cat==='support'){rocketState.fleet??=[];if(rocketState.fleet.includes(id))rocketState.fleet=rocketState.fleet.filter(x=>x!==id);else if(rocketState.fleet.length<3)rocketState.fleet.push(id);else{alert(rocketText('You can equip up to 3 support ships.','Puedes equipar hasta 3 naves de apoyo.'));return}}else rocketState.equipped[p.cat]=id;garagePreviewId=null;persistRocket();renderGarage();return}if(rocketState.coins<p.price)return;pendingPurchase=id;$('buyTitle').textContent=rocketText('Buy '+p.name+'?','¿Comprar '+p.es+'?');$('buyDescription').textContent=rocketText('Spend '+p.price+' coins? You will keep this part forever.','¿Gastar '+p.price+' monedas? Conservarás esta pieza para siempre.');$('confirmBuy').textContent=rocketText('Buy for ','Comprar por ')+p.price+' 🪙';$('buyDialog').showModal()}
function confirmPurchase(){let p=rocketParts.find(x=>x.id===pendingPurchase);window.TTAudio?.sfx(p&&rocketState.coins>=p.price?'purchase':'noCoins');if(p&&!rocketState.owned.includes(p.id)&&rocketState.coins>=p.price){rocketState.coins-=p.price;rocketState.owned.push(p.id);if(p.cat==='support'){rocketState.fleet??=[];if(rocketState.fleet.length<3)rocketState.fleet.push(p.id)}else rocketState.equipped[p.cat]=p.id;persistRocket()}$('buyDialog').close();pendingPurchase=null;garagePreviewId=null;renderGarage()}
function awardCoins(){let earned=0;const values=Object.values(data),right=values.reduce((a,v)=>a+(v.right||0),0),wrongAll=values.reduce((a,v)=>a+(v.wrong||0),0),x={right,wrong:wrongAll,missions:history.length};getAwards().forEach((a,i)=>{if(a[3](x)&&!rocketState.rewardedAchievements.includes(i)){rocketState.rewardedAchievements.push(i);earned+=i===7?200:i===5?120:i>=8?(i===18?400:i===16||i===17?250:100):50}});rocketState.coins+=earned;persistRocket();return earned}
function missionCoins(){const n=correct+wrong,precision=n?correct/n:0;let base=correct,bonus=0;if(mode==='exam')bonus=20;else if(mode==='speed')bonus=10;else if(mode==='timed')bonus=durationMinutes*6;let complete=(mode==='exam'&&questionNumber>=20)||(mode==='speed'&&remaining===0)||(mode==='timed'&&remaining===0);if(!complete||n<5||precision<.5)bonus=0;const amount=base+bonus;rocketState.coins+=amount;const achievementBonus=awardCoins();persistRocket();$('resultCoins').textContent='+'+(amount+achievementBonus)+' '+rocketText('Rocket Coins','monedas');$('coinRewardDetails').textContent=rocketText(`${base} from correct answers + ${bonus} mission bonus + ${achievementBonus} achievement bonus.`,` ${base} por aciertos + ${bonus} por misión + ${achievementBonus} por logros.`);updateCoins();return {total:amount+achievementBonus,base,bonus,achievementBonus}}

function ttRenderResultView(view){
 const archived=!!ttArchivedResult,details=view==='mistakes';
 $('ttMistakesView').hidden=!details;
 $('ttMainResultActions').hidden=details||archived;
 $('ttArchivedResultActions').hidden=details||!archived;
 $('ttArchivedResultNav').hidden=!archived;
 $('resultRecord').hidden=details;
 document.querySelector('#results .coinReward').hidden=details;
 document.querySelector('#results .resultGrid').hidden=details;
 document.querySelector('#results .resultHero').hidden=details;
 $('ttResultGarageButton').hidden=archived;
 // The same details component is reused for finished and archived missions.
 if(details){
  const saved=archived?(Array.isArray(ttArchivedResult.mistakes)?ttArchivedResult.mistakes:[]):missionMistakes;
  const current=missionMistakes;missionMistakes=saved;renderMissionMistakes();missionMistakes=current;
  $('ttReviewMissionButton').hidden=!saved.length;
  $('ttReviewMissionButton').onclick=archived?ttPracticeArchivedMission:startMissionErrorsReview;
  $('ttBackToSummary').textContent=lang==='es'?'← Volver al resumen':'← Back to summary';
 }else{
  $('ttReviewMissionButton').onclick=startMissionErrorsReview;
 }
 window.scrollTo(0,0);
}
function showMissionMistakes(){
 const mistakes=ttArchivedResult?.mistakes||missionMistakes;
 if(!Array.isArray(mistakes)||!mistakes.length)return;
 ttRenderResultView('mistakes');
}
function hideMissionMistakes(){ttRenderResultView('summary')}
function ttResultGoBack(){
 if(!$('ttMistakesView').hidden){ttRenderResultView('summary');return}
 const to=ttArchivedResult?'insights':'dashboard';
 ttArchivedResult=null;ttRenderResultView('summary');navigate(to);
}
function renderMissionMistakes(){
 const panel=$('ttMissionErrorsPanel'),list=$('ttMissionErrorsList'),button=$('ttReviewMissionButton');
 if(!panel||!list||!button)return;
 const unique=[...new Map(missionMistakes.map(m=>[m.key,m])).values()];
 button.hidden=!unique.length;
 $('ttPracticeTile').disabled=!unique.length;
 $('ttPracticeTile').setAttribute('aria-label',lang==='es'?'Ver errores de esta misión':'View mistakes from this mission');
 panel.hidden=!unique.length;
 if(!unique.length)return;
 $('ttMissionErrorsTitle').textContent=(lang==='es'?'🔍 Tus errores de esta misión':'🔍 Your mistakes in this mission')+' ('+missionMistakes.length+')';
 list.innerHTML=unique.map(m=>{
  const expr=m.op==='mul'?m.a+' × '+m.b:m.a*m.b+' ÷ '+m.a;
  return '<div class="ttMissionErrorRow"><strong>'+expr+' = '+m.result+'</strong><span>'+(lang==='es'?'Respondiste: ':'Your answer: ')+m.given+'</span></div>';
 }).join('');
}
function startMissionErrorsReview(){
 const keys=[...new Set(missionMistakes.map(m=>m.key))];
 if(!keys.length)return;
 missionReviewKeys=keys;missionReviewActive=true;reviewOnly=false;
 chosen=new Set(missionMistakes.map(m=>m.a));
 choose('op','mix');choose('mode','practice');renderPlanets();start();
}
function repeatRegularMission(){missionReviewActive=false;missionReviewKeys=null;reviewOnly=false;start()}

function ttToggleArchivedResult(on){
 if(!on)ttArchivedResult=null;
 ttRenderResultView('summary');
}
function openMissionHistory(index){
 const m=history[index];if(!m)return;
 ttArchivedResult=m;
 if(!$('play').classList.contains('hidden'))return;
 navigate('results');ttToggleArchivedResult(true);
 $('resultRecord').hidden=false;document.querySelector('#results .coinReward').hidden=false;document.querySelector('#results .resultGrid').hidden=false;
 $('ttArchivedResultDate').textContent=new Date(m.date).toLocaleString(lang==='es'?'es-ES':'en-GB',{dateStyle:'medium',timeStyle:'short'});
 const replay=$('ttReplayArchivedMission');if(replay){replay.disabled=!(Array.isArray(m.attempts)&&m.attempts.length||Array.isArray(m.tables)&&m.tables.length&&['mul','div','mix'].includes(m.op));replay.title=replay.disabled?(lang==='es'?'Esta misión antigua no guardó las tablas necesarias para repetirla':'This older mission has insufficient saved settings to replay'):'';}
 const total=(m.correct||0)+(m.wrong||0),pct=total?Math.round(100*(m.correct||0)/total):0;
 $('resultCorrect').textContent=m.correct||0;
 $('resultWrong').textContent=m.wrong||0;
 $('resultAccuracy').textContent=pct+'%';
 $('resultXP').textContent='+'+(m.score||0);
 $('resulttitle').textContent=m.resultTitle||(lang==='es'?'Misión guardada':'Saved mission');
 $('resultSubtitle').textContent=(lang==='es'?'Misión completada el ':'Mission completed on ')+new Date(m.date).toLocaleDateString(lang==='es'?'es-ES':'en-GB');
 $('resultCoins').textContent=m.coins?('+'+m.coins.total+' '+(lang==='es'?'monedas':'Rocket Coins')):(lang==='es'?'Monedas no registradas':'Coins not recorded');
 $('coinRewardDetails').textContent=m.coins?((lang==='es'?'Aciertos: ':'Correct answers: ')+m.coins.base+' · '+(lang==='es'?'Misión: ':'Mission: ')+m.coins.bonus+' · '+(lang==='es'?'Logros: ':'Achievements: ')+m.coins.achievementBonus):(lang==='es'?'Esta misión es anterior al registro detallado de recompensas.':'This mission predates detailed reward tracking.');
 const rec=$('resultRecordTitle'),desc=$('resultRecordText');
 rec.textContent=m.resultRecordTitle||(lang==='es'?'Resultado de la misión':'Mission result');
 desc.textContent=m.resultRecordText||(lang==='es'?'Historial de esta misión':'Saved mission history');
 const archivedMistakes=Array.isArray(m.mistakes)?m.mistakes:[];
 const currentMistakes=missionMistakes;missionMistakes=archivedMistakes;
 renderMissionMistakes();missionMistakes=currentMistakes;
 $('ttPracticeTile').disabled=!archivedMistakes.length;
 $('ttPracticeTile').onclick=showMissionMistakes;
 $('ttPracticeTile').setAttribute('aria-label',lang==='es'?'Ver errores guardados':'View saved mistakes');
 if(!Array.isArray(m.mistakes)){
  $('ttPracticeTile').disabled=true;
  $('ttPracticeTile').title=lang==='es'?'No se guardaron las operaciones de esta misión antigua':'Individual answers were not saved for this older mission';
 }
 const errors=$('ttMissionErrorsList');
 if(!Array.isArray(m.mistakes)){
  $('ttMissionErrorsPanel').hidden=false;
  $('ttMissionErrorsTitle').textContent=lang==='es'?'Detalles no disponibles':'Details unavailable';
  errors.textContent=lang==='es'?'Esta misión se jugó antes de guardar las operaciones falladas.':'This mission was played before individual mistakes were recorded.';
 }
 ttRenderResultView('summary');
 window.scrollTo(0,0);
}
function ttReplayArchivedMission(){
 const m=ttArchivedResult;if(!m)return;
 const haveExact=Array.isArray(m.attempts)&&m.attempts.length>0;
 const haveSettings=Array.isArray(m.tables)&&m.tables.length>0&&['mul','div','mix'].includes(m.op);
 if(!haveExact&&!haveSettings)return;
 // Restore only this mission's settings, never the original saved result or rewards.
 missionReviewActive=false;missionReviewKeys=null;reviewOnly=false;
 chosen=new Set(haveSettings?m.tables:m.attempts.map(q=>q.a));
 const originalOp=haveSettings?m.op:[...new Set(m.attempts.map(q=>q.op))].length>1?'mix':m.attempts[0].op;
 choose('op',originalOp);
 choose('mode',m.mode||'practice');
 if(m.mode==='timed'&&m.minutes)chooseDuration(m.minutes);
 renderPlanets();
 ttReplaySourceDate=m.date;
 ttReplayQuestionSet=haveExact?m.attempts.filter(q=>Number.isFinite(q.a)&&Number.isFinite(q.b)&&['mul','div'].includes(q.op)).map(q=>({a:q.a,b:q.b,op:q.op,result:q.op==='mul'?q.a*q.b:q.b})):null;
 ttArchivedResult=null;
 if(!haveExact){
  ttReplaySourceDate=m.date;
  // Old records have settings but not question order: reproduce the selection, not an invented sequence.
 }
 start();
}

function ttPracticeArchivedMission(){
 const m=ttArchivedResult;
 if(!m||!Array.isArray(m.mistakes)||!m.mistakes.length)return;
 missionMistakes=m.mistakes.map(x=>({...x}));
 ttArchivedResult=null;
 startMissionErrorsReview();
}
function ttShowArchivedMistakes(m){if(!m||!Array.isArray(m.mistakes)||!m.mistakes.length)return;ttArchivedResult=m;ttRenderResultView('mistakes')}

function finish(){window.TTAudio?.sfx('missionEnd');window.TTAudio?.sfx('coins');run++;clearTimeout(autoNextTimer);$('next').classList.remove('autoplay');clearInterval(timer);$('play').classList.add('hidden');$('results').classList.remove('hidden');
let n=correct+wrong,p=n?Math.round(correct/n*100):0,elapsed=Math.max(0,Math.round((Date.now()-missionStartedAt)/1000));
let sameMode=m=>m.mode===mode&&(mode!=='timed'||m.minutes===durationMinutes),previousBest=history.filter(sameMode).reduce((a,m)=>Math.max(a,m.correct||0),0);
$('medal').textContent=p>=90?'🏆':p>=65?'🌟':'🚀';
$('resulttitle').textContent=p>=90?'¡Misión estelar!':p>=65?'¡Buen viaje espacial!':'¡Cada intento cuenta!';
$('resultCorrect').textContent=correct;$('resultWrong').textContent=wrong;$('resultAccuracy').textContent=p+'%';
$('resultXP').textContent='+'+score;

$('resultSubtitle').textContent=n?'¡Has practicado '+n+' operaciones y ganado '+score+' XP!':'La próxima misión será una nueva oportunidad.';
if(n>0){history.unshift({date:Date.now(),mode,minutes:mode==='timed'?durationMinutes:null,correct,wrong,score,elapsed,tables:[...chosen].sort((a,b)=>a-b),op,mistakes:missionMistakes.map(m=>({...m})),attempts:ttMissionAttempts.map(q=>({...q})),replayOf:ttReplaySourceDate||null,previousBest});history=history.slice(0,150);try{window.TTLocalStore.setItem('cosmotablas-history-v1',JSON.stringify(history))}catch{}}
let record=n>0&&correct>previousBest;
$('resultRecordTitle').textContent=record?(lang==='es'?'¡Nuevo récord personal!':'New personal best!'):(lang==='es'?'Tu mejor marca':'Your best score');
$('resultRecordText').textContent=record?(lang==='es'?'¡Superaste tu marca anterior de '+previousBest+' aciertos en este modo!':'You beat your previous best of '+previousBest+' correct answers in this mode!'):previousBest?(lang==='es'?'Tu récord anterior en este modo es '+previousBest+' aciertos. ¡Intenta superarlo!':'Your previous best in this mode was '+previousBest+' correct answers. Try to beat it!'):(lang==='es'?'Completa otra misión para superar tu primera marca.':'Complete another mission to beat your first score.');
hideMissionMistakes();renderMissionMistakes();

const ttCoinsEarned=missionCoins();
if(n>0&&history[0]){
 history[0].coins=ttCoinsEarned;
 history[0].record=record;
 history[0].resultTitle=$('resulttitle').textContent;
 history[0].resultRecordTitle=$('resultRecordTitle').textContent;
 history[0].resultRecordText=$('resultRecordText').textContent;
 try{window.TTLocalStore.setItem('cosmotablas-history-v1',JSON.stringify(history))}catch{}
}
ttReplayQuestionSet=null;ttReplaySourceDate=null;ttToggleArchivedResult(false);$('ttPracticeTile').onclick=showMissionMistakes;$('ttPracticeTile').title='';renderDashboard();window.scrollTo(0,0)}
function home(){clearTimeout(autoNextTimer);navigate('dashboard')}function navigate(view){if(view==='home'){missionReviewActive=false;missionReviewKeys=null;reviewOnly=false}closeDrawer();if(!$('play').classList.contains('hidden'))return;for(let name of ['dashboard','home','insights','awards','results','garage','settings','profile','about'])$(name).classList.toggle('hidden',name!==view);document.querySelectorAll('.drawerItem[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===view));if(view==='settings'){renderBackups();const label=document.getElementById('settingsPilotName');if(label)label.textContent=window.TTProfiles?.active()?.name||'—'}if(view==='dashboard'||view==='insights'||view==='awards')renderDashboard();if(view==='garage')renderGarage();window.scrollTo(0,0)}function review(){missionReviewActive=false;missionReviewKeys=null;let errors=Object.entries(data).filter(([k,v])=>(v.pending??v.wrong??0)>0);if(!errors.length){alert(lang==='es'?'¡Todavía no tienes errores que repasar!':'You have no mistakes to review yet!');return}chosen=new Set(errors.map(([k])=>Number(k.split('-')[0])));reviewOnly=true;choose('op','mix');choose('mode','practice');renderPlanets();start()}function resetLegacy(){if(confirm(lang==='es'?'¿Borrar todo el progreso, las misiones y las medallas?':'Delete all progress, missions and medals?')){data={};history=[];rocketState.coins=0;rocketState.owned=['body_red','nose_classic','wings_classic','flame_orange','window_round','extra_none'];rocketState.equipped={body:'body_red',nose:'nose_classic',wings:'wings_classic',flame:'flame_orange',window:'window_round',extra:'extra_none'};rocketState.rewardedAchievements=[];rocketState.family='compact';rocketState.fleet=[];rocketState.designs={};persistRocket();try{window.TTLocalStore.removeItem('cosmotablas-history-v1')}catch{}save();renderDashboard()}}function renderStats(){let total=Object.values(data).reduce((a,v)=>a+(v.right||0),0);if($('stars'))$('stars').textContent='⭐ '+total*10;$('stats').innerHTML=Array.from({length:12},(_,i)=>{let r=0,w=0;for(let [k,v] of Object.entries(data))if(Number(k.split('-')[0])===i+1){r+=v.right||0;w+=v.wrong||0}let pct=r+w?Math.round(r/(r+w)*100):0;return `<div class="stat"><strong>🪐 ${lang==='es'?'Tabla':'Table'} ${i+1}</strong><span style="float:right;font-size:12px">${r+w?pct+'%':(lang==='es'?'Sin explorar':'Unexplored')}</span><div class="track"><div style="width:${pct}%"></div></div></div>`}).join('')}// A fact is mastered after two correct answers with at least 80% cumulative accuracy.
// Each multiplication and division fact is tracked independently.
function factMastered(table,n,operation){
 const f=data[table+'-'+n+'-'+operation]||{};
 const r=f.right||0,w=f.wrong||0;
 return r>=2 && r/(r+w)>=.8;
}
function masteredCount(table,operation){
 let count=0;
 for(let n=1;n<=12;n++)if(factMastered(table,n,operation))count++;
 return count;
}
function tableMastered(table,operation){return masteredCount(table,operation)===12}
function groupMastered(tables,operation){return tables.every(t=>tableMastered(t,operation))}
function achievedTables(operation){return Array.from({length:12},(_,i)=>i+1).filter(t=>tableMastered(t,operation)).length}
function achievementProgress(award){
 const meta=award[4];
 if(!meta)return null;
 if(meta.type==='table')return {done:masteredCount(meta.table,meta.op),total:12};
 if(meta.type==='group'){
   let done=meta.tables.reduce((n,t)=>n+masteredCount(t,meta.op),0);
   return {done,total:meta.tables.length*12};
 }
 if(meta.type==='all')return {done:Array.from({length:12},(_,i)=>masteredCount(i+1,meta.op)).reduce((a,b)=>a+b,0),total:144};
 if(meta.type==='both')return {done:Array.from({length:12},(_,i)=>masteredCount(i+1,'mul')+masteredCount(i+1,'div')).reduce((a,b)=>a+b,0),total:288};
 return null;
}

function getAwards(){const base=[['🌠',(lang==='es'?'Primer despegue':'First launch'),(lang==='es'?'Completa una misión':'Complete one mission'),x=>x.missions>=1],['💫',(lang==='es'?'Cien aciertos':'One hundred correct'),(lang==='es'?'Consigue 100 respuestas correctas':'Get 100 answers right'),x=>x.right>=100],['🚀',(lang==='es'?'Explorador':'Explorer'),(lang==='es'?'Completa 5 misiones':'Complete 5 missions'),x=>x.missions>=5],['🪐',(lang==='es'?'Viajero galáctico':'Galactic traveler'),(lang==='es'?'Completa 20 misiones':'Complete 20 missions'),x=>x.missions>=20],['🎯',(lang==='es'?'Puntería estelar':'Star accuracy'),(lang==='es'?'Consigue 20 aciertos en una misión':'Get 20 correct in one mission'),x=>history.some(m=>m.correct>=20)],['🏆',(lang==='es'?'Misión perfecta':'Perfect mission'),(lang==='es'?'Completa una misión con 10 o más aciertos y sin errores':'Complete a mission with at least 10 correct and no mistakes'),x=>history.some(m=>m.correct>=10&&m.wrong===0)],['⚡',(lang==='es'?'Rayo espacial':'Space lightning'),(lang==='es'?'Consigue 30 aciertos en 60 segundos':'Get 30 correct in 60 seconds'),x=>history.some(m=>m.mode==='speed'&&m.correct>=30)],['🌌',(lang==='es'?'Centurión':'Centurion'),(lang==='es'?'Consigue 500 aciertos':'Get 500 correct answers'),x=>x.right>=500]];

const easy=[1,2,5,10],middle=[3,4,6,8],hard=[7,9,11,12];
const extra=[
 ['🎓',lang==='es'?'Primer planeta dominado':'First planet mastered',lang==='es'?'Domina las 12 multiplicaciones de una tabla':'Master all 12 facts in one multiplication table',()=>achievedTables('mul')>=1],
 ['🧠',lang==='es'?'Primeras divisiones':'First division master',lang==='es'?'Domina las 12 divisiones de una tabla':'Master all 12 facts in one division table',()=>achievedTables('div')>=1],
 ['🌱',lang==='es'?'Tablas fáciles':'Easy tables',lang==='es'?'Domina las tablas 1, 2, 5 y 10':'Master tables 1, 2, 5 and 10',()=>groupMastered(easy,'mul'),{type:'group',tables:easy,op:'mul'}],
 ['🌿',lang==='es'?'Divisiones fáciles':'Easy divisions',lang==='es'?'Domina las divisiones de las tablas 1, 2, 5 y 10':'Master division facts for tables 1, 2, 5 and 10',()=>groupMastered(easy,'div'),{type:'group',tables:easy,op:'div'}],
 ['🧩',lang==='es'?'Tablas intermedias':'Intermediate tables',lang==='es'?'Domina las tablas 3, 4, 6 y 8':'Master tables 3, 4, 6 and 8',()=>groupMastered(middle,'mul'),{type:'group',tables:middle,op:'mul'}],
 ['🔷',lang==='es'?'Divisiones intermedias':'Intermediate divisions',lang==='es'?'Domina las divisiones de las tablas 3, 4, 6 y 8':'Master division facts for tables 3, 4, 6 and 8',()=>groupMastered(middle,'div'),{type:'group',tables:middle,op:'div'}],
 ['🔥',lang==='es'?'Tablas difíciles':'Hard tables',lang==='es'?'Domina las tablas 7, 9, 11 y 12':'Master tables 7, 9, 11 and 12',()=>groupMastered(hard,'mul'),{type:'group',tables:hard,op:'mul'}],
 ['💎',lang==='es'?'Divisiones difíciles':'Hard divisions',lang==='es'?'Domina las divisiones de las tablas 7, 9, 11 y 12':'Master division facts for tables 7, 9, 11 and 12',()=>groupMastered(hard,'div'),{type:'group',tables:hard,op:'div'}],
 ['🌍',lang==='es'?'Maestría multiplicadora':'Multiplication master',lang==='es'?'Domina las 12 tablas de multiplicar':'Master all 12 multiplication tables',()=>achievedTables('mul')===12,{type:'all',op:'mul'}],
 ['🪐',lang==='es'?'Maestría divisora':'Division master',lang==='es'?'Domina las 12 tablas de dividir':'Master all 12 division tables',()=>achievedTables('div')===12,{type:'all',op:'div'}],
 ['👑',lang==='es'?'Maestro del universo':'Master of the universe',lang==='es'?'Domina todas las multiplicaciones y divisiones':'Master every multiplication and division fact',()=>achievedTables('mul')===12&&achievedTables('div')===12,{type:'both'}],
 ['🎯',lang==='es'?'Precisión difícil':'Hard-mode precision',lang==='es'?'Termina una misión de 20 retos con al menos 90% de aciertos usando solo tablas 7, 9, 11 y 12':'Finish a 20-question mission with 90% accuracy using only tables 7, 9, 11 and 12',()=>history.some(m=>m.mode==='exam'&&m.correct>=18&&m.wrong<=2&&m.tables?.length>=2&&m.tables.every(t=>hard.includes(t)))],
 ['🔀',lang==='es'?'Misión combinada':'Mixed mission',lang==='es'?'Completa una misión de 20 retos con multiplicaciones y divisiones y al menos 85% de aciertos':'Finish a 20-question mixed multiplication/division mission with at least 85% accuracy',()=>history.some(m=>m.mode==='exam'&&m.op==='both'&&m.correct>=17&&m.wrong<=3)],
 ['🚀',lang==='es'?'Veterano espacial':'Space veteran',lang==='es'?'Completa 50 misiones':'Complete 50 missions',x=>x.missions>=50],
 ['🌟',lang==='es'?'Mil respuestas':'A thousand answers',lang==='es'?'Consigue 1000 respuestas correctas':'Get 1,000 answers correct',x=>x.right>=1000]
];
return base.concat(extra);
}
function renderDashboard(){const pp=TTProfiles.active();if(pp){const who=document.getElementById('activeProfileName');if(who)who.textContent=pp.name;}updateCoins();let values=Object.values(data),right=values.reduce((a,v)=>a+(v.right||0),0),wrongAll=values.reduce((a,v)=>a+(v.wrong||0),0),missions=history.length,xp=right*10,level=Math.floor(xp/500)+1,into=xp%500,levelNames=['Cadete','Explorador','Navegante','Comandante','Capitán','Leyenda espacial'];let x={right,wrong:wrongAll,missions};$('dashXP').textContent=xp.toLocaleString('es-ES');$('dashMissions').textContent=missions;$('dashAccuracy').textContent=right+wrongAll?Math.round(right/(right+wrongAll)*100)+'%':'—';$('levelName').textContent='Nivel '+level+' · '+levelNames[Math.min(level-1,levelNames.length-1)];$('xpLabel').textContent=into+' / 500 XP';$('xpFill').style.width=(into/500*100)+'%';$('greeting').textContent=lang==='en'?(missions?'Keep going, '+(pp?.name||'pilot')+'!':'Welcome, '+(pp?.name||'pilot')+'!'):(missions?'¡Sigue así, '+(pp?.name||'piloto')+'!':'¡Bienvenido, '+(pp?.name||'piloto')+'!');$('dashSubtitle').textContent=missions?'Cada operación te acerca a tu próximo nivel.':'¡Tu aventura por las 12 planetas empieza aquí!';let last=history[0];$('lastWhen').textContent=last?new Date(last.date).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'Sin misiones';$('lastMission').innerHTML=last?'<strong style="font-size:23px;color:#fff">'+last.correct+' aciertos</strong> · '+(last.correct+last.wrong?Math.round(last.correct/(last.correct+last.wrong)*100):0)+'% de precisión<br><small>'+modeName(last)+' · +'+last.score+' XP</small>':'Todavía no has completado una misión. ¡Empieza tu aventura!';let counts=Array.from({length:12},(_,i)=>{let r=0,w=0;for(let [k,v] of Object.entries(data))if(Number(k.split('-')[0])===i+1){r+=v.right||0;w+=v.wrong||0}return {table:i+1,r,w}});let target=counts.filter(t=>t.r<30).sort((a,b)=>a.r-b.r)[0];if(target){let pct=Math.min(100,Math.round(target.r/30*100));$('goalPct').textContent=pct+'%';$('goalText').textContent='Tabla del '+target.table+': '+target.r+' de 30 aciertos para dominar este planeta. ¡Tú puedes!';$('goalFill').style.width=pct+'%'}else{$('goalPct').textContent='100%';$('goalText').textContent='¡Has conquistado todos los planetas! Sigue mejorando tus récords.';$('goalFill').style.width='100%'}let earned=getAwards().filter(a=>a[3](x));$('miniAwards').innerHTML=earned.length?earned.slice(-3).map(a=>'<div class="awardchip">'+a[0]+' '+a[1]+'</div>').join(''):'<span style="color:#c6d4f0">¡Completa una misión para conseguir tu primera medalla!</span>';$('awardGrid').innerHTML=getAwards().map(a=>'<div class="awardcard '+(a[3](x)?'':'locked')+'"><div class="emoji">'+(a[3](x)?a[0]:'🔒')+'</div><h3>'+a[1]+'</h3><p>'+a[2]+'</p>'+(achievementProgress(a)?'<div class="ttAwardMastery"><div class="ttAwardMasteryBar"><i style="width:'+Math.round(100*achievementProgress(a).done/achievementProgress(a).total)+'%"></i></div><small>'+achievementProgress(a).done+' / '+achievementProgress(a).total+'</small></div>':'')+'</div>').join('');$('insightTotals').innerHTML='<div class="kpi"><span aria-hidden="true"><svg viewBox="0 0 36 36" width="34" height="34" aria-label="Chat" style="display:block;margin:auto"><path d="M18 3C9.7 3 3 8.8 3 16c0 3.4 1.5 6.4 4 8.7L5.7 32l8-3.8c1.4.5 2.8.8 4.3.8 8.3 0 15-5.8 15-13S26.3 3 18 3Z" fill="#66d7ff" stroke="#b8efff" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11.5" cy="16" r="2" fill="#173b78"/><circle cx="18" cy="16" r="2" fill="#173b78"/><circle cx="24.5" cy="16" r="2" fill="#173b78"/></svg></span><strong>'+ (right+wrongAll) +'</strong><small>Respuestas</small></div><div class="kpi"><span>✅</span><strong>'+right+'</strong><small>Aciertos</small></div><div class="kpi"><span>🏅</span><strong>'+earned.length+'/'+getAwards().length+'</strong><small>Logros</small></div><div class="kpi"><span>🎯</span><strong>'+(right+wrongAll?Math.round(right/(right+wrongAll)*100)+'%':'—')+'</strong><small>'+(lang==='es'?'Precisión':'Accuracy')+'</small></div>';$('missionHistory').innerHTML=history.length?history.map((m,i)=>'<button class="historyItem ttHistoryClickable" type="button" onclick="openMissionHistory('+i+')"><div><strong>'+modeName(m)+'</strong><small>'+new Date(m.date).toLocaleString(lang==='es'?'es-ES':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+m.correct+' '+(lang==='es'?'aciertos':'correct')+' · '+m.wrong+' '+(lang==='es'?'errores':'mistakes')+'</small></div><b>+'+m.score+' XP ›</b></button>').join(''):'<p>Aquí aparecerán tus misiones cuando empieces a jugar.</p>';}
function modeName(m){return m.mode==='timed'?'Misión de '+m.minutes+' minutos':m.mode==='speed'?'60 segundos':m.mode==='exam'?'20 retos':'Entrenamiento'}
function renderMissionKeypad(){const target=$('keys');if(!target)return;target.innerHTML=[1,2,3,4,5,6,7,8,9,'del',0,'ok'].map(x=>`<button class="key ${x==='ok'?'ok':''}" onclick="${x==='ok'?'submit()':`press('${x}')`}" aria-label="${x==='del'?(lang==='es'?'Borrar':'Delete'):x==='ok'?(lang==='es'?'Comprobar':'Check'):x}">${x==='del'?'⌫':x==='ok'?'✓':x}</button>`).join('');}
renderMissionKeypad();$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();answered?nextQuestion():submit()}});$('answer').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,3));renderPlanets();renderStats();awardCoins();renderDashboard();updateCoins();document.querySelectorAll('#dashboard [data-go]').forEach(card=>{const go=()=>navigate(card.dataset.go);card.addEventListener('click',go);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});navigate('dashboard');function toggleFullscreen(){if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{})}else{document.documentElement.requestFullscreen?.().catch(()=>{alert(lang==='es'?'Este navegador no permite pantalla completa desde un archivo local. Prueba a abrirlo en Chrome o añadirlo a la pantalla de inicio.':'This browser cannot enter fullscreen from a local file. Try Chrome or add the game to your home screen.')})}}document.addEventListener('fullscreenchange',updateFullscreenMenu);
