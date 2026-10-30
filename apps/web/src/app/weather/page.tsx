'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Search, Wind, Droplets, Cloud, Thermometer, Pause, Play, RefreshCw, ArrowUpRight } from 'lucide-react';
import WeatherAtmosphere from '@/components/Weather/WeatherAtmosphere';
import { describeWeather, temperature, validWeather, type WeatherData, type WeatherPoint } from '@/lib/weather';
import './weather.css';

const WeatherGlobe=dynamic(()=>import('@/components/Weather/WeatherGlobe'),{ssr:false,loading:()=> <div className="atlas-map-message">Preparing the weather globe…</div>});
const cities:WeatherPoint[]=[{name:'Chicago, Illinois, United States',latitude:41.8781,longitude:-87.6298},{name:'London, United Kingdom',latitude:51.5074,longitude:-.1278},{name:'Tokyo, Japan',latitude:35.6762,longitude:139.6503},{name:'Reykjavík, Iceland',latitude:64.1466,longitude:-21.9426}];
function localTime(time:number,timezone:string) {try{return new Intl.DateTimeFormat('en-US',{timeZone:timezone,hour:'numeric',minute:'2-digit',month:'short',day:'numeric'}).format(new Date(time*1000));}catch{return new Date(time*1000).toUTCString();}}

export default function WeatherAtlas() {
  const [destination,setDestination]=useState<WeatherPoint|null>(null);
  const destinationRef=useRef<WeatherPoint|null>(null);
  const [point,setPoint]=useState<WeatherPoint|null>(null);
  const [weather,setWeather]=useState<WeatherData|null>(null);
  const [focused,setFocused]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [results,setResults]=useState<WeatherPoint[]>([]);
  const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState('');
  const [unit,setUnit]=useState<'C'|'F'>('F');
  const [paused,setPaused]=useState(false);
  const [refresh,setRefresh]=useState(0);
  const onMoving=useCallback(()=>setFocused(false),[]);
  const onSelect=useCallback((location:WeatherPoint)=>{
    const known=destinationRef.current;
    const next=known&&Math.abs(known.latitude-location.latitude)<.03&&Math.abs(known.longitude-location.longitude)<.03?{...location,name:known.name}:location;
    setPoint(next);setFocused(true);
  },[]);
  function choose(location:WeatherPoint) {destinationRef.current=location;setDestination({...location});onSelect(location);setQuery('');setResults([]);setSearchError('');}
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const lat=Number(params.get('lat')),lon=Number(params.get('lon'));
    if(params.has('lat')&&params.has('lon')&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)choose({latitude:lat,longitude:lon,name:'Selected location'});
    // Initialize a shared globe selection once; no location permission is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(query.trim().length<2){setResults([]);setSearching(false);setSearchError('');return;}
    const abort=new AbortController();
    setSearching(true);setSearchError('');setResults([]);
    const timer=setTimeout(async()=>{
      try {const response=await fetch('/api/weather/search?q='+encodeURIComponent(query.trim()),{signal:abort.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);if(!abort.signal.aborted){setResults(body.results||[]);if(!body.results?.length)setSearchError('No matching places. Try a city and country.');}}
      catch(error){if(!abort.signal.aborted)setSearchError((error as Error).message||'Search unavailable.');}
      finally{if(!abort.signal.aborted)setSearching(false);}
    },450);
    return()=>{clearTimeout(timer);abort.abort();};
  },[query]);
  useEffect(()=>{
    if(!point)return;
    const abort=new AbortController();
    setLoading(true);setWeather(null);setError('');
    async function load() {
      try {
        const response=await fetch(`/api/weather?lat=${point!.latitude.toFixed(3)}&lon=${point!.longitude.toFixed(3)}`,{signal:abort.signal});
        const body=await response.json();
        if(!response.ok||!validWeather(body))throw new Error(body.error||'Incomplete weather data.');
        if(!abort.signal.aborted)setWeather(body);
      } catch(error){if(!abort.signal.aborted)setError((error as Error).message||'Weather unavailable.');}
      finally{if(!abort.signal.aborted)setLoading(false);}
    }
    load();
    const timer=setInterval(()=>{if(!document.hidden)setRefresh(value=>value+1);},300000);
    return()=>{abort.abort();clearInterval(timer);};
  },[point,refresh]);
  const current=weather?.current;
  const condition=current?describeWeather(current.weather_code,current.temperature_2m):null;
  const stale=current?Date.now()/1000-current.time>5400:false;
  const showScene=focused&&!!current&&!stale;
  const upcoming=weather?.hourly?.time.map((time,index)=>({time,temp:weather.hourly!.temperature_2m[index],code:weather.hourly!.weather_code[index]})).filter(hour=>hour.time>weather.current.time&&Number.isFinite(hour.temp)&&Number.isFinite(hour.code)).slice(0,6)||[];
  function submit(event:FormEvent){event.preventDefault();if(results.length===1)choose(results[0]);}

  return <div className="weather-atlas">
    <header className="atlas-header"><div><Link href="/" className="atlas-back"><ArrowLeft size={14}/> Observatory</Link><p className="eyebrow">TERRAGUARD / WEATHER ATLAS</p><h1>Feel the atmosphere.</h1><p>From a planet-wide perspective to the weather where you are.</p></div><div className="atlas-live"><span/> CURRENT MODEL CONDITIONS<small>Global coverage · refreshed every 5 minutes</small></div></header>
    <div className="atlas-layout">
      <section className="atlas-stage" aria-label="Interactive weather exploration">
        <WeatherGlobe destination={destination} onSelect={onSelect} onMoving={onMoving}/>
        {showScene&&condition&&<WeatherAtmosphere scene={condition.scene} night={current!.is_day===0} paused={paused}/>}
        <div className="atlas-stage-heading"><span>01 / EXPLORE</span><h2>{showScene?condition?.label:'A world of weather.'}</h2><p>{showScene?'An artistic scene driven by conditions at the selected point.':'Click a place, or zoom in until the crosshair is over a city.'}</p></div>
        <div className="atlas-stage-bottom"><span>{point&&focused?`${point.latitude.toFixed(3)}° / ${point.longitude.toFixed(3)}°`:'DRAG TO EXPLORE · SCROLL TO ZOOM'}</span><button onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume weather animation':'Pause weather animation'}>{paused?<Play size={14}/>:<Pause size={14}/>} Effects {paused?'off':'on'}</button></div>
      </section>
      <aside className="atlas-panel">
        <p className="eyebrow">02 / FIND YOUR FORECAST</p>
        <form className="atlas-search" onSubmit={submit} role="search"><Search size={17}/><input aria-label="Search city or country" placeholder="Search a city or country…" value={query} onChange={event=>setQuery(event.target.value)} maxLength={80}/></form>
        {(searching||searchError||results.length>0)&&<div className="atlas-results" aria-live="polite">{searching&&<p>Searching places…</p>}{searchError&&<p>{searchError}</p>}{results.map((place,index)=><button key={index} onClick={()=>choose(place)}>{place.name}<ArrowUpRight size={15}/></button>)}</div>}
        <div className="atlas-cities">{cities.map(city=><button key={city.name} onClick={()=>choose(city)}>{city.name.split(',')[0]}</button>)}</div>
        <div className="atlas-reading" aria-live="polite" aria-busy={loading}>
          {!point&&<div className="atlas-empty"><Cloud size={42}/><h2>Every place has a story.</h2><p>Start with Chicago, search for your city, or select anywhere on the globe. Rain, snow, clouds and sunshine will follow the weather data.</p></div>}
          {point&&<><div className="atlas-place"><div><span>SELECTED LOCATION</span><h2>{point.name}</h2><small>{point.latitude.toFixed(3)}°, {point.longitude.toFixed(3)}°</small></div><button className="atlas-unit" onClick={()=>setUnit(value=>value==='C'?'F':'C')} aria-label={'Switch to '+(unit==='C'?'Fahrenheit':'Celsius')}>°{unit} ⇄</button></div>
            {!focused&&<p className="atlas-note">Exploring the globe. This card keeps your last selected point; local effects return when you stop over a region.</p>}
            {loading&&<p className="atlas-status">Reading the atmosphere…</p>}
            {error&&<div className="atlas-error" role="alert"><p>{error}</p><button onClick={()=>setRefresh(value=>value+1)}>Try again</button></div>}
            {current&&weather&&<><div className="atlas-temperature">{temperature(current.temperature_2m,unit)}<sup>°{unit}</sup></div><p className="atlas-condition">{condition?.label}<span>Feels like {temperature(current.apparent_temperature,unit)}°</span></p>
              <div className="atlas-metrics"><div><Wind size={17}/><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} <small>km/h</small></strong></div><div><Droplets size={17}/><span>Humidity</span><strong>{current.relative_humidity_2m}<small>%</small></strong></div><div><Cloud size={17}/><span>Cloud cover</span><strong>{current.cloud_cover}<small>%</small></strong></div><div><Thermometer size={17}/><span>Precipitation / {Math.round(current.interval/60)} min</span><strong>{current.precipitation} <small>mm</small></strong></div></div>
              <div className="atlas-updated"><div><strong>{stale?'OLDER DATA — EFFECTS HIDDEN':'MODEL VALID TIME'}</strong><span>{localTime(current.time,weather.timezone)} · {weather.timezone}</span></div><button aria-label="Refresh weather" onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={15}/></button></div>
              {!!upcoming.length&&<div className="atlas-hours"><h3>The next few hours <span>Forecast</span></h3><div>{upcoming.map(hour=><article key={hour.time}><time>{new Intl.DateTimeFormat('en-US',{timeZone:weather.timezone,hour:'numeric'}).format(hour.time*1000)}</time><strong>{temperature(hour.temp,unit)}°</strong><small>{describeWeather(hour.code,hour.temp).label}</small></article>)}</div></div>}
            </>}
          </>}
        </div>
        <p className="atlas-disclosure">Weather at a selected point, not an entire country. Animations are illustrative—not radar, satellite imagery, or live footage. Conditions are model estimates and can differ from what you experience.</p>
        <a className="atlas-source" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather & geocoding by Open-Meteo / GeoNames <ArrowUpRight size={12}/></a>
      </aside>
    </div>
  </div>;
}
