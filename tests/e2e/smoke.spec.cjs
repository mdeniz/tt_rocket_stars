const {test,expect}=require('@playwright/test');
const packageJson=require('../../package.json');

async function installFullscreenProbe(page,{touch=false}={}){
 await page.addInitScript(({touch})=>{
  Object.defineProperty(Navigator.prototype,'maxTouchPoints',{configurable:true,value:touch?5:0});
  const originalMatchMedia=window.matchMedia.bind(window);
  window.matchMedia=query=>query==='(pointer: coarse)'?{matches:touch,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false}}:originalMatchMedia(query);
  window.__ttFullscreenRequests=0;
  Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value(){window.__ttFullscreenRequests+=1;return Promise.resolve()}});
 },{touch});
}

test('one-tap splash opens dashboard without uncaught JS errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page).toHaveTitle(/TT Rocket Stars/);
 const splash=page.locator('#launchSplash');await expect(splash).toBeVisible();
 await splash.click();await expect(splash).toBeHidden({timeout:8000});
 await expect(page.locator('#dashboard')).toBeVisible();
 expect(errors,errors.join('\n')).toEqual([]);
});

test('startup and drawer closure avoid favicon and aria-hidden diagnostics',async({page})=>{
 const diagnostics=[];const faviconRequests=[];
 page.on('console',message=>{if(/aria-hidden|favicon/i.test(message.text()))diagnostics.push(message.text())});
 page.on('request',request=>{if(request.url().endsWith('/favicon.ico'))faviconRequests.push(request.url())});
 await page.goto('/');
 await page.locator('#launchSplash').focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('#dashboard')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.activeElement?.id)).toBe('menuBtn');
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();
 await expect(page.locator('#sideDrawer')).toHaveClass(/open/);
 await expect(page.locator('#sideDrawer .drawerClose')).toBeVisible();
 await page.locator('#sideDrawer .drawerClose').focus();
 await page.locator('#sideDrawer .drawerClose').click();
 await expect.poll(()=>page.evaluate(()=>document.activeElement?.id)).toBe('menuBtn');
 expect(faviconRequests).toEqual([]);
 expect(diagnostics,diagnostics.join('\n')).toEqual([]);
});

test('desktop splash entry stays windowed, including at a narrow viewport',async({page})=>{
 await installFullscreenProbe(page);
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('#launchSplash').click();
 await expect(page.locator('#dashboard')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__ttFullscreenRequests)).toBe(0);
});

test('touch-oriented splash entry requests fullscreen without blocking navigation',async({page})=>{
 await installFullscreenProbe(page,{touch:true});
 await page.goto('/');
 await page.locator('#launchSplash').click();
 await expect(page.locator('#dashboard')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__ttFullscreenRequests)).toBe(1);
 // Browser emulation verifies capability routing only; it is not real iOS Safari.
});
test('drawer can be opened and closed',async({page})=>{
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const tour=page.locator('#ttTourShade');
 const skip=page.locator('#ttTourSkip');
 await tour.waitFor({state:'visible',timeout:2000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await expect(tour).not.toHaveClass(/ttTourVisible/);
 await page.locator('#menuBtn').click();
 await expect(page.locator('#sideDrawer')).toHaveClass(/open/);
 await page.locator('#sideDrawer .drawerClose').click();
 await expect(page.locator('#sideDrawer')).not.toHaveClass(/open/);
});
test('About displays the canonical version in English and Spanish', async ({ page }) => {
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();await page.locator('#sideDrawer [data-section="about"]').click();
 await expect(page.locator('#ttAppVersion')).toHaveText(packageJson.version);
 await expect(page.locator('#about [data-i18n="ui.088"]')).toHaveText('Version');
 await page.evaluate(() => window.setLanguage('es'));
 await expect(page.locator('#about [data-i18n="ui.088"]')).toHaveText('Versión');
 await expect(page.locator('#ttAppVersion')).toHaveText(packageJson.version);
});
test('settings hides unfinished cloud access without replacing local gameplay',async({page})=>{
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();
 await page.locator('#sideDrawer [data-section="settings"]').click();
 await expect(page.locator('#settings')).toBeVisible();
 await expect(page.locator('#ttAuthPanel')).toBeHidden();
 await expect(page.locator('#settings .ttSettingsTab').filter({hasText:'Cloud access'})).toHaveCount(0);
});

test('settings navigation isolates local categories', async ({ page }) => {
 test.setTimeout(60000);
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();await page.locator('#sideDrawer [data-section="settings"]').click();
 const tabs=page.locator('#settings .ttSettingsBottomNav .ttSettingsTab');
 await expect(tabs).toHaveCount(6);
 for(const label of ['Sound','Pilot','Language','Theme','Backups','Reset']){
  await tabs.filter({hasText:label}).click();
  await expect(page.locator('#ttAuthPanel')).not.toHaveClass(/ttSettingsActive/);
 }
 await expect(page.locator('#ttAuthPanel')).toBeHidden();
});
