'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { feature } from 'topojson-client';
import type { WeatherPoint } from '@/lib/weather';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function WeatherGlobe({destination,onSelect,onMoving}:{destination:WeatherPoint|null;onSelect:(p:WeatherPoint)=>void;onMoving:()=>void}) {
  const host=useRef<HTMLDivElement>(null);
  const map=useRef<maplibregl.Map|null>(null);
  const select=useRef(onSelect), moving=useRef(onMoving);
  select.current=onSelect; moving.current=onMoving;
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const [detailError,setDetailError]=useState(false);
  useEffect(()=>{
    let disposed=false;
    let globe:maplibregl.Map|undefined;
    let timer:ReturnType<typeof setTimeout>;
    const abort=new AbortController();
    async function initialize() {
      try {
        const response=await fetch('/geo/countries-110m.json',{signal:abort.signal});
        if(!response.ok) throw new Error('Geometry unavailable');
        const topology=await response.json();
        if(disposed||!host.current)return;
        maplibregl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');
        globe=new maplibregl.Map({container:host.current,center:[-30,24],zoom:host.current.clientWidth<500?.85:1.35,minZoom:0,maxZoom:12,attributionControl:false,
          style:{version:8,projection:{type:'globe'},sky:{'atmosphere-blend':['interpolate',['linear'],['zoom'],0,1,5,1,7,0]},sources:{
            countries:{type:'geojson',data:feature(topology,topology.objects.countries),attribution:'Natural Earth'},
            streets:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,minzoom:5,maxzoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'},
          },layers:[
            {id:'ocean',type:'background',paint:{'background-color':'#102935'}},
            {id:'land',type:'fill',source:'countries',paint:{'fill-color':'#315f62'}},
            {id:'borders',type:'line',source:'countries',paint:{'line-color':'#90c5b0','line-width':.7}},
            {id:'street-detail',type:'raster',source:'streets',minzoom:5,paint:{'raster-opacity':['interpolate',['linear'],['zoom'],5,0,6,0.85],'raster-saturation':-.65,'raster-brightness-max':.65}},
          ]}});
        map.current=globe;
        globe.addControl(new maplibregl.NavigationControl({showCompass:true}),'top-right');
        globe.addControl(new maplibregl.AttributionControl({compact:false}),'bottom-left');
        globe.on('error',event=>{if((event as unknown as {sourceId?:string}).sourceId==='streets')setDetailError(true);});
        globe.on('load',()=>{if(!disposed)setReady(true);});
        globe.on('movestart',()=>{clearTimeout(timer);moving.current();});
        globe.on('moveend',()=>{
          clearTimeout(timer);
          if(globe!.getZoom()<3.5)return;
          timer=setTimeout(()=>{
            const center=globe!.getCenter();
            const longitude=((center.lng+180)%360+360)%360-180;
            select.current({latitude:center.lat,longitude,name:'Selected location'});
          },650);
        });
        globe.on('click',event=>{
          globe!.flyTo({center:event.lngLat,zoom:Math.max(6.5,globe!.getZoom()),duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100});
        });
      } catch(error) {if(!disposed&&(error as Error).name!=='AbortError')setError('The 3D map is unavailable on this device. City search and weather details still work.');}
    }
    initialize();
    return()=>{disposed=true;abort.abort();clearTimeout(timer);globe?.remove();map.current=null;};
  },[]);
  useEffect(()=>{
    if(!ready||!destination||!map.current)return;
    map.current.flyTo({center:[destination.longitude,destination.latitude],zoom:8,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1600});
  },[destination,ready]);
  return <div className="weather-map-wrap">
    <div className="weather-map" ref={host} aria-label="Weather globe: zoom in or click a location"/>
    <div className="weather-crosshair" aria-hidden="true"><span/><i/></div>
    <button className="atlas-world" onClick={()=>{map.current?.flyTo({zoom:(host.current?.clientWidth||0)<500?.85:1.35,pitch:0,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:900});}}>↗ World view</button>
    {!ready&&!error&&<div className="atlas-map-message">Preparing the weather globe…</div>}
    {error&&<div className="atlas-map-message" role="status">{error}</div>}
    {detailError&&<div className="atlas-tile-warning">Street detail unavailable · weather and country outlines remain available.</div>}
  </div>;
}
