'use client';
import type { CSSProperties } from 'react';
import type { WeatherScene } from '@/lib/weather';

export default function WeatherAtmosphere({scene,night,paused}:{scene:WeatherScene;night:boolean;paused:boolean}) {
  const wet=scene==='rain'||scene==='storm';
  return <div className={'weather-atmosphere atmosphere-'+scene+(night?' atmosphere-night':'')+(paused?' atmosphere-paused':'')} aria-hidden="true" data-scene={scene}>
    <div className="atmosphere-light"/>
    {(wet||scene==='snow'||scene==='clouds'||scene==='fog')&&<div className="cloud-deck"><i/><i/><i/><i/></div>}
    {scene==='fog'&&<div className="fog-bank"/>}
    {(wet||scene==='snow')&&<div className="precipitation">{Array.from({length:wet?65:42},(_,i)=><i key={i} style={{'--x':((i*37)%101)+'%','--delay':(-i*.37)+'s','--duration':(wet?.65+(i%5)*.12:4+(i%6))+'s','--opacity':.2+(i%5)*.13} as CSSProperties}/>)}</div>}
    {scene==='heat'&&<div className="heat-haze"/>}
  </div>;
}
