
(function(){
 var shade=document.getElementById('ttTourShade');
 if(!shade)return;
 var ns='http://www.w3.org/2000/svg';
 var svg=document.createElementNS(ns,'svg');svg.setAttribute('id','ttTourDimmer');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<defs><mask id="ttTourCutout"><rect width="100%" height="100%" fill="white"/><rect id="ttTourHole" x="-100" y="-100" width="0" height="0" rx="13" fill="black"/></mask></defs><rect width="100%" height="100%" fill="rgba(6,16,41,.78)" mask="url(#ttTourCutout)"/>';
 shade.insertBefore(svg,shade.firstChild);
 var hole=svg.querySelector('#ttTourHole');
 function refresh(){
  if(!shade.classList.contains('ttTourVisible'))return;
  var target=document.querySelector('.ttTourSpot');
  if(!target){hole.setAttribute('x','-100');hole.setAttribute('width','0');return}
  var r=target.getBoundingClientRect(),pad=8;
  hole.setAttribute('x',Math.max(0,r.left-pad));hole.setAttribute('y',Math.max(0,r.top-pad));
  hole.setAttribute('width',Math.max(0,Math.min(innerWidth,r.right+pad)-Math.max(0,r.left-pad)));
  hole.setAttribute('height',Math.max(0,Math.min(innerHeight,r.bottom+pad)-Math.max(0,r.top-pad)));
 }
 new MutationObserver(refresh).observe(shade,{attributes:true,attributeFilter:['class']});
 new MutationObserver(refresh).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',refresh);window.addEventListener('scroll',refresh,true);
 setInterval(refresh,150);
})();

