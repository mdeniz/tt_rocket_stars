const {test,expect}=require('@playwright/test');
test('one-tap splash opens dashboard without uncaught JS errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page).toHaveTitle(/TT Rocket Stars/);
 const splash=page.locator('#launchSplash');await expect(splash).toBeVisible();
 await splash.click();await expect(splash).toBeHidden({timeout:8000});
 await expect(page.locator('#dashboard')).toBeVisible();
 expect(errors,errors.join('\n')).toEqual([]);
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
test('settings exposes optional auth without replacing local gameplay',async({page})=>{
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();
 await page.locator('#sideDrawer [data-section="settings"]').click();
 await expect(page.locator('#settings')).toBeVisible();
 await expect(page.locator('#ttAuthPanel')).toBeVisible();
 await expect(page.locator('#ttAuthEmail')).toHaveAttribute('type','email');
 await expect(page.locator('#ttAuthPanel [data-i18n="ui.070"]')).toHaveAttribute('data-es','Acceso en la nube');
});

test('settings navigation isolates cloud access from every local category', async ({ page }) => {
 test.setTimeout(60000);
 await page.goto('/');await page.locator('#launchSplash').click();
 await expect(page.locator('#launchSplash')).toBeHidden();
 const skip=page.locator('#ttTourSkip');
 await page.locator('#ttTourShade').waitFor({state:'visible',timeout:3000}).catch(()=>{});
 if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();await page.locator('#sideDrawer [data-section="settings"]').click();
 const tabs=page.locator('#settings .ttSettingsBottomNav .ttSettingsTab');
 await expect(tabs).toHaveCount(7);
 for(const label of ['Sound','Pilot','Language','Theme','Backups','Reset']){
  await tabs.filter({hasText:label}).click();
  await expect(page.locator('#ttAuthPanel')).not.toHaveClass(/ttSettingsActive/);
 }
 await tabs.filter({hasText:'Cloud access'}).click();
 await expect(page.locator('#ttAuthPanel')).toHaveClass(/ttSettingsActive/);
 await expect(page.locator('#ttCloudSyncNow')).toBeVisible();
 await expect(page.locator('#ttCloudList')).toBeVisible();
 await expect(page.locator('#ttCloudDelete')).toBeVisible();
});
