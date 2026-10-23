const {defineConfig,devices}=require('@playwright/test');
const projects=[
 {name:'chromium',use:{...devices['Desktop Chrome']}},
 {name:'firefox',use:{...devices['Desktop Firefox']}},
 {name:'webkit',use:{...devices['Desktop Safari']}}
];
if(process.env.PLAYWRIGHT_MOBILE==='1'){
 projects.push({name:'webkit-mobile',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}});
}
module.exports=defineConfig({
 testDir:'tests/e2e',timeout:30000,retries:process.env.CI?1:0,workers:process.env.PLAYWRIGHT_WORKERS?Number(process.env.PLAYWRIGHT_WORKERS):2,
 reporter:process.env.CI?[['github'],['html',{open:'never'}]]:'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects,
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000}
});
