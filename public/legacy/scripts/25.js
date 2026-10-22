
(function(){
 function init(){
  const drawer=document.getElementById('sideDrawer');
  const nav=document.getElementById('ttMainBottomNav');
  if(!drawer||!nav)return;
  const sync=()=>{nav.style.display=drawer.classList.contains('open')?'none':''};
  new MutationObserver(sync).observe(drawer,{attributes:true,attributeFilter:['class']});
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

