// Run with the web server on port 3001. Network fixtures are test-only.
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
(async () => {
  const browser = await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.setViewport({width:1440,height:1100});
    await page.setRequestInterception(true);
    page.on('request',request=>{
      if(request.url().includes('/api/v1/events')) {
        request.respond({contentType:'application/json',body:JSON.stringify({events:[
          {event_id:'demo-japan',hazard_type:'earthquake',status:'OBSERVED',latitude:38,longitude:142,country:'Japan',severity:'HIGH',explanation:{human_summary:'Test fixture: seismic observation',primary_drivers:[]}},
          {event_id:'demo-flood',hazard_type:'flood',status:'AI_RISK_ESTIMATE',latitude:50,longitude:8,country:'Germany',severity:'MODERATE',explanation:{human_summary:'Synthetic research scenario',primary_drivers:[]}}
        ]})});
      } else request.continue();
    });
    await page.goto('http://localhost:3001',{waitUntil:'networkidle2'});
    await page.waitForSelector('.signal-row');
    await page.waitForSelector('.map-signal');
    await page.screenshot({path:'work/desktop.png',fullPage:true});
    assert.equal(await page.$$eval('.signal-row',items=>items.length),1);
    await page.click('.signal-row');
    await page.waitForSelector('.signal-detail');
    await page.keyboard.press('Escape');
    assert.equal(await page.$('.signal-detail'),null);
    await page.click('.view-switch button:nth-child(2)');
    assert.match(await page.$eval('.signal-list',e=>e.textContent),/Germany/);
    await page.type('input[aria-label="Search signals by location"]','Tokyo');
    assert.match(await page.$eval('.signal-list',e=>e.textContent),/No signals/);
    await page.setViewport({width:390,height:844});
    await page.reload({waitUntil:'networkidle2'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'mobile overflow');
    await page.screenshot({path:'work/mobile.png',fullPage:true});
    await page.goto('http://localhost:3001/about',{waitUntil:'networkidle2'});
    assert.match(await page.$eval('main',e=>e.textContent),/synthetic data/i);
    assert.deepEqual(errors,[]);
    console.log('Browser checks passed: observations, research switch, event details, Escape, search, mobile layout, methodology.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
