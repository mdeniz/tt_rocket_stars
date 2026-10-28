
(function(){
'use strict';
const KEY='tt-rocket-sound-v112';
const defaults={enabled:true,music:25,sfx:65,ambient:40,track:'all',shuffle:false};
let cfg={...defaults};try{cfg={...cfg,...JSON.parse(window.TTLocalStore.getItem(KEY)||'{}')}}catch(e){}
let ctx=null,master=null,musicBus=null,sfxBus=null,ambientBus=null,session=false;
let step=0,nextBeat=0,tickTimer=null,track=0,stepsInTrack=0,lastScene='',sceneT0=0,lastCueCycle=-1,emittedCues=new Set(),warningPlayed=false;
let lastInputSound=0;
const NAMES=['Orbit Explorer','Starlight Drift','Cosmic Arcade','Moon Garden','Nebula Waltz','Solar Winds','Meteor Highway','Saturn Rings','Galactic Voyage','Little Astronaut','Deep Space Dreams','Comet Chase'];
const THEMES=[
{bpm:92,root:48,lead:[0,null,7,12,null,7,4,null,0,4,7,14,12,7,4,null],bass:[0,null,null,null,7,null,null,null,5,null,null,null,7,null,null,null],pad:[0,5,7,4]},
{bpm:75,root:53,lead:[0,null,null,4,7,null,12,null,9,null,7,4,2,null,0,null],bass:[0,null,null,null,5,null,null,null,9,null,null,null,7,null,null,null],pad:[0,9,5,7]},
{bpm:114,root:50,lead:[0,7,12,7,5,null,7,14,12,9,7,5,4,7,2,null],bass:[0,null,0,null,5,null,5,null,7,null,7,null,5,null,7,null],pad:[0,5,7,5]},
{bpm:82,root:45,lead:[0,null,4,null,7,null,11,12,null,11,7,4,2,null,0,null],bass:[0,null,null,null,4,null,null,null,7,null,null,null,5,null,null,null],pad:[0,4,7,5]},
{bpm:88,root:47,lead:[0,3,7,null,12,10,7,null,5,7,10,15,12,null,7,3],bass:[0,null,null,null,5,null,null,null,3,null,null,null,7,null,null,null],pad:[0,3,5,7]},
{bpm:100,root:50,lead:[0,null,2,7,9,7,4,null,5,9,12,null,7,5,2,null],bass:[0,null,null,null,9,null,null,null,5,null,null,null,7,null,null,null],pad:[0,5,9,7]},
{bpm:120,root:45,lead:[0,7,12,7,4,9,12,16,12,7,5,9,14,12,7,4],bass:[0,null,0,null,7,null,7,null,5,null,5,null,9,null,7,null],pad:[0,7,5,9]},
{bpm:72,root:52,lead:[0,null,null,7,12,null,14,null,11,null,7,4,2,null,0,null],bass:[0,null,null,null,7,null,null,null,5,null,null,null,9,null,null,null],pad:[0,7,5,9]},
{bpm:96,root:48,lead:[0,4,null,7,12,7,null,9,7,4,2,4,7,null,12,null],bass:[0,null,null,null,4,null,null,null,5,null,null,null,7,null,null,null],pad:[0,4,5,7]},
{bpm:108,root:55,lead:[0,2,4,7,9,7,4,2,0,null,7,12,11,7,4,null],bass:[0,null,0,null,7,null,null,null,5,null,5,null,7,null,null,null],pad:[0,7,5,9]},
{bpm:68,root:46,lead:[0,null,7,null,10,null,12,null,14,12,10,7,5,null,0,null],bass:[0,null,null,null,5,null,null,null,10,null,null,null,7,null,null,null],pad:[0,5,10,7]},
{bpm:126,root:49,lead:[0,7,9,12,7,4,2,7,12,14,12,9,7,4,2,null],bass:[0,null,0,null,7,null,7,null,9,null,9,null,5,null,7,null],pad:[0,9,5,7]}
];
function save(){try{window.TTLocalStore.setItem(KEY,JSON.stringify(cfg))}catch(e){}}
function ensure(){if(ctx)return true;const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;try{
ctx=new C();master=ctx.createGain();master.gain.value=.72;master.connect(ctx.destination);
for(const kind of ['music','sfx','ambient']){const g=ctx.createGain();g.connect(master);if(kind==='music')musicBus=g;else if(kind==='sfx')sfxBus=g;else ambientBus=g;}
updateVolumes();return true;}catch(e){return false}}
function updateVolumes(){if(!ctx)return;const t=ctx.currentTime;musicBus.gain.setTargetAtTime(cfg.enabled?cfg.music/100*.22:0,t,.09);sfxBus.gain.setTargetAtTime(cfg.enabled?cfg.sfx/100*.35:0,t,.07);ambientBus.gain.setTargetAtTime(cfg.enabled?cfg.ambient/100*.2:0,t,.12)}
function startAudio(){if(!cfg.enabled)return false;if(!ensure())return false;if(!session){sceneT0=performance.now();lastScene=visibleScene();lastCueCycle=-1;emittedCues.clear();}session=true;if(ctx.state==='suspended')ctx.resume().catch(()=>{});if(!tickTimer){nextBeat=ctx.currentTime+.07;tickTimer=setInterval(schedule,70)}return true}
function note(midi,time,len,opt={}){if(!ctx||!Number.isFinite(time)||time<ctx.currentTime-.12)return;
const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();const bus=opt.bus||musicBus;
osc.type=opt.type||'sine';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),Math.max(ctx.currentTime,time));filter.type='lowpass';filter.frequency.value=opt.cut||2100;
const a=Math.max(ctx.currentTime,time),vol=opt.vol||.25;gain.gain.setValueAtTime(.0001,a);gain.gain.linearRampToValueAtTime(vol,a+Math.min(.025,len*.2));gain.gain.exponentialRampToValueAtTime(.0001,a+len);osc.connect(filter);filter.connect(gain);gain.connect(bus);osc.start(a);osc.stop(a+len+.04)}
function noise(time,duration,vol=.18,low=650,bus=ambientBus){if(!ctx)return;const size=Math.max(256,Math.ceil(ctx.sampleRate*Math.min(duration,2)));const buf=ctx.createBuffer(1,size,ctx.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<size;i++)arr[i]=(Math.random()*2-1);const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();n.buffer=buf;f.type='lowpass';f.frequency.value=low;g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),time+.035);g.gain.exponentialRampToValueAtTime(.0001,time+duration);n.connect(f);f.connect(g);g.connect(bus);n.start(time);n.stop(time+duration+.04)}
function fx(name){if(!cfg.enabled)return; if(!startAudio())return;const t=ctx.currentTime+.01;
switch(name){
case 'key':note(70+Math.floor(Math.random()*4),t,.09,{type:'sine',bus:sfxBus,vol:.35});break;
case 'delete':note(58,t,.12,{type:'triangle',bus:sfxBus});break;
case 'correct':note(76,t,.16,{bus:sfxBus,vol:.32});note(83,t+.105,.27,{bus:sfxBus,vol:.31});break;
case 'wrong':note(54,t,.17,{type:'triangle',bus:sfxBus,vol:.25});note(50,t+.14,.18,{type:'triangle',bus:sfxBus,vol:.22});break;
case 'missionStart':for(let i=0;i<3;i++)note(67+i*3,t+i*.17,.16,{bus:sfxBus});break;
case 'missionEnd':[67,71,74,79].forEach((n,i)=>note(n,t+i*.15,.5,{bus:sfxBus,vol:.27}));break;
case 'purchase':[74,79,83].forEach((n,i)=>note(n,t+i*.085,.3,{bus:sfxBus,vol:.24}));break;
case 'equip':note(59,t,.09,{type:'square',bus:sfxBus,vol:.09});note(74,t+.1,.19,{bus:sfxBus});break;
case 'question':note(73,t,.075,{bus:sfxBus,vol:.12});break;
case 'open':note(67,t,.10,{bus:sfxBus,vol:.2});note(72,t+.05,.1,{bus:sfxBus,vol:.14});break;
case 'select':note(74,t,.09,{bus:sfxBus,vol:.22});break;
case 'bird':note(83,t,.08,{bus:ambientBus,vol:.16});note(91,t+.09,.1,{bus:ambientBus,vol:.13});break;
case 'explosion':noise(t,.55,.95,1350,sfxBus);noise(t+.055,.75,.7,280,sfxBus);note(37,t,.42,{type:'sawtooth',bus:sfxBus,vol:.6,cut:280});note(29,t+.11,.58,{type:'triangle',bus:sfxBus,vol:.48,cut:130});break;
case 'collision':note(45,t,.17,{type:'triangle',bus:ambientBus,vol:.6});note(55,t+.13,.26,{type:'sawtooth',bus:ambientBus,vol:.1});break;
case 'ufo':note(76,t,.3,{type:'sine',bus:ambientBus,vol:.22});note(82,t+.21,.3,{bus:ambientBus,vol:.2});break;
case 'ufoDash':for(let i=0;i<6;i++)note(82+i*2,t+i*.045,.12,{type:'triangle',bus:ambientBus,vol:.14});break;
case 'ignition':noise(t,1.3,.65,480);note(34,t,1.6,{bus:ambientBus,type:'sawtooth',vol:.38,cut:240});break;
case 'steam':noise(t,1.1,.3,1200);break;
case 'airliner':noise(t,.65,.08,370);break;
case 'stars':[72,79,84].forEach((n,i)=>note(n,t+i*.25,.9,{bus:ambientBus,vol:.12}));break;
case 'confirm':note(76,t,.08,{bus:sfxBus,vol:.23});note(81,t+.075,.17,{bus:sfxBus,vol:.22});break;
case 'back':note(70,t,.08,{bus:sfxBus,vol:.18});note(65,t+.08,.13,{bus:sfxBus,vol:.17});break;
case 'close':note(75,t,.06,{bus:sfxBus,vol:.15});note(67,t+.065,.11,{bus:sfxBus,vol:.13});break;
case 'profile':note(64,t,.12,{type:'triangle',bus:sfxBus,vol:.17});note(76,t+.11,.23,{bus:sfxBus,vol:.22});break;
case 'profileNew':[72,76,79].forEach((n,i)=>note(n,t+i*.12,.22,{bus:sfxBus,vol:.21}));break;
case 'language':note(75,t,.09,{bus:sfxBus,vol:.2});note(82,t+.08,.16,{bus:sfxBus,vol:.16});break;
case 'theme':note(60,t,.24,{type:'triangle',bus:sfxBus,vol:.15});note(72,t+.13,.26,{bus:sfxBus,vol:.2});break;
case 'planet':note(70,t,.1,{bus:sfxBus,vol:.17});note(82,t+.1,.27,{bus:sfxBus,vol:.26});break;
case 'countdown':[72,72,72,84].forEach((n,i)=>note(n,t+i*.22,.16,{type:'triangle',bus:sfxBus,vol:.26}));break;
case 'streak':[76,80,83,88].forEach((n,i)=>note(n,t+i*.085,.2,{bus:sfxBus,vol:.23}));break;
case 'warning':note(84,t,.11,{type:'triangle',bus:sfxBus,vol:.23});note(84,t+.21,.11,{type:'triangle',bus:sfxBus,vol:.23});break;
case 'timeout':[67,62,55].forEach((n,i)=>note(n,t+i*.17,.34,{bus:sfxBus,vol:.23}));break;
case 'perfect':[72,76,79,84,88,91].forEach((n,i)=>note(n,t+i*.16,.47,{bus:sfxBus,vol:.25}));break;
case 'coins':for(let i=0;i<5;i++)note(79+i*2,t+i*.08,.12,{bus:sfxBus,vol:.2});break;
case 'medal':[65,72,77,84].forEach((n,i)=>note(n,t+i*.17,.43,{bus:sfxBus,vol:.23}));break;
case 'record':[77,81,84,89,93].forEach((n,i)=>note(n,t+i*.10,.37,{bus:sfxBus,vol:.25}));break;
case 'part':note(65,t,.09,{type:'triangle',bus:sfxBus,vol:.18});break;
case 'buy':note(70,t,.12,{bus:sfxBus,vol:.18});note(82,t+.13,.21,{bus:sfxBus,vol:.25});break;
case 'noCoins':[55,52].forEach((n,i)=>note(n,t+i*.14,.17,{type:'triangle',bus:sfxBus,vol:.22}));break;
case 'designSave':[72,79,84].forEach((n,i)=>note(n,t+i*.09,.22,{bus:sfxBus,vol:.21}));break;
case 'companion':[60,67,72].forEach((n,i)=>note(n,t+i*.13,.33,{bus:ambientBus,vol:.18}));break;
case 'engineWindup':note(36,t,.8,{type:'sawtooth',bus:ambientBus,vol:.14,cut:280});note(43,t+.32,.75,{type:'triangle',bus:ambientBus,vol:.19,cut:460});break;
case 'ascent':noise(t,.85,.28,300);note(40,t,.8,{type:'sawtooth',bus:ambientBus,vol:.15,cut:340});break;
case 'cloud':noise(t,.53,.13,1100);break;
case 'planetPass':[72,79,84].forEach((n,i)=>note(n,t+i*.14,.72,{bus:ambientBus,vol:.095}));break;
case 'ufoApproach':[77,78,80,82].forEach((n,i)=>note(n,t+i*.16,.35,{type:'sine',bus:ambientBus,vol:.16}));break;
case 'footsteps':note(43,t,.09,{type:'triangle',bus:ambientBus,vol:.12});note(46,t+.21,.1,{type:'triangle',bus:ambientBus,vol:.1});break;
case 'supportEngine':note(53,t,.65,{type:'triangle',bus:ambientBus,vol:.13,cut:510});break;
case 'launchLoop':note(39,t,1.2,{type:'sawtooth',bus:ambientBus,vol:.09,cut:280});break;

}}
function chooseNext(){const all=cfg.track==='all';if(!all){track=Number(cfg.track)||0;return}if(cfg.shuffle){const next=Math.floor(Math.random()*(NAMES.length-1));track=(track+next+1)%NAMES.length}else track=(track+1)%NAMES.length;syncTitle()}
function syncTitle(){const el=document.getElementById('ttAudioNow');if(el)el.textContent=(document.documentElement.lang==='es'?'Sonando: ':'Now playing: ')+NAMES[track]}
function schedule(){if(!ctx||!session||!cfg.enabled||document.hidden)return;
let budget=0;while(nextBeat<ctx.currentTime+.15&&budget++<6){const theme=THEMES[track],pos=step%16,bar=Math.floor(step/16),beat=60/theme.bpm/2;
if(cfg.music>0){const lead=theme.lead[pos];if(lead!=null)note(theme.root+24+lead,nextBeat,beat*.86,{type:bar%2?'sine':'triangle',vol:.13,cut:1450});
const bass=theme.bass[pos];if(bass!=null)note(theme.root-12+bass,nextBeat,beat*2.7,{type:'triangle',vol:.13,cut:450});
if(pos===0)for(const offset of [0,7,12])note(theme.root+12+theme.pad[bar%4]+offset,nextBeat,beat*7.5,{type:'sine',vol:.032,cut:900});}
step++;stepsInTrack++;nextBeat+=beat;
if(stepsInTrack>=128){stepsInTrack=0;chooseNext()}
}}
function set(key,value){cfg[key]=value;save();updateVolumes();if(key==='track'){track=value==='all'?0:Number(value);step=0;stepsInTrack=0;syncTitle()}}
function buildUi(){for(const [id,key] of [['ttMusicVolume','music'],['ttSfxVolume','sfx'],['ttAmbientVolume','ambient']]){const el=document.getElementById(id);if(!el)continue;el.value=cfg[key];const output=document.getElementById(id.replace('Volume','Value'));if(output)output.textContent=cfg[key]+'%';el.addEventListener('input',()=>{set(key,Number(el.value));if(output)output.textContent=el.value+'%';startAudio()})}
const e=document.getElementById('ttAudioEnabled');e.checked=cfg.enabled;e.addEventListener('change',()=>{set('enabled',e.checked);if(e.checked)startAudio()});
const sh=document.getElementById('ttAudioShuffle');sh.checked=cfg.shuffle;sh.addEventListener('change',()=>set('shuffle',sh.checked));
const selector=document.getElementById('ttSoundtrack');selector.value=cfg.track;selector.addEventListener('change',()=>{set('track',selector.value);startAudio()});
document.getElementById('ttAudioNext')?.addEventListener('click',()=>{startAudio();chooseNext();step=0;stepsInTrack=0;nextBeat=ctx.currentTime+.08});
document.getElementById('ttAudioTest')?.addEventListener('click',()=>fx('correct'));syncTitle();}
function visibleScene(){if(!document.getElementById('launchSplash')?.classList.contains('hidden'))return 'splash';if(!document.getElementById('garage')?.classList.contains('hidden'))return 'garage';if(!document.getElementById('dashboard')?.classList.contains('hidden'))return 'dashboard';return ''}
const cueList=[[0,'engineWindup'],[.4,'ignition'],[1.1,'steam'],[1.8,'ascent'],[2.7,'bird'],[3.8,'cloud'],[4.7,'collision'],[6.2,'airliner'],[7.8,'supportEngine'],[9.2,'stars'],[10.7,'planetPass'],[12.3,'ufoApproach'],[13,'ufo'],[15,'ufoDash'],[16.4,'footsteps']];
function monitorScene(){
 const current=visibleScene();
 if(current!==lastScene){lastScene=current;sceneT0=performance.now();lastCueCycle=-1;emittedCues.clear();}
 if(!session||!cfg.enabled||!current||document.hidden)return;
 const elapsedTotal=Math.max(0,(performance.now()-sceneT0)/1000);
 const cycle=Math.floor(elapsedTotal/18),elapsed=elapsedTotal%18;
 if(cycle!==lastCueCycle){lastCueCycle=cycle;emittedCues.clear();}
 for(let i=0;i<cueList.length;i++){
   const [at,name]=cueList[i];
   if(elapsed>=at&&!emittedCues.has(i)){
     emittedCues.add(i);
     // Let low-frequency launch ambience recur very softly, but do not replay
     // every effect on every frame or dump earlier cues together.
     if(cycle===0||['bird','cloud','planetPass','ufoApproach','ufo','ufoDash','footsteps'].includes(name))fx(name);
   }
 }
}

function init(){buildUi();const splash=document.getElementById('launchSplash');
const unlock=()=>{const was=!session;startAudio();if(was && visibleScene()==='splash')fx('engineWindup');document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)};
document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
document.addEventListener('click',ev=>{const button=ev.target.closest('button,[role="button"]');if(!button)return;
if(button.closest('#ttAudioSettings')||button.classList.contains('key'))return;
const label=(button.textContent||'').trim().toLowerCase();
if(button.matches('.planet,.planetCard,.planetOption,[data-table]')||button.closest('#planets'))fx('planet');
else if(button.matches('.themeChoice'))fx('theme');
else if(button.matches('.langChoice,[data-lang]')||/^(español|english)$/.test(label))fx('language');
else if(button.closest('#profileGate')||button.matches('.headerPilot,.profileCard,.profileChoice'))fx(/crear|new|añadir/i.test(label)?'profileNew':'profile');
else if(button.matches('.garageTab,.garageThumb,.previewBtn')||button.closest('.garageItem'))fx('part');
else if(button.closest('#buyDialog'))fx(/comprar|buy/i.test(label)?'buy':'close');
else if(/guardar|save design|save rocket/i.test(label))fx('designSave');
else if(/^(atrás|back|volver|cancel|cancelar)/i.test(label)||button.matches('.backBtn'))fx('back');
else if(button.matches('.closeBtn,.drawerClose,[aria-label*="Close"],[aria-label*="Cerrar"]'))fx('close');
else if(button.closest('#sideDrawer')||button.matches('.navicon'))fx('open');
else if(/empezar|start|launch|jugar/i.test(label))fx('countdown');
else if(/confirmar|confirm|comprobar|check/i.test(label))fx('confirm');
else if(button.closest('#settings')||button.closest('#home'))fx('select');
},true);
setInterval(monitorScene,90);
// Cross-screen cues: time warnings, successful streaks and perfect scores.
let priorClock=null, lastStreak=0,prevResultVisible=false;
setInterval(()=>{
 if(!session)return;
 const clock=document.getElementById('clock');const match=clock?.textContent?.match(/(\d+):(\d+)/);
 const secs=match?Number(match[1])*60+Number(match[2]):null;
 const playVisible=document.getElementById('play')&&!document.getElementById('play').classList.contains('hidden');
 if(playVisible&&secs!==null&&secs<=10&&secs>0&&(priorClock===null||priorClock>10))fx('warning');
 if(playVisible&&secs===0&&priorClock>0)fx('timeout');
 priorClock=playVisible?secs:null;
 const result=document.getElementById('results'),visible=result&&!result.classList.contains('hidden');
 if(visible&&!prevResultVisible){const text=result.textContent||'';if(/100\s*%/.test(text))fx('perfect');else fx('medal');}
 prevResultVisible=Boolean(visible);
},450);
// Guaranteed audio on the splash's first intentional activation, even when
// its element is not an actual <button>.
const launchSplash=document.getElementById('launchSplash');
// Splash audio is unlocked by the shared first-gesture listener above.
}
window.TTAudio={sfx:fx,start:startAudio,restartLaunch:()=>{sceneT0=performance.now();lastScene='splash';lastCueCycle=-1;emittedCues.clear();},set,config:()=>({...cfg}),next:chooseNext};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
