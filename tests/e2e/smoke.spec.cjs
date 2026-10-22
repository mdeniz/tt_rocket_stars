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
 const skip=page.locator('#ttTourSkip');if(await skip.isVisible().catch(()=>false))await skip.click();
 await page.locator('#menuBtn').click();
 await expect(page.locator('#sideDrawer')).toHaveClass(/open/);
 await page.locator('#sideDrawer .drawerClose').click();
 await expect(page.locator('#sideDrawer')).not.toHaveClass(/open/);
});
