import { NextResponse } from 'next/server';
import { validWeather } from '../../../lib/weather';

export async function GET(request:Request) {
  const query=new URL(request.url).searchParams;
  const rawLat=query.get('lat'), rawLon=query.get('lon');
  const lat=Number(rawLat), lon=Number(rawLon);
  if (!rawLat?.trim() || !rawLon?.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return NextResponse.json({error:'Valid latitude and longitude are required.'},{status:400});
  const params=new URLSearchParams({latitude:lat.toFixed(3),longitude:lon.toFixed(3),timezone:'auto',timeformat:'unixtime',forecast_hours:'12',current:'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,cloud_cover,wind_speed_10m,is_day',hourly:'temperature_2m,weather_code'});
  try {
    const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:AbortSignal.timeout(12000),next:{revalidate:300}});
    if (!response.ok) throw new Error('Provider unavailable');
    const body=await response.json();
    if (!validWeather(body)) throw new Error('Incomplete weather data');
    return NextResponse.json({...body,fetchedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=60, s-maxage=300'}});
  } catch {
    return NextResponse.json({error:'Weather data is temporarily unavailable. Try again shortly.'},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
