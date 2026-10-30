'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { feature } from 'topojson-client';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface Signal {
 event_id:string;hazard_type:string;status:string;latitude:number;longitude:number;
 country?:string;nearest_populated_location?:string;severity:string;model_version?:string;
 sources?:{provider:string}[];
 explanation?:{human_summary:string;primary_drivers?:{feature:string;value:number;unit:string}[]};
}
export default function SignalMap({events,selected,onSelect}:{events:Signal[];selected:Signal|null;onSelect:(e:Signal)=>void}){
 const holder=useRef<HTMLDivElement>(null);
 const map=useRef<maplibregl.Map|null>(null);
 const [ready,setReady]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!holder.current)return;
  let m:maplibregl.Map|undefined;let disposed=false;
  const controller=new AbortController();
  async function initialize(){
   try{
    const response=await fetch('/geo/countries-110m.json',{signal:controller.signal});
    if(!response.ok)throw new Error('Map geometry unavailable');
    const topology=await response.json();
    if(disposed)return;
    const countries=feature(topology,topology.objects.countries);
    maplibregl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');
    m=new maplibregl.Map({
     container:holder.current!,
     style:{version:8,sources:{countries:{type:'geojson',data:countries,attribution:'Natural Earth · simplified boundaries'}},layers:[
      {id:'ocean',type:'background',paint:{'background-color':'#0c171c'}},
      {id:'land',type:'fill',source:'countries',paint:{'fill-color':'#1c3238'}},
      {id:'borders',type:'line',source:'countries',paint:{'line-color':'#395359','line-width':0.7}},
     ]},
     center:[20,20],zoom:1.2,minZoom:0.7,maxZoom:7,
    });
    map.current=m;
    m.addControl(new maplibregl.NavigationControl(),'top-right');
    m.on('load',()=>setReady(true));
   } catch {if(!disposed)setError('The map could not initialize. Explore records in the signal feed.');}
  }
  initialize();
  return()=>{disposed=true;controller.abort();m?.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  const markers=events.filter(e=>Number.isFinite(e.latitude)&&Number.isFinite(e.longitude)).map(e=>{
   const el=document.createElement('button');el.className='map-signal';
   el.setAttribute('aria-label',e.hazard_type+' near '+(e.country||'event location'));
   el.addEventListener('click',()=>onSelect(e));
   return new maplibregl.Marker({element:el}).setLngLat([e.longitude,e.latitude]).addTo(map.current!);
  });
  return()=>markers.forEach(m=>m.remove());
 },[events,ready,onSelect]);
 useEffect(()=>{if(selected)map.current?.flyTo({center:[selected.longitude,selected.latitude],zoom:4,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000});},[selected]);
 return <div className="map-surface"><div ref={holder} className="map-canvas"/><span className="map-label">GLOBAL OBSERVATORY <span>/ WGS 84</span></span>{error&&<p className="map-error">{error}</p>}</div>;
}
