
function updateFullscreenMenu(){
  const active=!!document.fullscreenElement;
  const icon=document.getElementById('fullscreenIcon');
  const label=document.querySelector('.drawerFullscreen span');
  const es=typeof lang!=='undefined'&&lang==='es';
  if(icon)icon.innerHTML=active
    ?'<path d="M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6"/>'
    :'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>';
  if(label)label.textContent=active?(es?'Salir de pantalla completa':'Exit fullscreen'):(es?'Pantalla completa':'Fullscreen');
}

function openDrawer(){document.getElementById('drawerOverlay').classList.remove('hidden');document.getElementById('sideDrawer').classList.add('open');document.getElementById('sideDrawer').setAttribute('aria-hidden','false');document.getElementById('menuBtn').setAttribute('aria-expanded','true')}
function closeDrawer(){document.getElementById('drawerOverlay').classList.add('hidden');document.getElementById('sideDrawer').classList.remove('open');document.getElementById('sideDrawer').setAttribute('aria-hidden','true');document.getElementById('menuBtn').setAttribute('aria-expanded','false')}

