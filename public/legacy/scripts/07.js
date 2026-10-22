
(function(){
const KEY='tt-rocket-themes-v1';const valid=['deep','galaxy','red','lilac'];
function activeId(){try{return window.TTLocalStore.getItem('tt-rocket-active-profile-v1')||''}catch(e){return ''}}
function getMap(){try{return JSON.parse(window.TTLocalStore.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function getTheme(){const map=getMap();return valid.includes(map[activeId()])?map[activeId()]:'deep'}
function applyTheme(theme){document.documentElement.dataset.rocketTheme=theme;document.querySelectorAll('.themeChoice').forEach(b=>{const on=b.dataset.theme===theme;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))})}
window.setRocketTheme=function(theme){if(!valid.includes(theme))return;const map=getMap();map[activeId()]=theme;window.TTLocalStore.setItem(KEY,JSON.stringify(map));applyTheme(theme)};
applyTheme(getTheme());
})();

