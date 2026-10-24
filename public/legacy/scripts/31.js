
(function(){
 var splash=document.getElementById('launchSplash');
 if(!splash)return;
 function recover(){
  setTimeout(function(){
   if(splash.classList.contains('hidden'))return;
   try{
    if(window.TTProfiles && !window.TTProfiles.active()){
     var profiles=window.TTProfiles.read();
     if(profiles.length)window.TTProfiles.choose(profiles[0].id);
     else window.TTProfiles.create('Piloto 1');
    }
   }catch(e){console.warn('Safari profile recovery',e)}
   try{if(typeof navigate==='function')navigate('dashboard')}catch(e){console.warn('Safari navigation recovery',e)}
   window.TTAccessibility.hideRegion(splash,document.getElementById('menuBtn'));
   var dash=document.getElementById('dashboard');
   if(dash)dash.classList.remove('hidden');
  },650);
 }
 splash.addEventListener('click',recover,true);
 splash.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')recover()},true);
})();
