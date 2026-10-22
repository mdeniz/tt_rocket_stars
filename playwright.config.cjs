const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'tests',timeout:30000,retries:process.env.CI?1:0,
 reporter:process.env.CI?'github':'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 projects:[
 {name:'chromium',use:{...devices['Desktop Chrome']}},
 {name:'firefox',use:{...devices['Desktop Firefox']}},
 {name:'webkit',use:{...devices['Desktop Safari']}},
 {name:'webkit-mobile',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
 ],
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});