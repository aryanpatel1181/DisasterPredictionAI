export type WeatherScene = 'clear' | 'clouds' | 'fog' | 'rain' | 'snow' | 'storm' | 'heat' | 'unknown';
export type WeatherPoint = {latitude:number; longitude:number; name:string};
export interface WeatherData {
  timezone:string;
  current: {time:number; interval:number; temperature_2m:number; apparent_temperature:number; relative_humidity_2m:number; weather_code:number; precipitation:number; cloud_cover:number; wind_speed_10m:number; is_day:number};
  hourly?: {time:number[]; temperature_2m:number[]; weather_code:number[]};
  fetchedAt:string;
}
export function describeWeather(code:number, temperature:number): {scene:WeatherScene; label:string} {
  if ([95,96,99].includes(code)) return {scene:'storm',label:'Thunderstorms'};
  if ([71,73,75,77,85,86].includes(code)) return {scene:'snow',label:'Snow'};
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return {scene:'rain',label:code<60?'Drizzle':code===66||code===67?'Freezing rain':'Rain'};
  if ([45,48].includes(code)) return {scene:'fog',label:'Fog'};
  if ([2,3].includes(code)) return {scene:'clouds',label:code===3?'Overcast':'Partly cloudy'};
  if ([0,1].includes(code)) return {scene:temperature>=32?'heat':'clear',label:temperature>=32?'Hot & mostly clear':code===0?'Clear skies':'Mostly clear'};
  return {scene:'unknown',label:'Conditions unavailable'};
}
export function temperature(value:number, unit:'C'|'F') {return Math.round(unit==='F'?value*9/5+32:value);}

export function validWeather(body:unknown): body is WeatherData {
  if (!body || typeof body !== 'object') return false;
  const data=body as WeatherData;
  return typeof data.timezone==='string' && !!data.current && ['time','interval','temperature_2m','apparent_temperature','relative_humidity_2m','weather_code','precipitation','cloud_cover','wind_speed_10m','is_day'].every(key=>typeof data.current[key as keyof WeatherData['current']]==='number' && Number.isFinite(data.current[key as keyof WeatherData['current']]));
}
