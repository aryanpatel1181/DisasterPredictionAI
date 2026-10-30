// UI fixtures only. Never download public OSM tiles through automated browser scans.
const puppeteer=require('puppeteer');
const assert=require('node:assert/strict');
const url=process.env.WEATHER_TEST_URL||'http://localhost:3001';
(async()=>{
  const browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewport({width:1440,height:1100});
    const pixel=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=256;return c.toDataURL().split(',')[1];}),'base64');
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    let fail=false;
    let stale=false;
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const target=new URL(request.url());
      if(target.hostname==='tile.openstreetmap.org')return request.respond({status:200,contentType:'image/png',body:pixel});
      if(target.pathname==='/api/weather/search')return request.respond({contentType:'application/json',body:JSON.stringify({results:[{name:'Paris, France',latitude:48.8566,longitude:2.3522}]})});
      if(target.pathname==='/api/weather'){
        if(fail)return request.respond({status:502,contentType:'application/json',body:JSON.stringify({error:'Weather data is temporarily unavailable. Try again shortly.'})});
        const lat=Number(target.searchParams.get('lat'));
        const code=lat>60?75:lat>50?3:lat<40?0:63;
        const now=Math.floor(Date.now()/1000)-(stale?7200:0);
        return request.respond({contentType:'application/json',body:JSON.stringify({timezone:'UTC',fetchedAt:new Date().toISOString(),current:{time:now,interval:900,temperature_2m:code===75?-3:code===0?35:15,apparent_temperature:12,relative_humidity_2m:80,weather_code:code,precipitation:code===63?1.5:0,cloud_cover:90,wind_speed_10m:14,is_day:1},hourly:{time:[now+3600,now+7200],temperature_2m:[14,12],weather_code:[code,code]}})});
      }
      request.continue();
    });
    await page.goto(url+'/weather',{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>!document.querySelector('.atlas-map-message'));
    assert.ok(await page.$eval('.weather-map canvas',el=>el.getBoundingClientRect().height)>400,'map has a visible canvas');
    await page.screenshot({path:'work/weather-world.png',fullPage:true});
    await page.click('.atlas-cities button:nth-child(1)');
    await page.waitForSelector('[data-scene="rain"]');
    assert.match(await page.$eval('.atlas-place',el=>el.textContent),/Chicago/);
    assert.match(await page.$eval('.atlas-temperature',el=>el.textContent),/59/);
    await page.click('.atlas-unit');
    assert.match(await page.$eval('.atlas-temperature',el=>el.textContent),/15/);
    await page.screenshot({path:'work/weather-rain.png',fullPage:true});
    await page.click('.atlas-cities button:nth-child(4)');
    await page.waitForSelector('[data-scene="snow"]');
    assert.match(await page.$eval('.atlas-place',el=>el.textContent),/Reykjavík/);
    await page.click('.atlas-cities button:nth-child(3)');
    await page.waitForSelector('[data-scene="heat"]');
    await page.click('[aria-label="Pause weather animation"]');
    await page.waitForSelector('.atmosphere-paused');
    await page.type('[aria-label="Search city or country"]','Paris');
    await page.waitForSelector('.atlas-results button');
    await page.click('.atlas-results button');
    await page.waitForSelector('[data-scene="rain"]');
    assert.match(await page.$eval('.atlas-place',el=>el.textContent),/Paris/);
    fail=true;
    await page.click('.atlas-cities button:nth-child(2)');
    await page.waitForSelector('.atlas-error');
    assert.equal(await page.$('.weather-atmosphere'),null,'old city effects removed on error');
    fail=false;stale=true;
    await page.click('.atlas-error button');
    await page.waitForFunction(()=>document.querySelector('.atlas-updated')?.textContent.includes('OLDER DATA'));
    assert.equal(await page.$('.weather-atmosphere'),null,'stale data has no live effect');
    stale=false;
    await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await page.waitForSelector('.atlas-cities');
    await page.waitForFunction(()=>!document.querySelector('.atlas-map-message'));
    await page.click('.atlas-cities button:nth-child(1)');
    await page.waitForSelector('[data-scene="rain"]');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile fits viewport');
    await page.screenshot({path:'work/weather-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
    await page.goto(url,{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.querySelector('.globe-canvas canvas')?.dataset.view);
    const canvas=await page.$('.globe-canvas canvas');await canvas.scrollIntoView();
    const box=await canvas.boundingBox();
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.waitForFunction(()=>location.pathname==='/weather'&&location.search.includes('lat='));
    console.log('Weather Atlas passed: globe load, click entry, city switching, rain/snow/heat effects, search, units, pause, provider error, stale data, mobile layout. Weather and street tiles were fixtures.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
