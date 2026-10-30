import { NextResponse } from 'next/server';

export async function GET(request:Request) {
  const query=new URL(request.url).searchParams.get('q')?.trim()||'';
  if(query.length<2 || query.length>80) return NextResponse.json({error:'Enter between 2 and 80 characters.'},{status:400});
  try {
    const params=new URLSearchParams({name:query,count:'6',language:'en',format:'json'});
    const response=await fetch('https://geocoding-api.open-meteo.com/v1/search?'+params,{signal:AbortSignal.timeout(10000),next:{revalidate:86400}});
    if(!response.ok) throw new Error('Search unavailable');
    const body=await response.json();
    const results=(Array.isArray(body.results)?body.results:[]).filter((r:{latitude?:number;longitude?:number;name?:string})=>Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)&&typeof r.name==='string').map((r:{id:number;name:string;admin1?:string;country?:string;latitude:number;longitude:number})=>({id:r.id,name:[r.name,r.admin1,r.country].filter(Boolean).join(', '),latitude:r.latitude,longitude:r.longitude}));
    return NextResponse.json({results},{headers:{'Cache-Control':'public, max-age=3600'}});
  } catch {return NextResponse.json({error:'City search is temporarily unavailable. You can still select a point on the globe.'},{status:502});}
}
