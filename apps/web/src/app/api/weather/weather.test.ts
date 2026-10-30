import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { GET as search } from './search/route';
import { describeWeather, temperature, validWeather } from '../../../lib/weather';
afterEach(()=>vi.unstubAllGlobals());
const current={time:Date.now()/1000,interval:900,temperature_2m:15,apparent_temperature:14,relative_humidity_2m:85,weather_code:63,precipitation:1,cloud_cover:100,wind_speed_10m:12,is_day:1};
describe('weather routes',()=>{
  it.each(['','?lat=&lon=0','?lat=91&lon=0','?lat=0&lon=181','?lat=NaN&lon=0'])('rejects invalid coordinates %s',async query=>{
    const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    expect((await GET(new Request('http://local/api/weather'+query))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
  });
  it('uses bounded, cached fixed-provider requests',async()=>{
    const fetch=vi.fn().mockResolvedValue(Response.json({timezone:'America/Chicago',current}));vi.stubGlobal('fetch',fetch);
    const result=await GET(new Request('http://local/api/weather?lat=41.8781&lon=-87.6298'));
    expect(result.status).toBe(200);expect((await result.json()).current.weather_code).toBe(63);
    expect(fetch.mock.calls[0][0]).toContain('https://api.open-meteo.com/v1/forecast?latitude=41.878&longitude=-87.630');
    expect(fetch.mock.calls[0][1].next.revalidate).toBe(300);
  });
  it('does not convert provider failure into clear skies',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('timeout')));
    expect((await GET(new Request('http://local/api/weather?lat=0&lon=0'))).status).toBe(502);
  });
  it('rejects partial upstream data',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({timezone:'UTC',current:{...current,temperature_2m:null}})));
    expect((await GET(new Request('http://local/api/weather?lat=0&lon=0'))).status).toBe(502);
  });
  it('searches places with qualified names',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({results:[{id:1,name:'Chicago',admin1:'Illinois',country:'United States',latitude:41.8,longitude:-87.6}]})));
    expect((await (await search(new Request('http://local/api/weather/search?q=Chicago'))).json()).results[0].name).toBe('Chicago, Illinois, United States');
    expect((await search(new Request('http://local/api/weather/search?q=x'))).status).toBe(400);
  });
});
describe('weather scenes',()=>{
  it.each([[0,20,'clear'],[3,20,'clouds'],[45,10,'fog'],[63,12,'rain'],[75,-3,'snow'],[99,25,'storm'],[0,35,'heat'],[999,15,'unknown']])('maps code %s safely',(code,temp,scene)=>expect(describeWeather(Number(code),Number(temp)).scene).toBe(scene));
  it('converts display units without changing stored data',()=>{expect(temperature(0,'F')).toBe(32);expect(temperature(20,'C')).toBe(20);});
  it('rejects missing weather fields',()=>{expect(validWeather({timezone:'UTC',current})).toBe(true);expect(validWeather({timezone:'UTC',current:{time:1}})).toBe(false);});
});
